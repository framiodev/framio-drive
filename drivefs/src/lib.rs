//! Framio Drive sanal surucusu (WinFsp): okuma + yazma (yerel tampon, arka planda yukleme).
//! NOT: Normal (yonetici OLMAYAN) bir surecten baglanmali; yoksa Gezgin gormez.
use drivenet::auth;
use drivenet::{Drive, DriveFile};
use std::collections::{HashMap, HashSet};
use std::fs::{File, OpenOptions};
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tokio::runtime::Runtime;
use winfsp::filesystem::{
    DirBuffer, DirInfo, DirMarker, FileInfo, FileSecurity, FileSystemContext, OpenFileInfo,
    VolumeInfo, WideNameInfo,
};
use winfsp::host::{FileSystemHost, FineGuard, VolumeParams};
use winfsp::{winfsp_init, FspError, Result, U16CStr};

const GIB: u64 = 1024 * 1024 * 1024;
const BLOCK: u64 = 4 * 1024 * 1024; // okuma blogu: 4 MiB
const LIST_TTL: Duration = Duration::from_secs(30);
const TOKEN_TTL: Duration = Duration::from_secs(45 * 60);
const QUOTA_TTL: Duration = Duration::from_secs(60);
const FOLDER: &str = "application/vnd.google-apps.folder";

fn st(code: u32) -> FspError {
    FspError::NTSTATUS(code as i32)
}
static LOGS: Mutex<Vec<(u64, String)>> = Mutex::new(Vec::new());
static LOGSEQ: AtomicU64 = AtomicU64::new(0);
static UP_OK: AtomicU64 = AtomicU64::new(0);
static UP_FAIL: AtomicU64 = AtomicU64::new(0);
/// Etkinlik günlüğüne satır ekler (uygulama arayüzü okur).
pub fn push_log(s: String) {
    println!("{s}");
    let n = LOGSEQ.fetch_add(1, Ordering::SeqCst) + 1;
    let mut g = LOGS.lock().unwrap();
    g.push((n, s));
    let l = g.len();
    if l > 300 { g.drain(0..l - 300); }
}
pub fn recent_logs(since: u64) -> Vec<(u64, String)> { LOGS.lock().unwrap().iter().filter(|(n, _)| *n > since).cloned().collect() }
/// (başarıyla yüklenen, başarısız) — bu oturumda.
pub fn stats() -> (u64, u64) { (UP_OK.load(Ordering::SeqCst), UP_FAIL.load(Ordering::SeqCst)) }
pub fn note_ok(name: &str) { UP_OK.fetch_add(1, Ordering::SeqCst); push_log(format!("Yüklendi: {name}")); }
pub fn note_fail(name: &str, why: &str) { UP_FAIL.fetch_add(1, Ordering::SeqCst); push_log(format!("Yüklenemedi: {name} — {why}")); }

fn not_found() -> FspError {
    st(0xC000_0034) // STATUS_OBJECT_NAME_NOT_FOUND
}
fn io_err<E: std::fmt::Debug>(e: E) -> FspError {
    eprintln!("[drivefs] hata: {e:?}");
    st(0xC000_0185) // STATUS_IO_DEVICE_ERROR
}

fn filetime_now() -> u64 {
    let d = SystemTime::now().duration_since(UNIX_EPOCH).unwrap();
    (d.as_secs() + 11_644_473_600) * 10_000_000 + (d.subsec_nanos() / 100) as u64
}

/// "2024-05-01T12:34:56.789Z" -> Windows FILETIME
fn parse_time(s: &str) -> Option<u64> {
    let b = s.as_bytes();
    if b.len() < 19 {
        return None;
    }
    let n = |a: usize, z: usize| s.get(a..z)?.parse::<i64>().ok();
    let (y, m, d) = (n(0, 4)?, n(5, 7)?, n(8, 10)?);
    let (hh, mm, ss) = (n(11, 13)?, n(14, 16)?, n(17, 19)?);
    // days_from_civil
    let y2 = if m <= 2 { y - 1 } else { y };
    let era = if y2 >= 0 { y2 } else { y2 - 399 } / 400;
    let yoe = y2 - era * 400;
    let mp = (m + 9) % 12;
    let doy = (153 * mp + 2) / 5 + d - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    let days = era * 146097 + doe - 719468;
    let secs = days * 86400 + hh * 3600 + mm * 60 + ss;
    if secs < 0 {
        return None;
    }
    Some((secs as u64 + 11_644_473_600) * 10_000_000)
}

