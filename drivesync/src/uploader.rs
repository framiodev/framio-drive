//! Yükleme yönü: eşitlenmiş klasörde yeni ve değişmiş dosyaları bulur, kuyruğa alır, Drive'a yükler.
//! - Yeni dosya/klasör  -> Drive'a oluşturulur, sonra yer tutucuya çevrilir (Gezgin'de yeşil tik).
//! - Değişmiş dosya     -> Drive'daki dosya güncellenir (eski sürüm Drive sürüm geçmişinde kalır).
//! - Drive'da aynı dosya bu arada değiştiyse -> sessizce ezilmez; yerel dosya "(çakışma ...)" adıyla ayrı yüklenir.
//! Yer tutucunun "blob"u: "<drive_id>\n<md5>" (md5 çakışma tespiti içindir; eski kayıtlarda yalnız id olabilir).
use cloud_filter::{
    placeholder::{ConvertOptions, Placeholder, UpdateOptions},
    usn::Usn,
};
use drivecore::queue::{Queue, State};
use drivenet::{auth, Drive};
use std::collections::HashMap;
use std::os::windows::fs::{MetadataExt, OpenOptionsExt};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::runtime::Handle;

const BACKUP_SEMANTICS: u32 = 0x0200_0000;
const SCAN_EVERY: Duration = Duration::from_secs(4);
/// Dosya bu süreden yeni değiştiyse hâlâ kopyalanıyor/kaydediliyor olabilir; beklenir.
const SETTLE: Duration = Duration::from_secs(3);

/// Blob biçimi: "FD1\n<drive_id>\n<md5>". Başındaki 4 baytlık "FD1\n" önceden doldurmadır: cloud-filter 0.0.6'nın
/// `PlaceholderInfo::blob()` işlevi kimliğin ilk 4 baytını atlıyor; önek sayesinde `info()` yolu "<id>\n<md5>" döndürür,
/// geri çağrılardaki `file_blob()` ise öneki de içerir. Her iki yol da aynı işlevlerle çözülür.
const BLOB_TAG: &str = "FD1\n";
pub fn make_blob(id: &str, md5: Option<&str>) -> Vec<u8> { format!("{BLOB_TAG}{id}\n{}", md5.unwrap_or("")).into_bytes() }
fn blob_text(b: &[u8]) -> String {
    let t = String::from_utf8_lossy(b).into_owned();
    t.strip_prefix(BLOB_TAG).map(String::from).unwrap_or(t)
}
pub fn blob_id(b: &[u8]) -> String { blob_text(b).split('\n').next().unwrap_or("").to_string() }
pub fn blob_md5(b: &[u8]) -> Option<String> {
    blob_text(b).split('\n').nth(1).filter(|m| !m.is_empty()).map(String::from)
}

#[derive(Debug, Clone)]
enum Kind { NewFile, NewDir, Modified { id: String, md5: Option<String> } }
#[derive(Debug, Clone)]
struct Cand { path: PathBuf, kind: Kind }

pub struct Shared { pub queue: Queue, by_path: HashMap<String, u64>, pub paused: bool }

fn now() -> u64 { SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0) }

pub fn ignored(name: &str) -> bool {
    let n = name.to_lowercase();
    n.starts_with("~$") || n.ends_with(".tmp") || n == "desktop.ini" || n == "thumbs.db" || n.starts_with(".~lock")
}

fn open_for_info(p: &Path, is_dir: bool) -> std::io::Result<std::fs::File> {
    let mut o = std::fs::OpenOptions::new();
    o.read(true).share_mode(7);
    if is_dir { o.custom_flags(BACKUP_SEMANTICS); }
    o.open(p)
}

/// (blob, senkronda mı). Yer tutucu değilse Ok(None).
pub fn placeholder_info(p: &Path, is_dir: bool) -> Result<Option<(Vec<u8>, bool)>, String> {
    let f = open_for_info(p, is_dir).map_err(|e| format!("açılamadı: {e}"))?;
    let ph = Placeholder::from(f);
    let info = ph.info().map_err(|e| format!("info: {e:?}"))?;
    Ok(info.map(|i| (i.blob().to_vec(), i.is_in_sync())))
}

fn scan(dir: &Path, out: &mut Vec<Cand>) {
    let Ok(rd) = std::fs::read_dir(dir) else { return };
    for e in rd.flatten() {
        let p = e.path();
        let name = e.file_name().to_string_lossy().into_owned();
        if ignored(&name) { continue; }
        let Ok(md) = e.metadata() else { continue };
        if md.is_dir() {
            // Henüz hiç açılmamış (bulutta) klasörlerin içine inme: ağ listelemesini tetiklemesin, kullanıcı da içine bir şey koyamamıştır.
            if md.file_attributes() & (0x1000 | 0x0004_0000 | 0x0040_0000) != 0 { continue; }
            match placeholder_info(&p, true) {
                Ok(None) => out.push(Cand { path: p, kind: Kind::NewDir }), // içine sonraki taramada bakılır
                Ok(Some(_)) => scan(&p, out),
                Err(_) => {}
            }
        } else {
            let settled = md.modified().ok().and_then(|m| m.elapsed().ok()).map(|d| d >= SETTLE).unwrap_or(false);
            if !settled { continue; }
            match placeholder_info(&p, false) {
                Ok(None) => out.push(Cand { path: p, kind: Kind::NewFile }),
                Ok(Some((blob, in_sync))) => {
                    if !in_sync { out.push(Cand { path: p, kind: Kind::Modified { id: blob_id(&blob), md5: blob_md5(&blob) } }); }
                }
                Err(_) => {}
            }
        }
    }
}

