//! Eklenti yönetimi: yerleşik eklentiler (aç/kapat) ve üçüncü taraf eklentiler
//! (klasörden, zip'ten ya da GitHub adresinden kurulum; kaldırma). Üçüncü taraf eklentiler
//! `%APPDATA%\FramioDrive\plugins\<id>\framio-plugin.json` ile tanımlanır.
use super::*;
use crate::wm::ps_out;

pub struct B {
    pub id: &'static str,
    pub name: &'static str,
    pub desc: &'static str,
    pub audience: &'static str,
    pub def: bool,
    pub cat: &'static str,
    pub perms: &'static [&'static str],
    pub tab: &'static str,
}

pub const BUILTIN: &[B] = &[
    B {
        id: "forum",
        name: "Forum paylaşımı",
        desc: "Flarum tabanlı forumlara galeri, kategori ve içerik gönderme; birden çok foruma aktarma, filigran ve zamanlama.",
        audience: "Yalnızca ilgili forumların üyeleri için",
        def: false,
        cat: "Paylaşım",
        perms: &["Forum hesabına giriş (parola Windows Kimlik Bilgisi Yöneticisi'nde tutulur)", "Seçtiğin dosyaları seçtiğin foruma gönderir", "İnternet erişimi"],
        tab: "set",
    },
    B {
        id: "meta",
        name: "Meta yayın",
        desc: "Instagram, Facebook Sayfası ve Threads hesaplarını bağla; belirteçleri sına, yenile ve toplu ekle.",
        audience: "Sosyal medya hesabı yönetenler için",
        def: true,
        cat: "Sosyal medya",
        perms: &["Meta hesap belirteçleri (Windows Kimlik Bilgisi Yöneticisi'nde tutulur)", "Meta Graph API'ye internet erişimi"],
        tab: "meta",
    },
    B {
        id: "assistant",
        name: "Sesli asistan",
        desc: "Kısayolla (Ctrl+Alt+Boşluk) konuş: Drive'da ara, dosya aç, çöpe at/geri yükle, yükle, filigran ve uygulama komutları. Gemini ile çalışır, sözlü yanıt verir.",
        audience: "Gemini API anahtarı gerekir (Ayarlar > Yapay zekâ, ücretsiz alınabilir)",
        def: false,
        cat: "Yapay zekâ",
        perms: &["Mikrofon: yalnızca sen kısayola basınca dinler", "Ses kaydı yalnızca o sırada Gemini API'ye gönderilir, saklanmaz", "Drive dosyalarında arama ve açma", "Silme, geri yükleme ve yükleme için her seferinde onay ister", "Uygulama sekmelerini ve eklenti ayarlarını değiştirebilir"],
        tab: "set",
    },
];

pub fn builtin_default(id: &str) -> bool {
    BUILTIN.iter().find(|b| b.id == id).map(|b| b.def).unwrap_or(false)
}

fn plugins_dir() -> PathBuf { data_dir().join("plugins") }
fn q(s: &str) -> String { s.replace('\'', "''") }
fn sv(v: &Value) -> String { v.as_str().unwrap_or("").trim().to_string() }
fn valid_id(id: &str) -> bool {
    (2..=40).contains(&id.len()) && !id.starts_with('-') && id.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
}

fn read_manifest(dir: &Path) -> Result<Value, String> {
    let t = std::fs::read_to_string(dir.join("framio-plugin.json")).map_err(|_| "framio-plugin.json bulunamadı".to_string())?;
    let m: Value = serde_json::from_str(t.trim_start_matches('\u{feff}')).map_err(|e| format!("framio-plugin.json okunamadı: {e}"))?;
    let id = sv(&m["id"]);
    if !valid_id(&id) { return Err("Eklenti kimliği (id) 2–40 karakter olmalı; yalnızca küçük harf, rakam ve tire".into()); }
    if BUILTIN.iter().any(|b| b.id == id) { return Err("Bu kimlik yerleşik bir eklentiye ait".into()); }
    if sv(&m["name"]).is_empty() { return Err("Eklentinin adı (name) yok".into()); }
    Ok(m)
}

fn short(s: String, n: usize) -> String { s.chars().take(n).collect() }

fn info(m: &Value, dir: &Path) -> Value {
    let id = sv(&m["id"]);
    let perms: Vec<String> = m["permissions"].as_array().map(|a| a.iter().filter_map(|x| x.as_str()).map(|x| short(x.to_string(), 140)).take(20).collect()).unwrap_or_default();
    let tools: Vec<Value> = m["tools"].as_array().map(|a| a.iter().take(40).map(|t| json!({ "name": short(sv(&t["name"]), 60), "desc": short(sv(&t["description"]), 200) })).collect()).unwrap_or_default();
    let home = sv(&m["homepage"]);
    let home = if home.starts_with("https://") { home } else { String::new() };
    let cat = short(sv(&m["category"]), 30);
    let cat = if cat.is_empty() { "Diğer".to_string() } else { cat };
    json!({
        "id": id,
        "name": short(sv(&m["name"]), 60),
        "version": short(sv(&m["version"]), 20),
        "author": short(sv(&m["author"]), 60),
        "desc": short(sv(&m["description"]), 400),
        "homepage": home,
        "cat": cat,
        "perms": perms,
        "tools": tools,
        "mcp": !m["mcp"].is_null(),
        "enabled": crate::ext_on(&id),
        "builtin": false,
        "path": dir.to_string_lossy(),
    })
}