fn safe_name(name: &str) -> String {
    let mut s: String = name
        .chars()
        .map(|c| if c.is_control() || "<>:\"/\\|?*".contains(c) { '_' } else { c })
        .collect();
    while s.ends_with('.') || s.ends_with(' ') {
        s.pop();
    }
    if s.is_empty() {
        s = "_".into();
    }
    s
}

#[derive(Clone)]
struct Entry {
    name: String,
    id: String,
    dir: bool,
    size: u64,
    mtime: u64,
}

fn entries_from(files: Vec<DriveFile>, fallback: u64) -> Vec<Entry> {
    let mut used: HashSet<String> = HashSet::new();
    let mut out = Vec::new();
    for f in files {
        let dir = f.mime_type == FOLDER;
        // Google Dokumanlari/Sheets/kisayollar v1'de gizli (indirilebilir icerigi yok)
        if !dir && f.mime_type.starts_with("application/vnd.google-apps.") {
            continue;
        }
        let mut name = safe_name(&f.name);
        if !used.insert(name.to_lowercase()) {
            let tag: String = f.id.chars().take(6).collect();
            name = match name.rfind('.') {
                Some(i) if i > 0 => format!("{} ({}){}", &name[..i], tag, &name[i..]),
                _ => format!("{name} ({tag})"),
            };
            used.insert(name.to_lowercase());
        }
        out.push(Entry {
            name,
            id: f.id,
            dir,
            size: if dir { 0 } else { f.size.as_deref().and_then(|x| x.parse().ok()).unwrap_or(0) },
            mtime: f.modified_time.as_deref().and_then(parse_time).unwrap_or(fallback),
        });
    }
    out.sort_by(|a, b| b.dir.cmp(&a.dir).then(a.name.to_lowercase().cmp(&b.name.to_lowercase())));
    out
}

#[derive(Clone)]
struct Node {
    id: String,
    dir: bool,
    size: u64,
    mtime: u64,
    parent: String,
    name: String,
}

/// Henuz Drive'a yuklenmemis (yerel tamponda bekleyen) dosya.
#[derive(Clone)]
struct Pending {
    parent: String,
    name: String,
    path: PathBuf,
    size: u64,
    mtime: u64,
}

struct Core {
    rt: Runtime,
    client: auth::Client,
    email: String,
    created: u64,
    tmpdir: PathBuf,
    counter: AtomicU64,
    drive: Mutex<Option<(Arc<Drive>, Instant)>>,
    lists: Mutex<HashMap<String, (Instant, Arc<Vec<Entry>>)>>,
    quota: Mutex<Option<(Instant, u64, u64)>>, // (zaman, toplam, kullanilan)
    pending: Mutex<HashMap<String, Pending>>,   // "tmp:N" -> bekleyen dosya
}

impl Core {
    fn drive(&self) -> Result<Arc<Drive>> {
        let mut g = self.drive.lock().unwrap();
        if let Some((d, t)) = &*g {
            if t.elapsed() < TOKEN_TTL {
                return Ok(d.clone());
            }
        }
        let tok = self.rt.block_on(auth::access_token(&self.client, &self.email)).map_err(io_err)?;
        let d = Arc::new(Drive::new(tok));
        *g = Some((d.clone(), Instant::now()));
        Ok(d)
    }

    fn list(&self, id: &str) -> Result<Arc<Vec<Entry>>> {
        if let Some((t, v)) = self.lists.lock().unwrap().get(id) {
            if t.elapsed() < LIST_TTL {
                return Ok(v.clone());
            }
        }
        let d = self.drive()?;
        let files = self.rt.block_on(d.list_children(id)).map_err(io_err)?;
        let mut v = entries_from(files, self.created);
        // Bekleyen (yuklenmekte olan) dosyalari listeye kat
        for (tid, p) in self.pending.lock().unwrap().iter() {
            if p.parent == id && !v.iter().any(|e| e.name.eq_ignore_ascii_case(&p.name)) {
                v.push(Entry { name: p.name.clone(), id: tid.clone(), dir: false, size: p.size, mtime: p.mtime });
            }
        }
        let v = Arc::new(v);
        self.lists.lock().unwrap().insert(id.to_string(), (Instant::now(), v.clone()));
        Ok(v)
    }

    fn invalidate(&self, parent: &str) {
        self.lists.lock().unwrap().remove(parent);
    }

