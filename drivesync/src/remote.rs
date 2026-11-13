//! İndirme yönü: Drive'da olan değişiklikleri (silme, ekleme, yeniden adlandırma/taşıma, içerik değişimi) yerel klasöre yansıtır.
//! Drive "changes" akışı birkaç saniyede bir sorulur. Yerelde henüz yüklenmemiş (eşitlenmemiş) öğelere dokunulmaz.
use crate::uploader::{blob_id, blob_md5, ignored, make_blob, placeholder_info};
use cloud_filter::{metadata::Metadata, placeholder::{Placeholder, UpdateOptions}, placeholder_file::PlaceholderFile, usn::Usn};
use drivenet::{auth, Change, Drive};
use std::collections::{HashMap, HashSet};
use std::os::windows::fs::{MetadataExt, OpenOptionsExt};
use std::path::{Path, PathBuf};
use std::time::Duration;
use tokio::runtime::Handle;

const POLL: Duration = Duration::from_secs(10);
const FOLDER_MIME: &str = "application/vnd.google-apps.folder";
const CLOUD_ONLY: u32 = 0x1000 | 0x0004_0000 | 0x0040_0000;

#[derive(Clone)]
struct Local { path: PathBuf, is_dir: bool, in_sync: bool, cloud_only: bool, md5: Option<String> }

fn token_file(email: &str) -> PathBuf {
    let base = std::env::var("APPDATA").unwrap_or_default();
    let dir = Path::new(&base).join("FramioDrive");
    let _ = std::fs::create_dir_all(&dir);
    dir.join(format!("changes-{}.txt", email.to_lowercase()))
}

fn index(dir: &Path, map: &mut HashMap<String, Local>) {
    let Ok(rd) = std::fs::read_dir(dir) else { return };
    for e in rd.flatten() {
        let name = e.file_name().to_string_lossy().into_owned();
        if ignored(&name) { continue; }
        let Ok(md) = e.metadata() else { continue };
        let p = e.path();
        let is_dir = md.is_dir();
        let cloud_only = md.file_attributes() & CLOUD_ONLY != 0;
        if let Ok(Some((blob, in_sync))) = placeholder_info(&p, is_dir) {
            let id = blob_id(&blob);
            if !id.is_empty() { map.insert(id, Local { path: p.clone(), is_dir, in_sync, cloud_only, md5: blob_md5(&blob) }); }
        }
        if is_dir && !cloud_only { index(&p, map); }
    }
}

fn remove(l: &Local) -> Result<(), String> {
    if l.is_dir { std::fs::remove_dir_all(&l.path) } else { std::fs::remove_file(&l.path) }.map_err(|e| e.to_string())
}

fn update_content(l: &Local, size: u64, blob: &[u8]) -> Result<(), String> {
    let f = std::fs::OpenOptions::new().read(true).write(true).share_mode(7).open(&l.path).map_err(|e| e.to_string())?;
    let mut ph = Placeholder::from(f);
    let mut o = UpdateOptions::default().metadata(Metadata::file().size(size)).blob(blob).update_if_in_sync();
    if !l.cloud_only { o = o.dehydrate(); }
    ph.update(o, None::<&mut Usn>).map_err(|e| format!("{e:?}"))?;
    Ok(())
}

