//! Akıllı dizin düzenleme: görselleri Gemini ile okur, ad/klasör planını uygular, geri alır.
use crate::{clean_name, data_dir, de, drv, load_settings, save_settings, shrink_to};
use base64::Engine as _;
use drivenet::gemini;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, Emitter};

static CANCEL: AtomicBool = AtomicBool::new(false);
const FOLDER: &str = "application/vnd.google-apps.folder";

fn default_profiles() -> Value {
    json!([{
        "id": "otobus", "name": "Otobüs (Ulaşım arşivi)",
        "prompt": "Bu fotoğraftaki otobüsü incele ve istenen alanları doldur. Plakayı yalnızca net okuyabiliyorsan yaz (Türk plaka biçimi, örn. 06 ABC 123); okuyamıyorsan boş bırak. Firmayı kaporta giydirmesi ve logolardan belirle. Emin olmadığın alanı tahmin etme, boş bırak.",
        "fields": [
            { "key": "plaka", "desc": "Araç plakası, örn. 06 ABC 123; okunamıyorsa boş", "upper": true },
            { "key": "firma", "desc": "Otobüsü işleten firma/marka (giydirmeden), örn. Varan Turizm", "upper": false },
            { "key": "model", "desc": "Araç modeli, örn. Travego, Tourismo, Conecto", "upper": false },
            { "key": "marka", "desc": "Üretici marka, örn. Mercedes-Benz, MAN, Neoplan", "upper": false }
        ],
        "file_pattern": "{plaka}-{n}", "folder_pattern": "{marka}/{model}/{firma}/{plaka}",
        "required": "plaka", "unknown_folder": "_Okunamayan", "unknown_value": "Bilinmeyen"
    }])
}

fn profiles_path() -> PathBuf { data_dir().join("profiles.json") }
fn journal_path() -> PathBuf { data_dir().join("org_journal.json") }