    /// Onbellekteki listeye hemen bir giris ekler (Drive tutarli olana kadar gorunsun).
    fn cache_add(&self, parent: &str, e: Entry) {
        let mut g = self.lists.lock().unwrap();
        if let Some((t, v)) = g.get(parent).cloned() {
            let mut nv: Vec<Entry> = (*v).clone();
            nv.retain(|x| !x.name.eq_ignore_ascii_case(&e.name));
            nv.push(e);
            g.insert(parent.to_string(), (t, Arc::new(nv)));
        }
    }

    fn resolve(&self, path: &U16CStr) -> Result<Node> {
        let s = path.to_string_lossy();
        self.resolve_str(&s)
    }

    fn resolve_str(&self, s: &str) -> Result<Node> {
        let mut cur = Node { id: "root".into(), dir: true, size: 0, mtime: self.created, parent: String::new(), name: String::new() };
        for comp in s.split('\\').filter(|c| !c.is_empty()) {
            if !cur.dir {
                return Err(not_found());
            }
            let list = self.list(&cur.id)?;
            let lc = comp.to_lowercase();
            match list.iter().find(|e| e.name.to_lowercase() == lc) {
                Some(e) => {
                    cur = Node { id: e.id.clone(), dir: e.dir, size: e.size, mtime: e.mtime, parent: cur.id.clone(), name: e.name.clone() }
                }
                None => return Err(not_found()),
            }
        }
        Ok(cur)
    }

    /// "\a\b\c.txt" -> (ust klasor dugumu, "c.txt")
    fn split_parent(&self, path: &str) -> Result<(Node, String)> {
        let t = path.trim_end_matches('\\');
        let i = t.rfind('\\').ok_or_else(not_found)?;
        let parent = self.resolve_str(&t[..i])?;
        if !parent.dir {
            return Err(not_found());
        }
        Ok((parent, t[i + 1..].to_string()))
    }

    fn quota(&self) -> (u64, u64) {
        if let Some((t, tot, used)) = &*self.quota.lock().unwrap() {
            if t.elapsed() < QUOTA_TTL {
                return (*tot, *used);
            }
        }
        let fetched = self.drive().and_then(|d| self.rt.block_on(d.storage_quota()).map_err(io_err));
        let mut g = self.quota.lock().unwrap();
        match fetched {
            Ok((limit, usage)) => {
                let total = limit.unwrap_or(usage + 1024 * GIB); // sinirsiz: gorsel amacli
                *g = Some((Instant::now(), total, usage));
                (total, usage)
            }
            Err(_) => g.map(|(_, a, b)| (a, b)).unwrap_or((15 * GIB, 0)),
        }
    }

    fn new_tmp_path(&self) -> PathBuf {
        let n = self.counter.fetch_add(1, Ordering::SeqCst);
        self.tmpdir.join(format!("{}_{}.bin", std::process::id(), n))
    }
}

fn hash_id(id: &str) -> u64 {
    let mut h: u64 = 0xcbf29ce484222325;
    for b in id.bytes() {
        h ^= b as u64;
        h = h.wrapping_mul(0x100000001b3);
    }
    h
}

fn make_info(dir: bool, size: u64, mtime: u64, id: &str) -> FileInfo {
    FileInfo {
        file_attributes: if dir { 0x10 } else { 0x80 },
        allocation_size: (size + 4095) / 4096 * 4096,
        file_size: size,
        creation_time: mtime,
        last_access_time: mtime,
        last_write_time: mtime,
        change_time: mtime,
        index_number: hash_id(id),
        ..FileInfo::default()
    }
}

struct Local {
    path: PathBuf,
    file: File,
    dirty: bool,
}

struct Ctx {
    id: Mutex<String>,
    parent: Mutex<String>,
    name: Mutex<String>,
    dir: bool,
    size: AtomicU64,
    mtime: AtomicU64,
    dirbuf: DirBuffer,
    block: Mutex<Option<(u64, Vec<u8>)>>,
    local: Mutex<Option<Local>>,
    del: AtomicBool,
}

impl Ctx {
    fn new(id: String, parent: String, name: String, dir: bool, size: u64, mtime: u64) -> Ctx {
        Ctx {
            id: Mutex::new(id),
            parent: Mutex::new(parent),
            name: Mutex::new(name),
            dir,
            size: AtomicU64::new(size),
            mtime: AtomicU64::new(mtime),
            dirbuf: DirBuffer::new(),
            block: Mutex::new(None),
            local: Mutex::new(None),
            del: AtomicBool::new(false),
        }
    }
    fn id(&self) -> String {
        self.id.lock().unwrap().clone()
    }
    fn info(&self) -> FileInfo {
        make_info(self.dir, self.size.load(Ordering::SeqCst), self.mtime.load(Ordering::SeqCst), &self.id())
    }
}