pub fn parent_id(root: &Path, p: &Path) -> Result<String, String> {
    let parent = p.parent().ok_or("üst klasör yok")?;
    if parent == root { return Ok("root".into()); }
    match placeholder_info(parent, true)? {
        Some((blob, _)) => Ok(blob_id(&blob)),
        None => Err("üst klasör henüz Drive'a oluşturulmadı".into()),
    }
}

fn stamp() -> String {
    let secs = now() as i64;
    let days = secs.div_euclid(86400);
    let rem = secs.rem_euclid(86400);
    // Howard Hinnant: gün sayısından tarih
    let z = days + 719468;
    let era = z.div_euclid(146097);
    let doe = z.rem_euclid(146097);
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };
    format!("{y:04}{m:02}{d:02}-{:02}{:02}", rem / 3600, (rem % 3600) / 60)
}

fn conflict_name(name: &str) -> String {
    match name.rfind('.') {
        Some(i) if i > 0 => format!("{} (çakışma {}){}", &name[..i], stamp(), &name[i..]),
        _ => format!("{name} (çakışma {})", stamp()),
    }
}

fn mark_synced(path: &Path, blob: &[u8]) -> Result<(), String> {
    let f = std::fs::OpenOptions::new().read(true).write(true).share_mode(7).open(path).map_err(|e| format!("açılamadı: {e}"))?;
    let mut ph = Placeholder::from(f);
    ph.update(UpdateOptions::default().mark_in_sync().blob(blob), None::<&mut Usn>).map_err(|e| format!("update: {e:?}"))?;
    Ok(())
}

fn convert(path: &Path, is_dir: bool, blob: Vec<u8>) -> Result<(), String> {
    let mut o = std::fs::OpenOptions::new();
    if is_dir {
        // dizin: yazma öznitelikleri + DAC erişimi, BACKUP_SEMANTICS ile
        o.access_mode(0x0000_0100 | 0x0000_0080 | 0x0010_0000 | 0x0002_0000 | 0x0004_0000).share_mode(7).custom_flags(BACKUP_SEMANTICS);
    } else {
        o.read(true).write(true).share_mode(7);
    }
    let f = o.open(path).map_err(|e| format!("açılamadı: {e}"))?;
    let mut ph = Placeholder::from(f);
    ph.convert_to_placeholder(ConvertOptions::default().mark_in_sync().blob(blob), None::<&mut Usn>)
        .map_err(|e| format!("convert: {e:?}"))?;
    Ok(())
}

async fn upload_new(drive: &Drive, parent: &str, path: &Path, name: &str, on_progress: impl FnMut(u64)) -> Result<(String, Option<String>), String> {
    let total = tokio::fs::metadata(path).await.map_err(|e| e.to_string())?.len();
    let session = drive.start_upload(name, parent, total).await.map_err(|e| format!("{e:?}"))?;
    let id = drive.upload_file(&session, path, on_progress).await.map_err(|e| format!("{e:?}"))?.ok_or("yanıtta id yok")?;
    let md5 = drive.file_meta(&id).await.map_err(|e| format!("{e:?}"))?.md5_checksum;
    Ok((id, md5))
}