fn third_party() -> Vec<Value> {
    let mut out = vec![];
    if let Ok(rd) = std::fs::read_dir(plugins_dir()) {
        for e in rd.flatten() {
            let p = e.path();
            if !p.is_dir() { continue; }
            if let Ok(m) = read_manifest(&p) { out.push(info(&m, &p)); }
        }
    }
    out.sort_by(|a, b| sv(&a["name"]).to_lowercase().cmp(&sv(&b["name"]).to_lowercase()));
    out
}

#[tauri::command]
pub fn ext_list(app: tauri::AppHandle) -> Value {
    let ver = app.package_info().version.to_string();
    let mut v: Vec<Value> = BUILTIN.iter().map(|b| json!({
        "id": b.id, "name": b.name, "desc": b.desc, "audience": b.audience, "cat": b.cat, "perms": b.perms,
        "tab": b.tab, "enabled": crate::ext_on(b.id), "builtin": true, "version": ver, "author": "Framio",
        "tools": [], "mcp": false, "homepage": "", "path": ""
    })).collect();
    v.extend(third_party());
    json!(v)
}

fn set_on(id: &str, on: bool) {
    let mut s = load_settings();
    if !s["extensions"].is_object() { s["extensions"] = json!({}); }
    s["extensions"][id] = json!(on);
    save_settings(&s);
}

#[tauri::command]
pub fn ext_set(id: String, on: bool) -> Result<(), String> {
    let known = BUILTIN.iter().any(|b| b.id == id) || (valid_id(&id) && plugins_dir().join(&id).is_dir());
    if !known { return Err("Bilinmeyen eklenti".into()); }
    set_on(&id, on);
    Ok(())
}

#[tauri::command]
pub fn ext_remove(id: String) -> Result<(), String> {
    if !valid_id(&id) || BUILTIN.iter().any(|b| b.id == id) { return Err("Yerleşik eklentiler kaldırılamaz, yalnızca kapatılabilir".into()); }
    let d = plugins_dir().join(&id);
    if d.is_dir() { std::fs::remove_dir_all(&d).map_err(|e| format!("Silinemedi: {e}"))?; }
    let mut s = load_settings();
    if let Some(o) = s["extensions"].as_object_mut() { o.remove(&id); }
    save_settings(&s);
    Ok(())
}

#[tauri::command]
pub fn ext_open_dir() -> Result<(), String> {
    let d = plugins_dir();
    let _ = std::fs::create_dir_all(&d);
    std::process::Command::new("explorer.exe").arg(d).spawn().map(|_| ()).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn ext_pick(kind: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let head = "[Console]::OutputEncoding=[Text.Encoding]::UTF8; Add-Type -AssemblyName System.Windows.Forms; $f=New-Object System.Windows.Forms.Form -Property @{TopMost=$true}; ";
        let body = if kind == "zip" {
            "$d=New-Object System.Windows.Forms.OpenFileDialog; $d.Filter='Eklenti paketi (*.zip)|*.zip'; $d.Title='Eklenti zip dosyasını seç'; if($d.ShowDialog($f) -eq 'OK'){ $d.FileName }"
        } else {
            "$d=New-Object System.Windows.Forms.FolderBrowserDialog; $d.Description='Eklenti klasörünü seç (içinde framio-plugin.json olmalı)'; if($d.ShowDialog($f) -eq 'OK'){ $d.SelectedPath }"
        };
        Ok(ps_out(&format!("{head}{body}")))
    }).await.map_err(|e| e.to_string())?
}