struct Fs {
    core: Arc<Core>,
    label: String,
}

impl Fs {
    /// Yazma icin yerel tamponu hazirla (mevcut dosya ise once indir).
    fn ensure_local(&self, ctx: &Ctx, truncate: bool) -> Result<()> {
        let mut g = ctx.local.lock().unwrap();
        if g.is_some() {
            return Ok(());
        }
        let id = ctx.id();
        let size = ctx.size.load(Ordering::SeqCst);
        // Bekleyen (tmp) dosyanin tamponu zaten var
        let existing_tmp = self.core.pending.lock().unwrap().get(&id).map(|p| p.path.clone());
        let path = if let Some(p) = existing_tmp {
            p
        } else {
            let p = self.core.new_tmp_path();
            if !truncate && size > 0 {
                let d = self.core.drive()?;
                self.core.rt.block_on(d.download(&id, &p)).map_err(io_err)?;
            }
            p
        };
        let file = OpenOptions::new().read(true).write(true).create(true).open(&path).map_err(io_err)?;
        if truncate {
            file.set_len(0).map_err(io_err)?;
        }
        *g = Some(Local { path, file, dirty: false });
        Ok(())
    }

    fn mark(&self, ctx: &Ctx, size: u64) {
        ctx.size.store(size, Ordering::SeqCst);
        ctx.mtime.store(filetime_now(), Ordering::SeqCst);
        if let Some(l) = ctx.local.lock().unwrap().as_mut() {
            l.dirty = true;
        }
    }

    /// Tamponu kapat ve Drive'a arka planda yukle.
    fn finish(&self, ctx: &Ctx) {
        let local = ctx.local.lock().unwrap().take();
        let Some(l) = local else { return };
        if !l.dirty {
            drop(l.file);
            // Bekleyen degilse tamponu sil
            if !self.core.pending.lock().unwrap().values().any(|p| p.path == l.path) {
                let _ = std::fs::remove_file(&l.path);
            }
            return;
        }
        let _ = l.file.sync_all();
        drop(l.file);
        {
            let n = ctx.name.lock().unwrap().to_lowercase();
            let junk = ["thumbs.db", "desktop.ini", ".ds_store"].contains(&n.as_str()) || n.starts_with("~$");
            if junk {
                // Windows/Office'in urettigi gecici dosyalar Drive'a yuklenmez
                self.core.pending.lock().unwrap().remove(&ctx.id());
                let _ = std::fs::remove_file(&l.path);
                return;
            }
        }
        let size = std::fs::metadata(&l.path).map(|m| m.len()).unwrap_or(0);
        let mtime = ctx.mtime.load(Ordering::SeqCst);
        let id = ctx.id();
        let parent = ctx.parent.lock().unwrap().clone();
        let name = ctx.name.lock().unwrap().clone();
        let tid = if id.starts_with("tmp:") {
            id.clone()
        } else {
            format!("tmp:u{}", self.core.counter.fetch_add(1, Ordering::SeqCst))
        };
        let existing = if id.starts_with("tmp:") { None } else { Some(id.clone()) };
        self.core.pending.lock().unwrap().insert(
            tid.clone(),
            Pending { parent: parent.clone(), name: name.clone(), path: l.path.clone(), size, mtime },
        );
        if let Some(eid) = &existing {
            // Var olan dosya: listede boyutu hemen guncelle
            self.core.cache_add(&parent, Entry { name: name.clone(), id: eid.clone(), dir: false, size, mtime });
        } else {
            self.core.cache_add(&parent, Entry { name: name.clone(), id: tid.clone(), dir: false, size, mtime });
        }
        let core = self.core.clone();
        self.core.rt.spawn(async move {
            let mut attempt = 0u32;
            loop {
                attempt += 1;
                let res: std::result::Result<(), String> = async {
                    let tok = auth::access_token(&core.client, &core.email).await.map_err(|e| format!("{e:?}"))?;
                    let d = Drive::new(tok);
                    let session = match &existing {
                        Some(eid) => d.start_update(eid, size).await,
                        None => d.start_upload(&name, &parent, size).await,
                    }
                    .map_err(|e| format!("{e:?}"))?;
                    push_log(format!("Yükleniyor: {name} ({:.1} MB)", size as f64 / 1048576.0));
                    let mut last = 0u64;
                    d.upload_file(&session, &l.path, |c| {
                        let pct = c * 100 / size.max(1);
                        if pct >= last + 10 || c >= size {
                            last = pct;
                            println!("[drivefs] yukleniyor: {name} %{pct} ({:.0} / {:.0} MB)", c as f64 / 1048576.0, size as f64 / 1048576.0);
                        }
                    }).await.map_err(|e| format!("{e:?}"))?;
                    Ok(())
                }
                .await;
                match res {
                    Ok(()) => {
                        core.pending.lock().unwrap().remove(&tid);
                        let _ = std::fs::remove_file(&l.path);
                        core.invalidate(&parent);
                        note_ok(&name);
                        break;
                    }
                    Err(e) => {
                        eprintln!("[drivefs] yukleme hatasi ({name}), deneme {attempt}: {e}");
                        if attempt >= 8 {
                            note_fail(&name, &format!("yerel kopya: {}", l.path.display()));
                            break;
                        }
                        tokio::time::sleep(Duration::from_secs(5 * attempt as u64)).await;
                    }
                }
            }
        });
    }
}

