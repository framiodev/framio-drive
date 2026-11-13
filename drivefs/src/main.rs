//! Framio Drive sanal surucusu (WinFsp). Surum 1: SALT OKUNUR.
//! Kullanim: drivefs [hesap@gmail.com] [X:] ["Surucu adi"]
//! NOT: Normal (yonetici OLMAYAN) bir terminalden calistir; yoksa Gezgin gormez.
use drivenet::auth;
use drivenet::{Drive, DriveFile};
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tokio::runtime::Runtime;
use winfsp::filesystem::{
    DirBuffer, DirInfo, DirMarker, FileInfo, FileSecurity, FileSystemContext, OpenFileInfo,
    VolumeInfo, WideNameInfo,
};
use winfsp::host::{FileSystemHost, FineGuard, VolumeParams};
use winfsp::{winfsp_init_or_die, FspError, Result, U16CStr};

const GIB: u64 = 1024 * 1024 * 1024;
const BLOCK: u64 = 4 * 1024 * 1024; // okuma blogu: 4 MiB
const LIST_TTL: Duration = Duration::from_secs(30);
const TOKEN_TTL: Duration = Duration::from_secs(45 * 60);
const QUOTA_TTL: Duration = Duration::from_secs(60);
const FOLDER: &str = "application/vnd.google-apps.folder";

fn st(code: u32) -> FspError {
    FspError::NTSTATUS(code as i32)
}
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
}

struct Core {
    rt: Runtime,
    client: auth::Client,
    email: String,
    created: u64,
    drive: Mutex<Option<(Arc<Drive>, Instant)>>,
    lists: Mutex<HashMap<String, (Instant, Arc<Vec<Entry>>)>>,
    quota: Mutex<Option<(Instant, u64, u64)>>, // (zaman, toplam, kullanilan)
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
        let v = Arc::new(entries_from(files, self.created));
        self.lists.lock().unwrap().insert(id.to_string(), (Instant::now(), v.clone()));
        Ok(v)
    }

    fn resolve(&self, path: &U16CStr) -> Result<Node> {
        let s = path.to_string_lossy();
        let mut cur = Node { id: "root".into(), dir: true, size: 0, mtime: self.created };
        for comp in s.split('\\').filter(|c| !c.is_empty()) {
            if !cur.dir {
                return Err(not_found());
            }
            let list = self.list(&cur.id)?;
            let lc = comp.to_lowercase();
            match list.iter().find(|e| e.name.to_lowercase() == lc) {
                Some(e) => cur = Node { id: e.id.clone(), dir: e.dir, size: e.size, mtime: e.mtime },
                None => return Err(not_found()),
            }
        }
        Ok(cur)
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
        file_attributes: if dir { 0x10 } else { 0x80 } | 0x01, // READONLY (v1 salt okunur)
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

struct Ctx {
    id: String,
    dir: bool,
    size: u64,
    mtime: u64,
    dirbuf: DirBuffer,
    block: Mutex<Option<(u64, Vec<u8>)>>,
}

struct Fs {
    core: Core,
    label: String,
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
        Ok(FileSecurity {
            reparse: false,
            sz_security_descriptor: 0,
            attributes: if n.dir { 0x10 } else { 0x80 } | 0x01,
        })
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
        Ok(Ctx { id: n.id, dir: n.dir, size: n.size, mtime: n.mtime, dirbuf: DirBuffer::new(), block: Mutex::new(None) })
    }

    fn close(&self, _ctx: Ctx) {}

    fn get_file_info(&self, ctx: &Ctx, fi: &mut FileInfo) -> Result<()> {
        *fi = make_info(ctx.dir, ctx.size, ctx.mtime, &ctx.id);
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
            let list = self.core.list(&ctx.id)?;
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
        if offset >= ctx.size {
            return Err(st(0xC000_0011)); // STATUS_END_OF_FILE
        }
        let want = std::cmp::min(buffer.len() as u64, ctx.size - offset) as usize;
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
                let be = std::cmp::min(bs + BLOCK, ctx.size) - 1;
                let data = self.core.rt.block_on(drive.read_range(&ctx.id, bs, be)).map_err(io_err)?;
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

    fn get_volume_info(&self, out: &mut VolumeInfo) -> Result<()> {
        let (total, used) = self.core.quota();
        out.total_size = total;
        out.free_size = total.saturating_sub(used);
        out.set_volume_label(&self.label);
        Ok(())
    }
}

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let email = args
        .get(0)
        .cloned()
        .or_else(|| auth::accounts().into_iter().next())
        .expect("Kayitli hesap yok. Once uygulamadan Google ile giris yap.");
    let letter = args.get(1).cloned().unwrap_or_else(|| "X:".to_string());
    let share = args.get(2).cloned().unwrap_or_else(|| email.split('@').next().unwrap_or("Drive").to_string());

    let client = auth::Client::load().expect("Client ID/secret bulunamadi");
    let rt = tokio::runtime::Builder::new_multi_thread().worker_threads(2).enable_all().build().unwrap();
    let created = filetime_now();
    let core = Core {
        rt,
        client,
        email: email.clone(),
        created,
        drive: Mutex::new(None),
        lists: Mutex::new(HashMap::new()),
        quota: Mutex::new(None),
    };
    // Baslamadan once token/baglanti saglam mi diye bir kez dene.
    match core.quota() {
        (t, u) => println!("Kota: {:.2} GB / {:.2} GB kullanildi", u as f64 / GIB as f64, t as f64 / GIB as f64),
    }

    let _init = winfsp_init_or_die();
    let mut vp = VolumeParams::default();
    vp.sector_size(512)
        .sectors_per_allocation_unit(8)
        .max_component_length(255)
        .case_preserved_names(true)
        .unicode_on_disk(true)
        .read_only_volume(true)
        .volume_creation_time(created)
        .file_info_timeout(2000)
        .dir_info_timeout(2000)
        .volume_info_timeout(5000)
        .filesystem_name("FramioDrive")
        // Prefix dolu => WinFsp.Net: Windows bunu AG surucusu sayar.
        .prefix(format!("\\Framio\\{}", share.replace(' ', "_")));

    let fs = Fs { core, label: share.clone() };
    let mut host = FileSystemHost::<Fs, FineGuard>::new(vp, fs).expect("FileSystemHost olusturulamadi");
    host.mount(&letter).expect("mount basarisiz");
    host.start().expect("dispatcher baslamadi");

    println!("Baglandi: {letter}  hesap: {email}");
    println!("Cikmak icin Enter'a bas...");
    let mut s = String::new();
    let _ = std::io::stdin().read_line(&mut s);
}