/// Değişiklikleri yerel klasöre uygular. Dönüş: değişen öğe sayısı.
fn apply(root: &Path, root_id: &str, changes: Vec<Change>) -> usize {
    let mut idx: HashMap<String, Local> = HashMap::new();
    index(root, &mut idx);
    let mut n = 0;
    for c in changes {
        let id = c.file_id.clone();
        let gone = c.removed || c.file.as_ref().map_or(false, |f| f.trashed);
        if gone {
            if let Some(l) = idx.get(&id).cloned() {
                if l.in_sync {
                    match remove(&l) {
                        Ok(()) => { crate::flog!("Drive'da silindi, yerelden kaldırıldı: {}", l.path.display()); n += 1; idx.clear(); index(root, &mut idx); }
                        Err(e) => crate::flog!("yerel silme başarısız ({}): {e}", l.path.display()),
                    }
                } else { crate::flog!("Drive'da silindi ama yerelde yüklenmemiş değişiklik var, silinmedi: {}", l.path.display()); }
            }
            continue;
        }
        let Some(f) = c.file else { continue };
        let is_dir = f.mime_type == FOLDER_MIME;
        if !is_dir && f.mime_type.starts_with("application/vnd.google-apps.") { continue; }
        let parent_dir: Option<PathBuf> = f.parents.first().and_then(|p| {
            if p == root_id { Some(root.to_path_buf()) } else { idx.get(p).filter(|x| x.is_dir && !x.cloud_only).map(|x| x.path.clone()) }
        });
        let want_name = crate::safe_name(&f.name, &f.id, &mut HashSet::new());
        match idx.get(&id).cloned() {
            Some(l) => {
                let Some(pd) = parent_dir else {
                    // izlenen ağacın dışına taşınmış
                    if l.in_sync { if remove(&l).is_ok() { crate::flog!("Drive'da başka yere taşındı, yerelden kaldırıldı: {}", l.path.display()); n += 1; idx.clear(); index(root, &mut idx); } }
                    continue;
                };
                let target = pd.join(&want_name);
                let mut cur = l.path.clone();
                if target != l.path && l.in_sync {
                    match std::fs::rename(&l.path, &target) {
                        Ok(()) => { crate::flog!("Drive'da yeniden adlandırıldı/taşındı: {} -> {}", l.path.display(), target.display()); n += 1; cur = target; }
                        Err(e) => crate::flog!("yeniden adlandırma başarısız ({}): {e}", l.path.display()),
                    }
                }
                if !is_dir && f.md5_checksum.is_some() && f.md5_checksum != l.md5 {
                    if !l.in_sync {
                        crate::flog!("Drive'da içerik değişti ama yerelde yüklenmemiş değişiklik var, atlandı: {}", cur.display());
                    } else {
                        let size = f.size.as_deref().and_then(|s| s.parse().ok()).unwrap_or(0);
                        let mut l2 = l.clone(); l2.path = cur.clone();
                        match update_content(&l2, size, &make_blob(&f.id, f.md5_checksum.as_deref())) {
                            Ok(()) => { crate::flog!("Drive'da içerik değişti, yerel kopya buluta döndürüldü: {}", cur.display()); n += 1; }
                            Err(e) => crate::flog!("içerik güncellenemedi ({}): {e}", cur.display()),
                        }
                    }
                }
                idx.clear(); index(root, &mut idx);
            }
            None => {
                // Yeni öğe: yalnızca üst klasör yerelde açılmışsa oluştur (açılmamışsa zaten ilk açışta listelenir).
                let Some(pd) = parent_dir else { continue };
                if pd.join(&want_name).exists() { continue; }
                let md = if is_dir { Metadata::directory() } else { Metadata::file().size(f.size.as_deref().and_then(|s| s.parse().ok()).unwrap_or(0)) };
                match PlaceholderFile::new(want_name.clone()).metadata(md).mark_in_sync().blob(make_blob(&f.id, f.md5_checksum.as_deref())).create::<&Path>(&pd) {
                    Ok(_) => { crate::flog!("Drive'da yeni öğe: {}", pd.join(&want_name).display()); n += 1; idx.clear(); index(root, &mut idx); }
                    Err(e) => crate::flog!("yeni öğe oluşturulamadı ({}): {e:?}", want_name),
                }
            }
        }
    }
    n
}

/// Arka planda Drive değişikliklerini izler (runtime kapanınca biter).
pub fn start(rt: Handle, client: auth::Client, email: String, root: PathBuf, shared: std::sync::Arc<std::sync::Mutex<crate::uploader::Shared>>) {
    rt.clone().spawn(async move {
        let tf = token_file(&email);
        let mut root_id: Option<String> = None;
        loop {
            tokio::time::sleep(POLL).await;
            if shared.lock().unwrap().paused { continue; }
            let step = async {
                let drive = Drive::new(auth::access_token(&client, &email).await?);
                if root_id.is_none() { root_id = Some(drive.file_meta("root").await.map_err(|e| format!("{e:?}"))?.id); }
                let saved = std::fs::read_to_string(&tf).ok().map(|t| t.trim().to_string()).filter(|t| !t.is_empty());
                let Some(tok) = saved else {
                    let t = drive.changes_start_token().await.map_err(|e| format!("{e:?}"))?;
                    std::fs::write(&tf, t).map_err(|e| e.to_string())?;
                    return Ok::<_, String>(0);
                };
                let (changes, next) = match drive.changes_since(&tok).await {
                    Ok(x) => x,
                    Err(drivenet::Error::Status(c, _)) if (400..=410).contains(&c) => { let _ = std::fs::remove_file(&tf); return Err("değişiklik işareti geçersiz, yenilenecek".into()); }
                    Err(e) => return Err(format!("{e:?}")),
                };
                let n = if changes.is_empty() { 0 } else {
                    let (r, rid) = (root.clone(), root_id.clone().unwrap());
                    tokio::task::spawn_blocking(move || apply(&r, &rid, changes)).await.map_err(|e| e.to_string())?
                };
                std::fs::write(&tf, next).map_err(|e| e.to_string())?;
                Ok(n)
            };
            if let Err(e) = step.await { crate::flog!("Drive değişiklikleri alınamadı: {e}"); }
        }
    });
}