async fn process(drive: &Drive, root: &Path, c: &Cand, on_progress: impl FnMut(u64)) -> Result<(), String> {
    let name = c.path.file_name().ok_or("ad yok")?.to_string_lossy().into_owned();
    match &c.kind {
        Kind::NewDir => {
            let parent = parent_id(root, &c.path)?;
            let id = drive.create_folder(&name, &parent).await.map_err(|e| format!("{e:?}"))?;
            convert(&c.path, true, make_blob(&id, None))
        }
        Kind::NewFile => {
            let parent = parent_id(root, &c.path)?;
            let (id, md5) = upload_new(drive, &parent, &c.path, &name, on_progress).await?;
            convert(&c.path, false, make_blob(&id, md5.as_deref()))
        }
        Kind::Modified { id, md5 } => {
            let remote = drive.file_meta(id).await.map_err(|e| format!("{e:?}"))?;
            let conflict = matches!((md5, &remote.md5_checksum), (Some(base), Some(cur)) if base != cur);
            if !conflict {
                let total = tokio::fs::metadata(&c.path).await.map_err(|e| e.to_string())?.len();
                let session = drive.start_update(id, total).await.map_err(|e| format!("{e:?}"))?;
                drive.upload_file(&session, &c.path, on_progress).await.map_err(|e| format!("{e:?}"))?;
                let md5 = drive.file_meta(id).await.map_err(|e| format!("{e:?}"))?.md5_checksum;
                mark_synced(&c.path, &make_blob(id, md5.as_deref()))
            } else {
                // Drive'daki sürüm değişmiş: ezme. Yerel dosyayı ayrı bir dosya olarak yükle, yerelde de adını değiştir.
                let parent = parent_id(root, &c.path)?;
                let new_name = conflict_name(&name);
                let (new_id, new_md5) = upload_new(drive, &parent, &c.path, &new_name, on_progress).await?;
                let new_path = c.path.with_file_name(&new_name);
                std::fs::rename(&c.path, &new_path).map_err(|e| format!("yeniden adlandırılamadı: {e}"))?;
                crate::flog!("ÇAKIŞMA: Drive'daki '{name}' bu arada değişmişti. Senin sürümün '{new_name}' olarak yüklendi.");
                mark_synced(&new_path, &make_blob(&new_id, new_md5.as_deref()))
            }
        }
    }
}

/// Arka plan iş parçacığını başlatır; kuyruğa erişim için paylaşılan durumu döndürür.
pub fn start(rt: Handle, client: auth::Client, email: String, root: PathBuf) -> Arc<Mutex<Shared>> {
    let shared = Arc::new(Mutex::new(Shared { queue: Queue::new(), by_path: HashMap::new(), paused: false }));
    let sh = shared.clone();
    std::thread::spawn(move || loop {
        std::thread::sleep(SCAN_EVERY);
        if sh.lock().unwrap().paused { continue; }

        let mut cands = Vec::new();
        scan(&root, &mut cands);
        let by_key: HashMap<String, Cand> = cands.into_iter().map(|c| (c.path.display().to_string(), c)).collect();

        // Yeni bulunanları kuyruğa ekle (aynı yol iki kez eklenmez).
        {
            let mut g = sh.lock().unwrap();
            for (k, c) in &by_key {
                if g.by_path.contains_key(k) { continue; }
                let size = std::fs::metadata(&c.path).map(|m| m.len()).unwrap_or(0);
                let id = g.queue.add(&email, k, size);
                g.by_path.insert(k.clone(), id);
            }
        }

        // Hazır olanları sırayla yükle (şimdilik tek tek).
        loop {
            let next = { let g = sh.lock().unwrap(); g.queue.ready(now()).into_iter().next() };
            let Some(job_id) = next else { break };
            let key = { let mut g = sh.lock().unwrap(); g.queue.start(job_id); g.queue.get(job_id).map(|j| j.path.clone()) };
            let Some(key) = key else { break };
            // Dosya bu arada değişmiş/silinmiş olabilir: güncel durumu yeniden tespit et.
            let mut fresh = Vec::new();
            scan(&root, &mut fresh);
            let cand = fresh.into_iter().find(|c| c.path.display().to_string() == key);
            let result: Result<(), String> = match cand {
                None => Ok(()), // artık yüklenecek bir şey yok (silindi ya da eşitlendi)
                Some(c) => {
                    let size = std::fs::metadata(&c.path).map(|m| m.len()).unwrap_or(0);
                    crate::flog!("yükleniyor: {} ({:.1} MB)", c.path.display(), size as f64 / 1048576.0);
                    let sh2 = sh.clone();
                    rt.block_on(async {
                        let token = auth::access_token(&client, &email).await.map_err(|e| format!("token: {e}"))?;
                        let drive = Drive::new(token);
                        process(&drive, &root, &c, move |done| { sh2.lock().unwrap().queue.progress(job_id, done); }).await
                    })
                }
            };
            let mut g = sh.lock().unwrap();
            match result {
                Ok(()) => { g.queue.complete(job_id); g.by_path.remove(&key); crate::flog!("tamam: {key}"); }
                Err(e) => { crate::flog!("HATA ({key}): {e}"); g.queue.fail(job_id, now(), &e); }
            }
        }
    });
    shared
}

pub fn describe(sh: &Shared) -> String {
    let (pending, uploading, failed, done) = sh.queue.summary();
    format!("Kuyruk: bekleyen {pending}, yükleyen {uploading}, hatalı {failed}, biten {done}")
}

pub fn failures(sh: &Shared) -> Vec<String> {
    sh.by_path.iter().filter_map(|(k, id)| match sh.queue.get(*id).map(|j| &j.state) {
        Some(State::Failed { error, retry_at, .. }) => Some(format!("{k}: {error} (yeniden deneme: {} sn sonra)", retry_at.saturating_sub(now()))),
        Some(State::Dead { error }) => Some(format!("{k}: DURDU: {error} ('tekrar' yaz)")),
        _ => None,
    }).collect()
}
