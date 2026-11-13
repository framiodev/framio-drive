//! Framio Drive – Windows Cloud Files köprüsü (kitaplık): klasör gösterimi, indirme, yükleme kuyruğu, önbellek temizleme.
//! Arayüz (Tauri) ve komut satırı bu kitaplığı kullanır.
use cloud_filter::{
    error::{CResult, CloudErrorKind},
    filter::{info, ticket, Request, SyncFilter},
    metadata::Metadata,
    placeholder_file::PlaceholderFile,
    root::{HydrationType, PopulationType, SecurityId, Session, SyncRootIdBuilder, SyncRootInfo},
    utility::WriteAt,
};
use drivenet::{auth, Drive};
use std::collections::HashSet;
use std::io::{Read, Seek, SeekFrom};
use tokio::runtime::Handle;

use std::collections::VecDeque;
use std::sync::Mutex;
static LOG: Mutex<VecDeque<(u64, String)>> = Mutex::new(VecDeque::new());
static LOG_SEQ: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(1);
/// Etkinlik günlüğüne satır ekler (arayüz bunu gösterir).
pub fn push_log(s: String) {
    eprintln!("{s}");
    let seq = LOG_SEQ.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
    let mut g = LOG.lock().unwrap();
    g.push_back((seq, s));
    while g.len() > 500 { g.pop_front(); }
}
/// `since`'ten büyük numaralı günlük satırları.
pub fn recent_logs(since: u64) -> Vec<(u64, String)> {
    LOG.lock().unwrap().iter().filter(|(n, _)| *n > since).cloned().collect()
}
#[macro_export]
macro_rules! flog { ($($a:tt)*) => { $crate::push_log(format!($($a)*)) } }

pub mod uploader;
pub mod remote;
pub mod cache_clear {
    //! "Önbelleği temizle": indirilmiş (hydrated) dosyaları tekrar yalnızca bulutta bırakır.
    //! Güvenlik: sabitlenmiş (pinned) dosyalara dokunmaz; Windows senkronda olmayan
    //! (değiştirilmiş / yüklenmeyi bekleyen) dosyaların boşaltılmasını zaten reddeder.
    use std::os::windows::fs::MetadataExt;
    use std::path::{Path, PathBuf};
    use std::time::{Duration, SystemTime};
    use cloud_filter::{placeholder::{Placeholder, UpdateOptions}, usn::Usn};

    const ATTR_OFFLINE: u32 = 0x1000;
    const ATTR_PINNED: u32 = 0x0008_0000;
    const ATTR_RECALL_ON_OPEN: u32 = 0x0004_0000;
    const ATTR_RECALL_ON_DATA_ACCESS: u32 = 0x0040_0000;

    #[derive(Default, Debug)]
    pub struct Report { pub hydrated_files: u64, pub hydrated_bytes: u64, pub freed_files: u64, pub freed_bytes: u64, pub skipped_pinned: u64, pub skipped_recent: u64, pub failed: Vec<String> }

    fn walk(dir: &Path, out: &mut Vec<PathBuf>) {
        let Ok(rd) = std::fs::read_dir(dir) else { return };
        for e in rd.flatten() {
            let p = e.path();
            let Ok(md) = e.metadata() else { continue };
            if md.is_dir() {
                // Henüz açılmamış bulut klasörlerine girmek ağ listelemesini tetikler; atla.
                if md.file_attributes() & (ATTR_OFFLINE | ATTR_RECALL_ON_OPEN | ATTR_RECALL_ON_DATA_ACCESS) != 0 { continue; }
                walk(&p, out);
            } else { out.push(p); }
        }
    }

    fn is_cloud_only(attrs: u32) -> bool { attrs & (ATTR_OFFLINE | ATTR_RECALL_ON_DATA_ACCESS | ATTR_RECALL_ON_OPEN) != 0 }