impl FileSystemContext for Fs {
    type FileContext = Ctx;

    fn get_security_by_name(
        &self,
        file_name: &U16CStr,
        _sd: Option<&mut [std::ffi::c_void]>,
        _resolver: impl FnOnce(&U16CStr) -> Option<FileSecurity>,
    ) -> Result<FileSecurity> {
        let n = self.core.resolve(file_name)?;
        Ok(FileSecurity { reparse: false, sz_security_descriptor: 0, attributes: if n.dir { 0x10 } else { 0x80 } })
    }

    fn open(
        &self,
        file_name: &U16CStr,
        _create_options: u32,
        _granted_access: winfsp_sys::FILE_ACCESS_RIGHTS,
        file_info: &mut OpenFileInfo,
    ) -> Result<Ctx> {
        let n = self.core.resolve(file_name)?;
        *file_info.as_mut() = make_info(n.dir, n.size, n.mtime, &n.id);
        Ok(Ctx::new(n.id, n.parent, n.name, n.dir, n.size, n.mtime))
    }

    fn create(
        &self,
        file_name: &U16CStr,
        create_options: u32,
        _granted_access: winfsp_sys::FILE_ACCESS_RIGHTS,
        _file_attributes: winfsp_sys::FILE_FLAGS_AND_ATTRIBUTES,
        _security_descriptor: Option<&[std::ffi::c_void]>,
        _allocation_size: u64,
        _extra_buffer: Option<&[u8]>,
        _extra_buffer_is_reparse_point: bool,
        file_info: &mut OpenFileInfo,
    ) -> Result<Ctx> {
        let path = file_name.to_string_lossy();
        let (parent, name) = self.core.split_parent(&path)?;
        let list = self.core.list(&parent.id)?;
        if list.iter().any(|e| e.name.eq_ignore_ascii_case(&name)) {
            return Err(st(0xC000_0035)); // STATUS_OBJECT_NAME_COLLISION
        }
        let now = filetime_now();
        let is_dir = create_options & 0x1 != 0; // FILE_DIRECTORY_FILE
        if is_dir {
            let d = self.core.drive()?;
            let id = self.core.rt.block_on(d.create_folder(&name, &parent.id)).map_err(io_err)?;
            self.core.cache_add(&parent.id, Entry { name: name.clone(), id: id.clone(), dir: true, size: 0, mtime: now });
            *file_info.as_mut() = make_info(true, 0, now, &id);
            return Ok(Ctx::new(id, parent.id, name, true, 0, now));
        }
        let tid = format!("tmp:{}", self.core.counter.fetch_add(1, Ordering::SeqCst));
        let tmp = self.core.new_tmp_path();
        let file = OpenOptions::new().read(true).write(true).create(true).truncate(true).open(&tmp).map_err(io_err)?;
        self.core.pending.lock().unwrap().insert(
            tid.clone(),
            Pending { parent: parent.id.clone(), name: name.clone(), path: tmp.clone(), size: 0, mtime: now },
        );
        self.core.cache_add(&parent.id, Entry { name: name.clone(), id: tid.clone(), dir: false, size: 0, mtime: now });
        let ctx = Ctx::new(tid.clone(), parent.id, name, false, 0, now);
        // Bos dosya bile olsa yuklensin
        *ctx.local.lock().unwrap() = Some(Local { path: tmp, file, dirty: true });
        *file_info.as_mut() = make_info(false, 0, now, &tid);
        Ok(ctx)
    }