fn copy_dir(src: &Path, dst: &Path, total: &mut u64, depth: u32) -> Result<(), String> {
    if depth > 8 { return Err("Klasör yapısı çok derin".into()); }
    std::fs::create_dir_all(dst).map_err(|e| e.to_string())?;
    for e in std::fs::read_dir(src).map_err(|e| e.to_string())?.flatten() {
        let n = e.file_name();
        let ns = n.to_string_lossy().to_string();
        if ns == ".git" || ns == "node_modules" { continue; }
        let ty = match e.file_type() { Ok(t) => t, Err(_) => continue };
        if ty.is_symlink() { continue; }
        if ty.is_dir() {
            copy_dir(&e.path(), &dst.join(&n), total, depth + 1)?;
        } else {
            *total += e.metadata().map(|m| m.len()).unwrap_or(0);
            if *total > 50 * 1024 * 1024 { return Err("Eklenti 50 MB sınırını aşıyor".into()); }
            std::fs::copy(e.path(), dst.join(&n)).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

fn install_dir(dir: &Path) -> Result<Value, String> {
    let m = read_manifest(dir)?;
    let id = sv(&m["id"]);
    let dst = plugins_dir().join(&id);
    if let (Ok(a), Ok(b)) = (dir.canonicalize(), plugins_dir().canonicalize()) {
        if a.starts_with(&b) { return Err("Bu eklenti zaten kurulu klasörde".into()); }
    }
    let existed = dst.exists();
    if existed { std::fs::remove_dir_all(&dst).map_err(|e| format!("Eski sürüm silinemedi: {e}"))?; }
    let mut t = 0u64;
    copy_dir(dir, &dst, &mut t, 0)?;
    if !existed { set_on(&id, true); }
    Ok(json!({ "plugin": info(&m, &dst), "updated": existed }))
}

fn tmp_path(tag: &str) -> PathBuf {
    let n = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_nanos()).unwrap_or(0);
    std::env::temp_dir().join(format!("fdplug_{tag}_{n}"))
}

fn unzip(zip: &Path, to: &Path) -> Result<(), String> {
    let out = ps_out(&format!("$ErrorActionPreference='Stop'; try {{ Expand-Archive -LiteralPath '{}' -DestinationPath '{}' -Force }} catch {{ 'ERR: ' + $_.Exception.Message }}", q(&zip.to_string_lossy()), q(&to.to_string_lossy())));
    if out.starts_with("ERR:") { return Err(format!("Zip açılamadı ({})", out.trim_start_matches("ERR:").trim())); }
    if !to.exists() { return Err("Zip açılamadı".into()); }
    Ok(())
}

fn find_root(tmp: &Path) -> Option<PathBuf> {
    if tmp.join("framio-plugin.json").exists() { return Some(tmp.to_path_buf()); }
    std::fs::read_dir(tmp).ok()?.flatten().map(|e| e.path()).find(|p| p.is_dir() && p.join("framio-plugin.json").exists())
}

fn install_zip(zip: &Path) -> Result<Value, String> {
    let tmp = tmp_path("x");
    let r = unzip(zip, &tmp).and_then(|_| {
        let root = find_root(&tmp).ok_or_else(|| "Zip içinde framio-plugin.json bulunamadı".to_string())?;
        install_dir(&root)
    });
    let _ = std::fs::remove_dir_all(&tmp);
    r
}

/// "https://github.com/sahip/depo", ".../tree/dal" ya da "sahip/depo" kabul edilir.
fn parse_gh(src: &str) -> Result<(String, String, String), String> {
    let s = src.trim().trim_end_matches('/').trim_end_matches(".git");
    let s = s.strip_prefix("https://github.com/").or_else(|| s.strip_prefix("http://github.com/")).or_else(|| s.strip_prefix("github.com/")).unwrap_or(s);
    let p: Vec<&str> = s.split('/').collect();
    let ok = |x: &str| !x.is_empty() && x.len() <= 100 && x.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '.');
    if p.len() < 2 || !ok(p[0]) || !ok(p[1]) { return Err("GitHub adresi 'github.com/sahip/depo' biçiminde olmalı".into()); }
    let br = if p.len() >= 4 && p[2] == "tree" && ok(p[3]) { p[3].to_string() } else { "HEAD".to_string() };
    Ok((p[0].to_string(), p[1].to_string(), br))
}

fn install_url(src: &str) -> Result<Value, String> {
    let (o, r, br) = parse_gh(src)?;
    let zip = tmp_path("d").with_extension("zip");
    let out = ps_out(&format!("$ErrorActionPreference='Stop'; try {{ [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -UseBasicParsing -Uri 'https://codeload.github.com/{o}/{r}/zip/{br}' -OutFile '{}' }} catch {{ 'ERR: ' + $_.Exception.Message }}", q(&zip.to_string_lossy())));
    if out.starts_with("ERR:") || !zip.exists() { let _ = std::fs::remove_file(&zip); return Err("GitHub'dan indirilemedi; adresi ve depo erişimini kontrol et".into()); }
    if std::fs::metadata(&zip).map(|m| m.len()).unwrap_or(0) > 50 * 1024 * 1024 { let _ = std::fs::remove_file(&zip); return Err("Eklenti 50 MB sınırını aşıyor".into()); }
    let r = install_zip(&zip);
    let _ = std::fs::remove_file(&zip);
    r
}

/// kind: "dir" | "zip" | "url"
#[tauri::command]
pub async fn ext_install(kind: String, src: String) -> Result<Value, String> {
    tauri::async_runtime::spawn_blocking(move || match kind.as_str() {
        "dir" => install_dir(Path::new(&src)),
        "zip" => install_zip(Path::new(&src)),
        "url" => install_url(&src),
        _ => Err("Bilinmeyen kaynak".into()),
    }).await.map_err(|e| e.to_string())?
}