    /// older_than_days = Some(n): son n günde dokunulmamış dosyalar. dry = yalnızca say.
    pub fn run(root: &Path, older_than_days: Option<u64>, dry: bool) -> Report {
        let mut files = Vec::new();
        walk(root, &mut files);
        let mut r = Report::default();
        let cutoff = older_than_days.map(|d| SystemTime::now() - Duration::from_secs(d * 86400));
        for p in files {
            let Ok(md) = std::fs::metadata(&p) else { continue };
            let attrs = md.file_attributes();
            if is_cloud_only(attrs) { continue; }
            r.hydrated_files += 1; r.hydrated_bytes += md.len();
            if attrs & ATTR_PINNED != 0 { r.skipped_pinned += 1; continue; }
            if let Some(c) = cutoff {
                let last = md.accessed().or_else(|_| md.modified()).unwrap_or(SystemTime::UNIX_EPOCH);
                if last > c { r.skipped_recent += 1; continue; }
            }
            if dry { continue; }
            // Resmî yol: CfUpdatePlaceholder(DEHYDRATE | VERIFY_IN_SYNC). Senkronda olmayan dosyayı Windows reddeder.
            let res: Result<(), String> = match std::fs::OpenOptions::new().read(true).write(true).open(&p) {
                Err(e) => Err(format!("açılamadı: {e}")),
                Ok(file) => {
                    let mut ph = Placeholder::from(file);
                    ph.update(UpdateOptions::default().dehydrate().update_if_in_sync(), None::<&mut Usn>).map(|_| ()).map_err(|e| format!("{e:?}"))
                }
            };
            let after = std::fs::metadata(&p).map(|m| m.file_attributes()).unwrap_or(0);
            match res {
                Ok(()) if is_cloud_only(after) => { r.freed_files += 1; r.freed_bytes += md.len(); }
                Ok(()) => r.failed.push(format!("{} (istek kabul edildi, dosya hâlâ inik)", p.display())),
                Err(e) => r.failed.push(format!("{} -> {e}", p.display())),
            }
        }
        r
    }
}

const FOLDER_MIME: &str = "application/vnd.google-apps.folder";

struct DriveFilter { rt: Handle, client: auth::Client, email: String, root: std::path::PathBuf }

impl DriveFilter {
    fn drive(&self) -> Result<Drive, CloudErrorKind> {
        let t = self.rt.block_on(auth::access_token(&self.client, &self.email)).map_err(|e| { crate::flog!("token alınamadı: {e}"); CloudErrorKind::NetworkUnavailable })?;
        Ok(Drive::new(t))
    }
}