    fn cleanup(&self, ctx: &Ctx, _file_name: Option<&U16CStr>, flags: u32) {
        let delete = flags & 0x01 != 0 && ctx.del.load(Ordering::SeqCst); // FspCleanupDelete
        if delete {
            let id = ctx.id();
            let parent = ctx.parent.lock().unwrap().clone();
            if id.starts_with("tmp:") {
                if let Some(p) = self.core.pending.lock().unwrap().remove(&id) {
                    let _ = std::fs::remove_file(&p.path);
                }
                *ctx.local.lock().unwrap() = None;
            } else if let Ok(d) = self.core.drive() {
                if let Err(e) = self.core.rt.block_on(d.trash(&id)) {
                    eprintln!("[drivefs] silme hatasi: {e:?}");
                }
                *ctx.local.lock().unwrap() = None;
            }
            self.core.invalidate(&parent);
            return;
        }
        if !ctx.dir {
            self.finish(ctx);
        }
    }

    fn close(&self, _ctx: Ctx) {}

    fn flush(&self, ctx: Option<&Ctx>, fi: &mut FileInfo) -> Result<()> {
        if let Some(c) = ctx {
            *fi = c.info();
        }
        Ok(())
    }

    fn get_file_info(&self, ctx: &Ctx, fi: &mut FileInfo) -> Result<()> {
        *fi = ctx.info();
        Ok(())
    }

    fn set_basic_info(
        &self,
        ctx: &Ctx,
        _file_attributes: u32,
        _creation_time: u64,
        last_access_time: u64,
        last_write_time: u64,
        _last_change_time: u64,
        fi: &mut FileInfo,
    ) -> Result<()> {
        let _ = last_access_time;
        if last_write_time != 0 && last_write_time != u64::MAX {
            ctx.mtime.store(last_write_time, Ordering::SeqCst);
        }
        *fi = ctx.info();
        Ok(())
    }

    fn set_delete(&self, ctx: &Ctx, _file_name: &U16CStr, delete_file: bool) -> Result<()> {
        if delete_file && ctx.dir {
            let list = self.core.list(&ctx.id())?;
            if !list.is_empty() {
                return Err(st(0xC000_0101)); // STATUS_DIRECTORY_NOT_EMPTY
            }
        }
        ctx.del.store(delete_file, Ordering::SeqCst);
        Ok(())
    }

    fn overwrite(
        &self,
        ctx: &Ctx,
        _file_attributes: winfsp_sys::FILE_FLAGS_AND_ATTRIBUTES,
        _replace_file_attributes: bool,
        _allocation_size: u64,
        _extra_buffer: Option<&[u8]>,
        fi: &mut FileInfo,
    ) -> Result<()> {
        self.ensure_local(ctx, true)?;
        {
            let g = ctx.local.lock().unwrap();
            if let Some(l) = g.as_ref() {
                l.file.set_len(0).map_err(io_err)?;
            }
        }
        self.mark(ctx, 0);
        *fi = ctx.info();
        Ok(())
    }

    fn set_file_size(&self, ctx: &Ctx, new_size: u64, set_allocation_size: bool, fi: &mut FileInfo) -> Result<()> {
        if !set_allocation_size {
            self.ensure_local(ctx, false)?;
            {
                let g = ctx.local.lock().unwrap();
                if let Some(l) = g.as_ref() {
                    l.file.set_len(new_size).map_err(io_err)?;
                }
            }
            self.mark(ctx, new_size);
        }
        *fi = ctx.info();
        Ok(())
    }

    fn rename(&self, ctx: &Ctx, file_name: &U16CStr, new_file_name: &U16CStr, replace_if_exists: bool) -> Result<()> {
        let _ = file_name;
        let new_path = new_file_name.to_string_lossy();
        let (new_parent, new_name) = self.core.split_parent(&new_path)?;
        let list = self.core.list(&new_parent.id)?;
        let id = ctx.id();
        if let Some(t) = list.iter().find(|e| e.name.eq_ignore_ascii_case(&new_name) && e.id != id) {
            if !replace_if_exists {
                return Err(st(0xC000_0035));
            }
            if t.dir {
                return Err(st(0xC000_0022)); // ACCESS_DENIED
            }
            if t.id.starts_with("tmp:") {
                if let Some(p) = self.core.pending.lock().unwrap().remove(&t.id) {
                    let _ = std::fs::remove_file(&p.path);
                }
            } else {
                let d = self.core.drive()?;
                self.core.rt.block_on(d.trash(&t.id)).map_err(io_err)?;
            }
        }
        let old_parent = ctx.parent.lock().unwrap().clone();
        if id.starts_with("tmp:") {
            if let Some(p) = self.core.pending.lock().unwrap().get_mut(&id) {
                p.parent = new_parent.id.clone();
                p.name = new_name.clone();
            }
        } else {
            let d = self.core.drive()?;
            self.core.rt.block_on(d.move_rename(&id, &new_name, &new_parent.id)).map_err(io_err)?;
        }
        *ctx.parent.lock().unwrap() = new_parent.id.clone();
        *ctx.name.lock().unwrap() = new_name;
        self.core.invalidate(&old_parent);
        self.core.invalidate(&new_parent.id);
        Ok(())
    }