#[tauri::command]
pub fn org_profiles_get() -> Value {
    std::fs::read_to_string(profiles_path()).ok().and_then(|t| serde_json::from_str::<Value>(&t).ok()).filter(|v| v.as_array().map(|a| !a.is_empty()).unwrap_or(false)).unwrap_or_else(default_profiles)
}
#[tauri::command]
pub fn org_profiles_save(profiles: Value) -> Result<(), String> {
    let _ = std::fs::create_dir_all(data_dir());
    std::fs::write(profiles_path(), profiles.to_string()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn ai_cfg_get() -> Value {
    let s = load_settings();
    json!({ "has_key": gemini::load_key().is_some(), "model": s["ai"]["model"].as_str().unwrap_or("gemini-2.5-flash"), "delay": s["ai"]["delay"].as_f64().unwrap_or(7.0) })
}
#[tauri::command]
pub fn ai_cfg_set(key: String, model: String, delay: f64) -> Result<(), String> {
    if !key.trim().is_empty() { gemini::save_key(key.trim())?; }
    let mut s = load_settings();
    s["ai"]["model"] = json!(if model.trim().is_empty() { "gemini-2.5-flash" } else { model.trim() });
    s["ai"]["delay"] = json!(delay.max(0.0).min(120.0));
    save_settings(&s);
    Ok(())
}
#[tauri::command]
pub fn ai_key_clear() { gemini::clear_key(); }

#[tauri::command]
pub fn open_url(url: String) -> Result<(), String> {
    if !url.starts_with("https://aistudio.google.com/") { return Err("izin verilmeyen adres".into()); }
    std::process::Command::new("cmd").args(["/C", "start", "", &url]).spawn().map(|_| ()).map_err(|e| e.to_string())
}

fn is_img(name: &str) -> Option<&'static str> {
    match name.rsplit('.').next().unwrap_or("").to_lowercase().as_str() {
        "jpg" | "jpeg" => Some("image/jpeg"), "png" => Some("image/png"), "webp" => Some("image/webp"), _ => None,
    }
}

/// Kaynak klasördeki görselleri listeler. source: {kind:"drive",email,folder} | {kind:"local",path}
#[tauri::command]
pub async fn org_scan(source: Value) -> Result<Value, String> {
    let mut out: Vec<Value> = vec![];
    if source["kind"] == "drive" {
        let d = drv(source["email"].as_str().unwrap_or("")).await?;
        for f in d.list_children(source["folder"].as_str().unwrap_or("root")).await.map_err(de)? {
            if f.mime_type.starts_with("image/") || (f.mime_type != FOLDER && is_img(&f.name).is_some()) {
                out.push(json!({ "key": f.id, "name": f.name, "mime": f.mime_type, "size": f.size }));
            }
        }
    } else {
        let dir = PathBuf::from(source["path"].as_str().unwrap_or("").trim().trim_matches('"'));
        let rd = std::fs::read_dir(&dir).map_err(|_| "Klasör açılamadı; yolu kontrol et".to_string())?;
        for e in rd.flatten() {
            let name = e.file_name().to_string_lossy().into_owned();
            if let (Some(m), true) = (is_img(&name), e.path().is_file()) {
                out.push(json!({ "key": e.path().display().to_string(), "name": name, "mime": m, "size": e.metadata().map(|m| m.len()).ok() }));
            }
        }
    }
    out.sort_by(|a, b| a["name"].as_str().unwrap_or("").to_lowercase().cmp(&b["name"].as_str().unwrap_or("").to_lowercase()));
    Ok(json!(out))
}

#[tauri::command]
pub fn org_cancel() { CANCEL.store(true, Ordering::SeqCst); }

/// Görselleri sırayla Gemini'ye gönderir; her sonuç için "org-progress" olayı yayar.
#[tauri::command]
pub async fn org_analyze(app: AppHandle, source: Value, items: Vec<Value>, profile: Value) -> Result<(), String> {
    let key = gemini::load_key().ok_or("Gemini anahtarı yok — Ayarlar > Yapay zekâ bölümünden ekle")?;
    let cfg = ai_cfg_get();
    let model = cfg["model"].as_str().unwrap_or("gemini-2.5-flash").to_string();
    let delay = cfg["delay"].as_f64().unwrap_or(7.0);
    let fields: Vec<(String, String)> = profile["fields"].as_array().map(|a| a.iter().map(|f| (f["key"].as_str().unwrap_or("").to_string(), f["desc"].as_str().unwrap_or("").to_string())).filter(|f| !f.0.is_empty()).collect()).unwrap_or_default();
    if fields.is_empty() { return Err("Profilde alan yok".into()); }
    let prompt = profile["prompt"].as_str().unwrap_or("").to_string();
    let drive = if source["kind"] == "drive" { Some(drv(source["email"].as_str().unwrap_or("")).await?) } else { None };
    let tmp = std::env::temp_dir().join("FramioOrg");
    let _ = std::fs::create_dir_all(&tmp);
    CANCEL.store(false, Ordering::SeqCst);
    let total = items.len();
    for (i, it) in items.iter().enumerate() {
        if CANCEL.load(Ordering::SeqCst) { break; }
        let k = it["key"].as_str().unwrap_or("").to_string();
        let name = it["name"].as_str().unwrap_or("").to_string();
        let mime = it["mime"].as_str().unwrap_or("image/jpeg").to_string();
        let r: Result<Value, String> = async {
            let src: PathBuf = if let Some(d) = &drive {
                let p = tmp.join(format!("a_{}_{}", i, clean_name(&name)));
                d.download(&k, &p).await.map_err(de)?;
                p
            } else { PathBuf::from(&k) };
            let small = tmp.join(format!("s_{i}.jpg"));
            let (sp, sm) = (src.clone(), small.clone());
            let shrunk = tauri::async_runtime::spawn_blocking(move || shrink_to(&sp, &sm, 1600, 85)).await.map_err(|e| e.to_string())?;
            let (path, m) = if shrunk { (small.clone(), "image/jpeg".to_string()) } else { (src.clone(), mime.clone()) };
            let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
            if drive.is_some() { let _ = std::fs::remove_file(&src); }
            let _ = std::fs::remove_file(&small);
            if bytes.len() > 15 * 1024 * 1024 { return Err("görsel çok büyük".into()); }
            gemini::analyze(&key, &model, &prompt, &fields, &m, &base64::engine::general_purpose::STANDARD.encode(&bytes)).await
        }.await;
        let ev = match r {
            Ok(v) => json!({ "i": i, "total": total, "key": k, "name": name, "ok": true, "fields": v }),
            Err(e) => json!({ "i": i, "total": total, "key": k, "name": name, "ok": false, "error": e }),
        };
        let _ = app.emit("org-progress", ev);
        if i + 1 < total && delay > 0.0 { tokio::time::sleep(std::time::Duration::from_millis((delay * 1000.0) as u64)).await; }
    }
    let _ = app.emit("org-progress", json!({ "done": true }));
    Ok(())
}

async fn ensure_chain(d: &drivenet::Drive, cache: &mut HashMap<String, String>, root: &str, comps: &[String]) -> Result<String, String> {
    let mut parent = root.to_string();
    let mut path = String::new();
    for c in comps {
        path = format!("{path}/{}", c.to_lowercase());
        if let Some(id) = cache.get(&path) { parent = id.clone(); continue; }
        let kids = d.list_children(&parent).await.map_err(de)?;
        let id = match kids.into_iter().find(|f| f.mime_type == FOLDER && f.name.eq_ignore_ascii_case(c)) {
            Some(f) => f.id,
            None => d.create_folder(c, &parent).await.map_err(de)?,
        };
        cache.insert(path.clone(), id.clone());
        parent = id;
    }
    Ok(parent)
}

fn clean_comp(s: &str) -> String {
    let t: String = s.chars().filter(|c| !"\\/:*?\"<>|".contains(*c)).collect();
    let t = t.trim().trim_end_matches('.').to_string();
    if t.is_empty() { "_".into() } else { t }
}

/// Planı uygular. plan: [{key,name,new_name,folder:[..]}]. Geri alma için günlük yazar.
#[tauri::command]
pub async fn org_apply(app: AppHandle, source: Value, plan: Vec<Value>) -> Result<Value, String> {
    let mut journal: Vec<Value> = vec![];
    let mut failed: Vec<String> = vec![];
    let mut done = 0u32;
    let total = plan.len();
    if source["kind"] == "drive" {
        let email = source["email"].as_str().unwrap_or("").to_string();
        let root = source["folder"].as_str().unwrap_or("root").to_string();
        let d = drv(&email).await?;
        let mut cache: HashMap<String, String> = HashMap::new();
        for (i, p) in plan.iter().enumerate() {
            let comps: Vec<String> = p["folder"].as_array().map(|a| a.iter().filter_map(|x| x.as_str()).map(clean_comp).collect()).unwrap_or_default();
            let new_name = clean_comp(p["new_name"].as_str().unwrap_or(""));
            let key = p["key"].as_str().unwrap_or("");
            let r: Result<String, String> = async {
                let parent = ensure_chain(&d, &mut cache, &root, &comps).await?;
                d.move_rename(key, &new_name, &parent).await.map_err(de)?;
                Ok(parent)
            }.await;
            match r {
                Ok(parent) => { done += 1; journal.push(json!({ "kind": "drive", "email": email, "key": key, "old_name": p["name"], "old_parent": root, "new_name": new_name, "new_parent": parent })); }
                Err(e) => failed.push(format!("{}: {e}", p["name"].as_str().unwrap_or(""))),
            }
            let _ = app.emit("org-apply", json!({ "i": i + 1, "total": total }));
        }
    } else {
        let root = PathBuf::from(source["path"].as_str().unwrap_or("").trim().trim_matches('"'));
        for (i, p) in plan.iter().enumerate() {
            let old = PathBuf::from(p["key"].as_str().unwrap_or(""));
            let mut dir = root.clone();
            for c in p["folder"].as_array().map(|a| a.iter().filter_map(|x| x.as_str()).collect::<Vec<_>>()).unwrap_or_default() { dir = dir.join(clean_comp(c)); }
            let new_name = clean_comp(p["new_name"].as_str().unwrap_or(""));
            let mut dest = dir.join(&new_name);
            let mut n = 2;
            while dest.exists() && dest != old {
                let (stem, ext) = match new_name.rsplit_once('.') { Some((s, e)) => (s.to_string(), format!(".{e}")), None => (new_name.clone(), String::new()) };
                dest = dir.join(format!("{stem} ({n}){ext}")); n += 1;
            }
            let r = std::fs::create_dir_all(&dir).and_then(|_| std::fs::rename(&old, &dest)).map_err(|e| e.to_string());
            match r {
                Ok(()) => { done += 1; journal.push(json!({ "kind": "local", "old_path": old.display().to_string(), "new_path": dest.display().to_string() })); }
                Err(e) => failed.push(format!("{}: {e}", p["name"].as_str().unwrap_or(""))),
            }
            let _ = app.emit("org-apply", json!({ "i": i + 1, "total": total }));
        }
    }
    let _ = std::fs::create_dir_all(data_dir());
    let _ = std::fs::write(journal_path(), Value::Array(journal).to_string());
    Ok(json!({ "done": done, "failed": failed }))
}

#[tauri::command]
pub fn org_has_journal() -> usize {
    std::fs::read_to_string(journal_path()).ok().and_then(|t| serde_json::from_str::<Vec<Value>>(&t).ok()).map(|v| v.len()).unwrap_or(0)
}

/// Son düzenlemeyi geri alır (adları ve konumları eski haline getirir; oluşan boş klasörler kalır).
#[tauri::command]
pub async fn org_undo() -> Result<Value, String> {
    let j: Vec<Value> = std::fs::read_to_string(journal_path()).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default();
    if j.is_empty() { return Err("Geri alınacak düzenleme yok".into()); }
    let (mut ok, mut bad) = (0u32, 0u32);
    let mut drv_cache: HashMap<String, drivenet::Drive> = HashMap::new();
    for e in j.iter().rev() {
        if e["kind"] == "drive" {
            let email = e["email"].as_str().unwrap_or("").to_string();
            if !drv_cache.contains_key(&email) { drv_cache.insert(email.clone(), drv(&email).await?); }
            let d = &drv_cache[&email];
            match d.move_rename(e["key"].as_str().unwrap_or(""), e["old_name"].as_str().unwrap_or(""), e["old_parent"].as_str().unwrap_or("root")).await { Ok(()) => ok += 1, Err(_) => bad += 1 }
        } else {
            match std::fs::rename(Path::new(e["new_path"].as_str().unwrap_or("")), Path::new(e["old_path"].as_str().unwrap_or(""))) { Ok(()) => ok += 1, Err(_) => bad += 1 }
        }
    }
    if bad == 0 { let _ = std::fs::remove_file(journal_path()); }
    Ok(json!({ "ok": ok, "failed": bad }))
}