/// Windows'un kabul etmediği karakterleri temizler; aynı adlı dosyalar için kimlikten ek getirir.
pub(crate) fn safe_name(name: &str, id: &str, used: &mut HashSet<String>) -> String {
    let mut n: String = name.chars().map(|c| if r#"<>:"/\|?*"#.contains(c) || c.is_control() { '_' } else { c }).collect();
    n = n.trim_end_matches(['.', ' ']).to_string();
    if n.is_empty() { n = "_".into(); }
    if !used.insert(n.to_lowercase()) {
        let short: String = id.chars().take(6).collect();
        n = format!("{n} ({short})");
        used.insert(n.to_lowercase());
    }
    n
}

impl SyncFilter for DriveFilter {
    /// Klasör açılınca: Drive'daki içeriği yer tutucu olarak yarat. Dosya kimliği "blob" olarak saklanır.
    fn fetch_placeholders(&self, request: Request, ticket: ticket::FetchPlaceholders, _info: info::FetchPlaceholders) -> CResult<()> {
        let blob = request.file_blob();
        crate::flog!("fetch_placeholders: blob={} bayt", blob.len());
        let folder_id = if blob.is_empty() { "root".to_string() } else { uploader::blob_id(blob) };
        let drive = self.drive()?;
        let files = self.rt.block_on(drive.list_children(&folder_id)).map_err(|e| { crate::flog!("fetch_placeholders: liste: {e:?}"); CloudErrorKind::NetworkUnavailable })?;
        crate::flog!("fetch_placeholders: {} öğe", files.len());

        let mut used = HashSet::new();
        let mut ph: Vec<PlaceholderFile> = Vec::new();
        for f in files {
            let is_dir = f.mime_type == FOLDER_MIME;
            // Google Dokümanlar/Sheets gibi yerel Google dosyaları indirilebilir değil; 2a'da atlanır.
            if !is_dir && f.mime_type.starts_with("application/vnd.google-apps.") { continue; }
            let md = if is_dir { Metadata::directory() } else {
                Metadata::file().size(f.size.as_deref().and_then(|s| s.parse().ok()).unwrap_or(0))
            };
            let name = safe_name(&f.name, &f.id, &mut used);
            ph.push(PlaceholderFile::new(name).metadata(md).mark_in_sync().overwrite().blob(uploader::make_blob(&f.id, f.md5_checksum.as_deref())));
        }
        ticket.pass_with_placeholder(&mut ph).map_err(|e| { crate::flog!("fetch_placeholders: pass: {e:?}"); CloudErrorKind::Unsuccessful })?;
        crate::flog!("fetch_placeholders: tamam");
        Ok(())
    }

    /// Dosya açılınca/kopyalanınca: Drive'dan indir ve istenen aralığı Windows'a ver.
    fn fetch_data(&self, request: Request, ticket: ticket::FetchData, info: info::FetchData) -> CResult<()> {
        let id = uploader::blob_id(request.file_blob());
        let size = request.file_size();
        let range = info.required_file_range();
        crate::flog!("fetch_data: id={id} size={size} range={range:?}");
        let tmp = std::env::temp_dir().join(format!("framio-{id}.part"));

        let have = std::fs::metadata(&tmp).map(|m| m.len()).unwrap_or(0);
        if have != size {
            let drive = self.drive().map_err(|e| { crate::flog!("fetch_data: token: {e:?}"); e })?;
            self.rt.block_on(drive.download(&id, &tmp)).map_err(|e| { crate::flog!("fetch_data: indirme: {e:?}"); CloudErrorKind::NetworkUnavailable })?;
        }
        let got = std::fs::metadata(&tmp).map(|m| m.len()).unwrap_or(0);
        crate::flog!("fetch_data: geçici dosya {got} bayt");
        if got != size { crate::flog!("fetch_data: UYARI beklenen {size}, inen {got}"); }

        let mut f = std::fs::File::open(&tmp).map_err(|e| { crate::flog!("fetch_data: open: {e}"); CloudErrorKind::Unsuccessful })?;
        // Windows 4096 bayt hizalı yazım ister (dosya sonu hariç).
        let start = range.start & !4095;
        let end = ((range.end + 4095) & !4095).min(size);
        f.seek(SeekFrom::Start(start)).map_err(|e| { crate::flog!("fetch_data: seek: {e}"); CloudErrorKind::Unsuccessful })?;
        let mut pos = start;
        let mut buf = vec![0u8; 65536];
        while pos < end {
            let want = ((end - pos).min(65536)) as usize;
            f.read_exact(&mut buf[..want]).map_err(|e| { crate::flog!("fetch_data: read: {e}"); CloudErrorKind::Unsuccessful })?;
            ticket.write_at(&buf[..want], pos).map_err(|e| { crate::flog!("fetch_data: write_at pos={pos} len={want}: {e:?}"); CloudErrorKind::Unsuccessful })?;
            pos += want as u64;
        }
        crate::flog!("fetch_data: tamam");
        Ok(())
    }

    /// Yerelde silinince: Drive'da çöpe at (geri alınabilir). Hata olursa silme reddedilir.
    fn delete(&self, request: Request, ticket: ticket::Delete, info: info::Delete) -> CResult<()> {
        let id = uploader::blob_id(request.file_blob());
        if !info.is_undelete() && !id.is_empty() {
            let drive = self.drive()?;
            let mut last = None;
            for _ in 0..3 {
                match self.rt.block_on(drive.trash(&id)) { Ok(()) => { last = None; break } Err(e) => last = Some(e) }
            }
            if let Some(e) = last { crate::flog!("delete: Drive'da çöpe atılamadı: {e:?}"); return Err(CloudErrorKind::NetworkUnavailable); }
            crate::flog!("delete: Drive çöpüne taşındı ({id})");
        }
        // İstek Windows tarafında iptal edilmiş olabilir (0x8007018E); bu hatayı döndürmek kütüphanede panic'e yol açıyor.
        if let Err(e) = ticket.pass() { crate::flog!("delete: onay verilemedi (yok sayıldı): {e:?}"); }
        Ok(())
    }

    /// Yerelde yeniden adlandırılınca/taşınınca: Drive'da da uygula.
    fn rename(&self, request: Request, ticket: ticket::Rename, info: info::Rename) -> CResult<()> {
        let id = uploader::blob_id(request.file_blob());
        let target = info.target_path();
        if !id.is_empty() {
            let drive = self.drive()?;
            if !info.target_in_scope() {
                // Eşitlenen klasörün dışına taşındı: Drive'da çöpe at.
                self.rt.block_on(drive.trash(&id)).map_err(|e| { crate::flog!("rename: çöpe atılamadı: {e:?}"); CloudErrorKind::NetworkUnavailable })?;
                crate::flog!("rename: klasör dışına taşındı, Drive'da çöpe atıldı ({id})");
            } else {
                let name = target.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
                let parent = uploader::parent_id(&self.root, &target).map_err(|e| { crate::flog!("rename: hedef klasör: {e}"); CloudErrorKind::Unsuccessful })?;
                self.rt.block_on(drive.move_rename(&id, &name, &parent)).map_err(|e| { crate::flog!("rename: {e:?}"); CloudErrorKind::NetworkUnavailable })?;
                crate::flog!("rename: Drive'da '{name}' olarak güncellendi");
            }
        }
        if let Err(e) = ticket.pass() { crate::flog!("rename: onay verilemedi (yok sayıldı): {e:?}"); }
        Ok(())
    }

    /// "Yer aç" (Free up space): indirilmiş dosyayı tekrar yalnızca bulutta bırakmaya izin ver.
    fn dehydrate(&self, _request: Request, ticket: ticket::Dehydrate, _info: info::Dehydrate) -> CResult<()> {
        crate::flog!("dehydrate");
        if let Err(e) = ticket.pass() { crate::flog!("dehydrate: onay verilemedi (yok sayıldı): {e:?}"); }
        Ok(())
    }
}


// ================= Dışa açılan API (arayüz bunu çağırır) =================
use serde_json::{json, Value};
use std::path::PathBuf;
use std::sync::{mpsc, Arc};
use std::time::Duration;

pub fn root_path(email: &str) -> Result<PathBuf, String> {
    let profile = std::env::var("USERPROFILE").map_err(|_| "USERPROFILE yok".to_string())?;
    Ok(std::path::Path::new(&profile).join("Framio Drive").join(email.to_lowercase()))
}

fn sync_root_id(email: &str) -> Result<cloud_filter::root::SyncRootId, String> {
    Ok(SyncRootIdBuilder::new("FramioDrive")
        .user_security_id(SecurityId::current_user().map_err(|e| format!("{e:?}"))?)
        .account_name(email.to_lowercase())
        .build())
}

/// Eşitleme kaydını siler (temizlik).
pub fn unregister(email: &str) -> Result<(), String> {
    sync_root_id(email)?.unregister().map_err(|e| format!("{e:?}"))
}

#[derive(Clone)]
pub struct Engine {
    pub email: String,
    pub root: PathBuf,
    shared: Arc<Mutex<uploader::Shared>>,
    usage: Arc<Mutex<(u64, u64, u64)>>,
    _stop: mpsc::Sender<()>, // tüm kopyalar düşünce arka plan iş parçacığı sonlanır
    join: Arc<Mutex<Option<std::thread::JoinHandle<()>>>>,
}

fn refresh_usage(root: &std::path::Path, usage: &Mutex<(u64, u64, u64)>) {
    let r = cache_clear::run(root, None, true);
    *usage.lock().unwrap() = (r.hydrated_files, r.hydrated_bytes, r.skipped_pinned);
}

impl Engine {
    /// Hesabın klasörünü kaydeder, bağlar ve yükleyiciyi başlatır.
    pub fn start(email: &str, client: auth::Client) -> Result<Engine, String> {
        let email = email.to_lowercase();
        let root = root_path(&email)?;
        static CLEAN: std::sync::Once = std::sync::Once::new();
        CLEAN.call_once(|| {
            if let Ok(rd) = std::fs::read_dir(std::env::temp_dir()) {
                for e in rd.flatten() {
                    let n = e.file_name().to_string_lossy().into_owned();
                    if n.starts_with("framio-") && n.ends_with(".part") { let _ = std::fs::remove_file(e.path()); }
                }
            }
        });
        let (ready_tx, ready_rx) = mpsc::channel::<Result<(Arc<Mutex<uploader::Shared>>, Arc<Mutex<(u64, u64, u64)>>), String>>();
        let (stop_tx, stop_rx) = mpsc::channel::<()>();
        let (e2, r2) = (email.clone(), root.clone());
        let handle = std::thread::spawn(move || {
            let setup = || -> Result<_, String> {
                std::fs::create_dir_all(&r2).map_err(|e| e.to_string())?;
                let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
                let id = sync_root_id(&e2)?;
                if !id.is_registered().map_err(|e| format!("{e:?}"))? {
                    id.register(
                        SyncRootInfo::default()
                            .with_display_name("Framio Drive")
                            .with_hydration_type(HydrationType::Full)
                            .with_population_type(PopulationType::Full)
                            .with_icon("%SystemRoot%\\system32\\imageres.dll,197")
                            .with_version("0.1.0")
                            .with_path(&r2).map_err(|e| format!("{e:?}"))?,
                    ).map_err(|e| format!("{e:?}"))?;
                }
                let filter = DriveFilter { rt: rt.handle().clone(), client: client.clone(), email: e2.clone(), root: r2.clone() };
                let connection = Session::new().connect(&r2, filter).map_err(|e| format!("{e:?}"))?;
                let shared = uploader::start(rt.handle().clone(), client.clone(), e2.clone(), r2.clone());
                remote::start(rt.handle().clone(), client.clone(), e2.clone(), r2.clone(), shared.clone());
                Ok((rt, connection, shared))
            };
            match setup() {
                Err(e) => { let _ = ready_tx.send(Err(e)); }
                Ok((rt, connection, shared)) => {
                    let usage = Arc::new(Mutex::new((0u64, 0u64, 0u64)));
                    let _ = ready_tx.send(Ok((shared, usage.clone())));
                    crate::flog!("bağlandı: {}", r2.display());
                    refresh_usage(&r2, &usage);
                    loop {
                        match stop_rx.recv_timeout(Duration::from_secs(20)) {
                            Err(mpsc::RecvTimeoutError::Timeout) => refresh_usage(&r2, &usage),
                            _ => break,
                        }
                    }
                    drop(connection);
                    drop(rt);
                    crate::flog!("bağlantı kapatıldı: {}", r2.display());
                }
            }
        });
        let (shared, usage) = ready_rx.recv().map_err(|_| "başlatma iş parçacığı çöktü".to_string())??;
        Ok(Engine { email, root, shared, usage, _stop: stop_tx, join: Arc::new(Mutex::new(Some(handle))) })
    }

    /// (bekleyen, yükleyen, hatalı, duraklatıldı mı)
    pub fn summary(&self) -> (usize, usize, usize, bool) {
        let g = self.shared.lock().unwrap();
        let (p, u, f, _) = g.queue.summary();
        (p, u, f, g.paused)
    }

    /// Bağlantıyı kapatır ve arka plan iş parçacığının bitmesini bekler (eşitleme kaydını silmeden önce gerekli).
    pub fn shutdown(self) {
        let Engine { _stop, join, .. } = self;
        drop(_stop);
        let h = join.lock().unwrap().take();
        if let Some(h) = h { let _ = h.join(); }
    }

    pub fn status(&self) -> Value {
        use drivecore::queue::State;
        let g = self.shared.lock().unwrap();
        let (pending, uploading, failed, done) = g.queue.summary();
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0);
        let jobs: Vec<Value> = g.queue.jobs().into_iter().filter(|j| !matches!(j.state, State::Done)).take(300).map(|j| {
            let name = std::path::Path::new(&j.path).file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
            let (state, progress, error, retry_in) = match &j.state {
                State::Pending => ("bekliyor", 0.0, String::new(), 0),
                State::Uploading { confirmed } => ("yükleniyor", if j.size > 0 { *confirmed as f64 / j.size as f64 } else { 0.0 }, String::new(), 0),
                State::Failed { error, retry_at, .. } => ("hata", 0.0, error.clone(), retry_at.saturating_sub(now)),
                State::Dead { error } => ("durdu", 0.0, error.clone(), 0),
                State::Done => ("bitti", 1.0, String::new(), 0),
            };
            json!({ "name": name, "path": j.path, "size": j.size, "state": state, "progress": progress, "error": error, "retry_in": retry_in, "attempts": j.attempts })
        }).collect();
        let u = *self.usage.lock().unwrap();
        json!({
            "connected": true, "email": self.email, "folder": self.root.display().to_string(), "paused": g.paused,
            "counts": { "pending": pending, "uploading": uploading, "failed": failed, "done": done },
            "jobs": jobs,
            "cache": { "files": u.0, "bytes": u.1, "pinned": u.2 },
        })
    }

    /// Önbelleği temizle. `days` verilirse yalnızca o kadar gündür dokunulmamış dosyalar.
    pub fn clear(&self, days: Option<u64>) -> Value {
        let r = cache_clear::run(&self.root, days, false);
        refresh_usage(&self.root, &self.usage);
        crate::flog!("önbellek temizlendi: {} dosya, {:.1} MB boşaltıldı, {} sabitlenmiş atlandı, {} başarısız", r.freed_files, r.freed_bytes as f64 / 1048576.0, r.skipped_pinned, r.failed.len());
        json!({ "freed_files": r.freed_files, "freed_bytes": r.freed_bytes, "skipped_pinned": r.skipped_pinned, "skipped_recent": r.skipped_recent, "failed": r.failed })
    }
    pub fn retry(&self) { let mut g = self.shared.lock().unwrap(); g.queue.retry_dead(); }
    pub fn set_paused(&self, p: bool) { self.shared.lock().unwrap().paused = p; }
}