    fn read_directory(
        &self,
        ctx: &Ctx,
        _pattern: Option<&U16CStr>,
        marker: DirMarker,
        buffer: &mut [u8],
    ) -> Result<u32> {
        if let Ok(lock) = ctx.dirbuf.acquire(marker.is_none(), None) {
            let list = self.core.list(&ctx.id())?;
            let mut di: DirInfo = DirInfo::new();
            for e in list.iter() {
                di.reset();
                *di.file_info_mut() = make_info(e.dir, e.size, e.mtime, &e.id);
                di.set_name(&e.name)?;
                lock.write(&mut di)?;
            }
            drop(lock);
        }
        Ok(ctx.dirbuf.read(marker, buffer))
    }

    fn read(&self, ctx: &Ctx, buffer: &mut [u8], offset: u64) -> Result<u32> {
        let size = ctx.size.load(Ordering::SeqCst);
        if offset >= size {
            return Err(st(0xC000_0011)); // STATUS_END_OF_FILE
        }
        let want = std::cmp::min(buffer.len() as u64, size - offset) as usize;
        let id = ctx.id();
        // 1) Yazma icin acik yerel tampon varsa oradan oku
        {
            let mut g = ctx.local.lock().unwrap();
            if let Some(l) = g.as_mut() {
                l.file.seek(SeekFrom::Start(offset)).map_err(io_err)?;
                let n = l.file.read(&mut buffer[..want]).map_err(io_err)?;
                return Ok(n as u32);
            }
        }
        // 2) Yuklenmeyi bekleyen dosya: yerel kopyadan oku
        let pend = self.core.pending.lock().unwrap().get(&id).map(|p| p.path.clone());
        if let Some(path) = pend {
            let mut f = File::open(&path).map_err(io_err)?;
            f.seek(SeekFrom::Start(offset)).map_err(io_err)?;
            let n = f.read(&mut buffer[..want]).map_err(io_err)?;
            return Ok(n as u32);
        }
        // 3) Drive'dan 4 MiB'lik bloklarla oku
        let drive = self.core.drive()?;
        let mut blk = ctx.block.lock().unwrap();
        let mut done = 0usize;
        while done < want {
            let pos = offset + done as u64;
            let have = match &*blk {
                Some((s, d)) => pos >= *s && pos < *s + d.len() as u64,
                None => false,
            };
            if !have {
                let bs = pos / BLOCK * BLOCK;
                let be = std::cmp::min(bs + BLOCK, size) - 1;
                let data = self.core.rt.block_on(drive.read_range(&id, bs, be)).map_err(io_err)?;
                if data.is_empty() {
                    break;
                }
                *blk = Some((bs, data));
            }
            let (s, d) = blk.as_ref().unwrap();
            let off = (pos - *s) as usize;
            let n = std::cmp::min(d.len() - off, want - done);
            buffer[done..done + n].copy_from_slice(&d[off..off + n]);
            done += n;
        }
        Ok(done as u32)
    }

    fn write(
        &self,
        ctx: &Ctx,
        buffer: &[u8],
        offset: u64,
        write_to_eof: bool,
        constrained_io: bool,
        fi: &mut FileInfo,
    ) -> Result<u32> {
        self.ensure_local(ctx, false)?;
        let cur = ctx.size.load(Ordering::SeqCst);
        let off = if write_to_eof { cur } else { offset };
        let mut data = buffer;
        if constrained_io {
            if off >= cur {
                *fi = ctx.info();
                return Ok(0);
            }
            let max = (cur - off) as usize;
            if data.len() > max {
                data = &data[..max];
            }
        }
        {
            let mut g = ctx.local.lock().unwrap();
            let l = g.as_mut().ok_or_else(|| io_err("tampon yok"))?;
            l.file.seek(SeekFrom::Start(off)).map_err(io_err)?;
            l.file.write_all(data).map_err(io_err)?;
        }
        let end = off + data.len() as u64;
        self.mark(ctx, std::cmp::max(cur, end));
        *fi = ctx.info();
        Ok(data.len() as u32)
    }

    fn get_volume_info(&self, out: &mut VolumeInfo) -> Result<()> {
        let (total, used) = self.core.quota();
        out.total_size = total;
        out.free_size = total.saturating_sub(used);
        out.set_volume_label(&self.label);
        Ok(())
    }
}


/// WinFsp surucusu yuklu mu?
pub fn winfsp_installed() -> bool {
    winfsp_init().is_ok()
}

/// Bagli sanal surucu. Dusurulunce (Drop) surucu kaldirilir.
pub struct Mount {
    host: FileSystemHost<Fs, FineGuard>,
    core: Arc<Core>,
    pub letter: String,
}

impl Mount {
    /// Yuklenmeyi bekleyen dosya sayisi.
    pub fn pending(&self) -> usize {
        self.core.pending.lock().unwrap().len()
    }
    /// Cikmadan once yuklemelerin bitmesini bekler (en fazla `max` sn).
    pub fn wait_uploads(&self, max: u64) {
        let t = Instant::now();
        while self.pending() > 0 && t.elapsed() < Duration::from_secs(max) {
            std::thread::sleep(Duration::from_secs(1));
        }
    }
    pub fn unmount(&mut self) {
        self.host.stop();
        self.host.unmount();
    }
}

impl Drop for Mount {
    fn drop(&mut self) {
        self.unmount();
    }
}

/// Hesabi `letter` (ornek "X:") harfine ag surucusu olarak baglar.
/// Bloklayici: bir arka plan (spawn_blocking / thread) icinden cagir.
pub fn start(email: &str, letter: &str, share: &str, client: auth::Client) -> std::result::Result<Mount, String> {
    winfsp_init().map_err(|_| "WinFsp yuklu degil".to_string())?;
    let letter = if letter.ends_with(':') { letter.to_string() } else { format!("{letter}:") };
    let rt = tokio::runtime::Builder::new_multi_thread().worker_threads(3).enable_all().build().map_err(|e| e.to_string())?;
    let created = filetime_now();
    let tmpdir = std::env::temp_dir().join("FramioDriveFs");
    let _ = std::fs::create_dir_all(&tmpdir);
    let core = Arc::new(Core {
        rt,
        client,
        email: email.to_string(),
        created,
        tmpdir,
        counter: AtomicU64::new(1),
        drive: Mutex::new(None),
        lists: Mutex::new(HashMap::new()),
        quota: Mutex::new(None),
        pending: Mutex::new(HashMap::new()),
    });
    // Baglanti/token saglam mi diye bir kez dene
    core.drive().map_err(|_| "Drive'a baglanilamadi (oturum suresi dolmus olabilir)".to_string())?;
    core.quota();

    let mut vp = VolumeParams::default();
    vp.sector_size(512)
        .sectors_per_allocation_unit(8)
        .max_component_length(255)
        .case_preserved_names(true)
        .unicode_on_disk(true)
        .read_only_volume(false)
        .volume_creation_time(created)
        .file_info_timeout(1000)
        .dir_info_timeout(1000)
        .volume_info_timeout(5000)
        .filesystem_name("FramioDrive")
        // Prefix dolu => WinFsp.Net: Windows bunu AG surucusu sayar.
        .prefix(format!("\\Framio\\{}", share.replace(' ', "_")));

    let fs = Fs { core: core.clone(), label: share.to_string() };
    let mut host = FileSystemHost::<Fs, FineGuard>::new(vp, fs).map_err(|e| format!("surucu olusturulamadi: {e:?}"))?;
    host.mount(&letter).map_err(|e| format!("{letter} baglanamadi: {e:?}"))?;
    host.start().map_err(|e| format!("dispatcher baslamadi: {e:?}"))?;

    // Drive'daki (web/baska cihaz) degisiklikleri izle; olunca listeleri tazele.
    let c = core.clone();
    core.rt.spawn(async move {
        let mut token: Option<String> = None;
        loop {
            tokio::time::sleep(Duration::from_secs(15)).await;
            let Ok(tok) = auth::access_token(&c.client, &c.email).await else { continue };
            let d = Drive::new(tok);
            match &token {
                None => token = d.changes_start_token().await.ok(),
                Some(t) => {
                    if let Ok((chs, next)) = d.changes_since(t).await {
                        token = Some(next);
                        if !chs.is_empty() {
                            c.lists.lock().unwrap().clear();
                        }
                    }
                }
            }
        }
    });
    Ok(Mount { host, core, letter })
}
