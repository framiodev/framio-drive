#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod logo;
use drivenet::auth;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::path::{Component, Path, PathBuf};
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, State, WindowEvent,
};

fn show_window(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("main") { let _ = w.show(); let _ = w.unminimize(); let _ = w.set_focus(); }
}

#[derive(Default)]
struct App { pending: Mutex<Vec<String>>, mounts: Mutex<HashMap<String, drivefs::Mount>>, verr: Mutex<HashMap<String, String>> }

fn names_path() -> std::path::PathBuf {
    std::path::Path::new(&std::env::var("APPDATA").unwrap_or_default()).join("FramioDrive").join("names.json")
}
fn load_names() -> serde_json::Map<String, Value> {
    std::fs::read_to_string(names_path()).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default()
}


// ---------- Windows bütünleşmesi: Ağ konumu, simge, sağ tık menüsü ----------
fn data_dir() -> PathBuf { Path::new(&std::env::var("APPDATA").unwrap_or_default()).join("FramioDrive") }

fn ps(script: &str) {
    use std::os::windows::process::CommandExt;
    let _ = std::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script])
        .creation_flags(0x0800_0000).output();
}
fn q(s: &str) -> String { s.replace('\'', "''") }

static ACCENT: Mutex<(u8, u8, u8)> = Mutex::new((179, 18, 43));
fn accent() -> (u8, u8, u8) { *ACCENT.lock().unwrap() }
fn parse_hex(h: &str) -> Option<(u8, u8, u8)> {
    let h = h.trim().trim_start_matches('#');
    if h.len() != 6 { return None; }
    Some((u8::from_str_radix(&h[0..2], 16).ok()?, u8::from_str_radix(&h[2..4], 16).ok()?, u8::from_str_radix(&h[4..6], 16).ok()?))
}

fn settings_path() -> PathBuf { data_dir().join("settings.json") }
fn load_settings() -> Value { std::fs::read_to_string(settings_path()).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_else(|| json!({})) }
fn save_settings(v: &Value) { let _ = std::fs::create_dir_all(data_dir()); let _ = std::fs::write(settings_path(), v.to_string()); }

fn hex_name(c: (u8, u8, u8)) -> String { format!("{:02x}{:02x}{:02x}", c.0, c.1, c.2) }

/// Dosya adı renge bağlıdır: renk değişince Windows'un simge önbelleği yeni dosyayı okur.
fn ensure_icon() -> PathBuf {
    let c = accent();
    let p = data_dir().join(format!("icon-{}.ico", hex_name(c)));
    let _ = std::fs::create_dir_all(data_dir());
    if !p.exists() { let _ = std::fs::write(&p, logo::ico(c)); }
    p
}
fn ensure_drive_icon() -> PathBuf {
    let c = accent();
    let p = data_dir().join(format!("drive-{}.ico", hex_name(c)));
    let _ = std::fs::create_dir_all(data_dir());
    if !p.exists() { let _ = std::fs::write(&p, logo::drive_ico(c)); }
    p
}

fn run_hidden(cmd: &str, args: &[&str]) -> bool {
    use std::os::windows::process::CommandExt;
    std::process::Command::new(cmd).args(args).creation_flags(0x0800_0000).output().map(|o| o.status.success()).unwrap_or(false)
}

/// (sürücü harfi, sürücü adı, ağ kısayolu klasör adı)
fn drive_cfg(email: &str) -> (String, String, String) {
    let s = load_settings();
    let d = &s["drives"][email];
    (d["letter"].as_str().unwrap_or("").to_string(), d["label"].as_str().unwrap_or("").to_string(), d["nl"].as_str().unwrap_or("").to_string())
}
fn save_drive_cfg(email: &str, letter: &str, label: &str, nl: &str) {
    let mut s = load_settings();
    s["drives"][email] = json!({ "letter": letter, "label": label, "nl": nl });
    save_settings(&s);
}
fn sanitize(name: &str) -> String {
    let n: String = name.chars().map(|c| if r#"<>:"/\|?*"#.contains(c) || c.is_control() { '_' } else { c }).collect();
    n.trim().trim_end_matches('.').to_string()
}
fn drive_key(letter: &str) -> String { format!("HKCU\\Software\\Classes\\Applications\\Explorer.exe\\Drives\\{letter}") }

/// Sürücü harfini (subst) ve Gezgin'deki adını kaldırır.
fn remove_drive_mapping(email: &str) {
    let (letter, _, _) = drive_cfg(email);
    if letter.is_empty() { return; }
    run_hidden("subst", &[&format!("{letter}:"), "/D"]);
    run_hidden("reg", &["delete", &drive_key(&letter), "/f"]);
}

fn free_letters() -> Vec<String> {
    ('D'..='Z').filter(|c| !Path::new(&format!("{c}:\\")).exists()).map(|c| c.to_string()).collect()
}

/// Eski "eşitleme klasörü" görünümünü kaldırır: sürücü harfi (subst) + "Ağdaki konumlar" kısayolu.
/// Bağlı sürücü (WinFsp) açıkken Gezgin'de tek, gerçek sürücü kalsın diye kullanılır.
fn cleanup_legacy_view(email: &str) {
    let (letter, label, nl) = drive_cfg(email);
    remove_drive_mapping(email);
    if !nl.is_empty() {
        let base = Path::new(&std::env::var("APPDATA").unwrap_or_default()).join("Microsoft").join("Windows").join("Network Shortcuts");
        run_hidden("cmd", &["/C", "rmdir", "/S", "/Q", &base.join(&nl).display().to_string()]);
    }
    save_drive_cfg(email, &letter, &label, "");
    ps("& ie4uinit.exe -show");
}

/// Hesabın Windows bütünleşmesi. Eski "eşitleme klasörü" görünümü (sürücü harfi + Ağdaki konumlar kısayolu)
/// kaldırıldı; tek sürücü, WinFsp ile bağlanan sürücüdür. Burada yalnızca kenar çubuğundaki
/// eşitleme klasörünün adı/simgesi ayarlanır ve eski görünümün artıkları temizlenir.
fn ensure_network_location(email: &str) {
    cleanup_legacy_view(email);
    let icon = ensure_drive_icon();
    let (_, label, _) = vcfg(email);
    let shown = if label.trim().is_empty() { default_label(email) } else { label.trim().to_string() };
    let script = format!(
        "Get-ChildItem 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\SyncRootManager' -ErrorAction SilentlyContinue | Where-Object {{ $_.PSChildName -like 'FramioDrive!*{email}' }} | ForEach-Object {{ Set-ItemProperty -Path $_.PSPath -Name IconResource -Value '{icon},0'; Set-ItemProperty -Path $_.PSPath -Name DisplayNameResource -Value '{shown}' }}; & ie4uinit.exe -show",
        icon = q(&icon.display().to_string()), email = q(email), shown = q(&shown));
    ps(&script);
}

/// Gezginde dosya/klasöre sağ tık > "Framio Drive'a gönder…" (Windows 11'de "Diğer seçenekleri göster" altında).
fn ensure_context_menu() {
    let Ok(exe) = std::env::current_exe() else { return };
    let icon = ensure_icon();
    let mut script = String::new();
    for base in ["Software\\Classes\\*\\shell\\FramioDrive", "Software\\Classes\\Directory\\shell\\FramioDrive"] {
        script += &format!(
            "$k=[Microsoft.Win32.Registry]::CurrentUser.CreateSubKey('{base}'); $k.SetValue('', \"Framio Drive'a gönder…\"); $k.SetValue('Icon','{icon}'); \
             $c=$k.CreateSubKey('command'); $c.SetValue('', '\"{exe}\" --send \"%1\"'); ",
            base = base, icon = q(&icon.display().to_string()), exe = q(&exe.display().to_string()));
    }
    ps(&script);
}

fn send_args(argv: &[String]) -> Vec<String> {
    let mut out = vec![];
    let mut it = argv.iter();
    while let Some(a) = it.next() { if a == "--send" { if let Some(p) = it.next() { out.push(p.clone()); } } }
    out
}

fn safe_rel(rel: &str) -> Result<PathBuf, String> {
    let p = PathBuf::from(rel.replace('/', "\\"));
    if p.components().any(|c| !matches!(c, Component::Normal(_))) { return Err("geçersiz yol".into()); }
    Ok(p)
}

fn unique_dest(dir: &Path, name: &std::ffi::OsStr) -> PathBuf {
    let first = dir.join(name);
    if !first.exists() { return first; }
    let n = Path::new(name);
    let stem = n.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default();
    let ext = n.extension().map(|e| format!(".{}", e.to_string_lossy())).unwrap_or_default();
    for i in 2.. { let c = dir.join(format!("{stem} ({i}){ext}")); if !c.exists() { return c; } }
    first
}

fn copy_any(src: &Path, dst: &Path) -> std::io::Result<()> {
    if src.is_dir() {
        std::fs::create_dir_all(dst)?;
        for e in std::fs::read_dir(src)?.flatten() { copy_any(&e.path(), &dst.join(e.file_name()))?; }
        Ok(())
    } else { std::fs::copy(src, dst).map(|_| ()) }
}

#[tauri::command]
fn take_pending(app: State<App>) -> Vec<String> { std::mem::take(&mut *app.pending.lock().unwrap()) }



/// Seçilen dosyaları hesabın seçilen klasörüne kopyalar; yükleme kuyruğu gerisini halleder.

// ---------- Uygulama içi Drive gezgini (Drive API) ----------
async fn drv(email: &str) -> Result<drivenet::Drive, String> {
    let c = auth::Client::load()?;
    Ok(drivenet::Drive::new(auth::access_token(&c, &email.to_lowercase()).await?))
}
fn de<E: std::fmt::Debug>(e: E) -> String { format!("{e:?}") }
fn bad_name(n: &str) -> bool { n.is_empty() || n.contains(['\\', '/', ':', '*', '?', '"', '<', '>', '|']) }

#[tauri::command]
async fn fs_list(email: String, parent: String) -> Result<Value, String> {
    let d = drv(&email).await?;
    let mut v = d.list_children(&parent).await.map_err(de)?;
    v.sort_by(|a, b| {
        let fa = a.mime_type == "application/vnd.google-apps.folder"; let fb = b.mime_type == "application/vnd.google-apps.folder";
        fb.cmp(&fa).then(a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    Ok(json!(v.iter().map(|f| json!({
        "id": f.id, "name": f.name, "folder": f.mime_type == "application/vnd.google-apps.folder",
        "size": f.size.as_ref().and_then(|x| x.parse::<u64>().ok()), "modified": f.modified_time, "mime": f.mime_type
    })).collect::<Vec<_>>()))
}

#[tauri::command]
async fn fs_usage(email: String) -> Result<Value, String> {
    let (limit, used) = drv(&email).await?.storage_quota().await.map_err(de)?;
    Ok(json!({ "limit": limit, "used": used }))
}

#[tauri::command]
async fn fs_mkdir(email: String, parent: String, name: String) -> Result<String, String> {
    let name = name.trim().to_string();
    if bad_name(&name) { return Err("geçersiz klasör adı".into()); }
    drv(&email).await?.create_folder(&name, &parent).await.map_err(de)
}

#[tauri::command]
async fn fs_rename(email: String, id: String, name: String, parent: String) -> Result<(), String> {
    let name = name.trim().to_string();
    if bad_name(&name) { return Err("geçersiz ad".into()); }
    drv(&email).await?.move_rename(&id, &name, &parent).await.map_err(de)
}

#[tauri::command]
async fn fs_trash(email: String, id: String) -> Result<(), String> {
    drv(&email).await?.trash(&id).await.map_err(de)
}

async fn put_file(d: &drivenet::Drive, path: &Path, name: &str, parent: &str) -> Result<(), String> {
    let len = std::fs::metadata(path).map_err(|e| e.to_string())?.len();
    let sess = d.start_upload(name, parent, len).await.map_err(de)?;
    d.upload_file(&sess, path, |_| {}).await.map_err(de)?;
    Ok(())
}

/// Dosya ve klasörleri (alt klasörleriyle) Drive'daki verilen klasöre yükler.
#[tauri::command]
async fn fs_upload(email: String, parent: String, paths: Vec<String>) -> Result<Value, String> {
    let d = drv(&email).await?;
    let (mut sent, mut failed) = (0u32, vec![]);
    let mut stack: Vec<(PathBuf, String)> = vec![];
    let junk = |n: &str| matches!(n.to_lowercase().as_str(), "thumbs.db" | "desktop.ini" | ".ds_store");
    let mut items: Vec<(PathBuf, String)> = paths.into_iter().map(|p| (PathBuf::from(p), parent.clone())).collect();
    items.reverse();
    loop {
        let (path, par) = match items.pop() { Some(x) => x, None => match stack.pop() {
            Some((dir, pid)) => {
                if let Ok(rd) = std::fs::read_dir(&dir) { for e in rd.flatten() { items.push((e.path(), pid.clone())); } }
                continue;
            }
            None => break,
        } };
        let Some(name) = path.file_name().map(|n| n.to_string_lossy().into_owned()) else { continue };
        let Ok(meta) = std::fs::metadata(&path) else { failed.push(name); continue };
        if meta.is_dir() {
            match d.create_folder(&name, &par).await { Ok(id) => stack.push((path, id)), Err(e) => { drivesync::flog!("klasör açılamadı {name}: {e:?}"); failed.push(name) } }
        } else if !junk(&name) {
            match put_file(&d, &path, &name, &par).await { Ok(()) => sent += 1, Err(e) => { drivesync::flog!("yüklenemedi {name}: {e}"); failed.push(name) } }
        }
    }
    Ok(json!({ "sent": sent, "failed": failed }))
}

/// Sürücü bağlıysa Gezgin'de ilgili klasörü açar.
#[tauri::command]
fn fs_reveal(app: State<App>, email: String, rel: String) -> Result<(), String> {
    let email = email.to_lowercase();
    if !app.mounts.lock().unwrap().contains_key(&email) { return Err("Sürücü bağlı değil (Ayarlar'dan bağla)".into()); }
    let (_, letter, _) = vcfg(&email);
    let rel = rel.replace('/', "\\");
    std::process::Command::new("explorer.exe").arg(format!("{}:\\{}", letter.trim_end_matches(':'), rel)).spawn().map(|_| ()).map_err(|e| e.to_string())
}

#[tauri::command]
fn client_status() -> bool { auth::Client::load().is_ok() }

#[tauri::command]
fn save_client(id: String, secret: String) -> Result<(), String> { auth::Client::save(&id, &secret) }

#[tauri::command]
fn accounts(app: State<App>) -> Value {
    let names = load_names();
    let mounts = app.mounts.lock().unwrap();
    let list: Vec<Value> = auth::accounts().into_iter().map(|e| {
        let e = e.to_lowercase();
        let m = mounts.get(&e);
        json!({ "email": e, "name": names.get(&e).and_then(|v| v.as_str()).unwrap_or(""), "connected": true, "mounted": m.is_some(), "pending": m.map(|m| m.pending()).unwrap_or(0) })
    }).collect();
    json!(list)
}



/// Hesaptan çıkış: bağlantıyı kapatır, eşitleme kaydını, sürücü harfini ve kısayolu siler, yerel klasörü temizler, token'ı unutur.
/// Yüklenmemiş dosya varsa reddeder. Drive'daki dosyalara dokunulmaz.
#[tauri::command]
async fn sign_out(app: State<'_, App>, email: String) -> Result<(), String> {
    let email = email.to_lowercase();
    if let Some(m) = app.mounts.lock().unwrap().get(&email) {
        if m.pending() > 0 { return Err(format!("{} dosya hâlâ yükleniyor; bitince tekrar dene", m.pending())); }
    }
    let vm = app.mounts.lock().unwrap().remove(&email);
    if vm.is_some() { tauri::async_runtime::spawn_blocking(move || drop(vm)).await.map_err(|e| e.to_string())?; }
    { let (_, l, n) = vcfg(&email); save_vcfg(&email, false, &l, &n); }
    tauri::async_runtime::spawn_blocking(move || {
        remove_drive_mapping(&email);
        let _ = drivesync::unregister(&email);
        let (_, _, nl) = drive_cfg(&email);
        if !nl.is_empty() {
            let base = Path::new(&std::env::var("APPDATA").unwrap_or_default()).join("Microsoft").join("Windows").join("Network Shortcuts");
            run_hidden("cmd", &["/C", "rmdir", "/S", "/Q", &base.join(&nl).display().to_string()]);
        }
        if let Ok(root) = drivesync::root_path(&email) {
            if std::fs::remove_dir_all(&root).is_err() { run_hidden("cmd", &["/C", "rmdir", "/S", "/Q", &root.display().to_string()]); }
            if root.exists() { drivesync::flog!("yerel klasör tamamen silinemedi: {}", root.display()); }
        }
        let mut s = load_settings();
        if let Some(d) = s["drives"].as_object_mut() { d.remove(&email); }
        save_settings(&s);
        let mut n = load_names(); n.remove(&email);
        let _ = std::fs::write(names_path(), Value::Object(n).to_string());
        drivesync::flog!("hesaptan çıkış yapıldı: {email}");
        auth::forget(&email)
    }).await.map_err(|e| e.to_string())?
}

static ACCENT_GEN: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);

#[tauri::command]
fn set_accent(hex: String) {
    let Some(c) = parse_hex(&hex) else { return };
    if accent() == c { return; }
    *ACCENT.lock().unwrap() = c;
    let mut s = load_settings();
    s["accent"] = json!(format!("#{:02x}{:02x}{:02x}", c.0, c.1, c.2));
    save_settings(&s);
    // Renk seçimi bitince (sürükleme durunca) Gezgin simgelerini yenile
    let gen = ACCENT_GEN.fetch_add(1, std::sync::atomic::Ordering::SeqCst) + 1;
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(900));
        if ACCENT_GEN.load(std::sync::atomic::Ordering::SeqCst) != gen { return; }
        for e in auth::accounts() { ensure_network_location(&e.to_lowercase()); }
    });
}

#[tauri::command]
fn drive_info(email: String) -> Value {
    let email = email.to_lowercase();
    let (letter, label, _) = drive_cfg(&email);
    let mut letters = free_letters();
    if !letter.is_empty() && !letters.contains(&letter) { letters.push(letter.clone()); letters.sort(); }
    json!({ "letters": letters, "letter": letter, "label": label })
}

#[tauri::command]
async fn set_drive(email: String, letter: String, label: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let email = email.to_lowercase();
        let letter = letter.trim().trim_end_matches(':').to_uppercase();
        if !letter.is_empty() && !(letter.len() == 1 && letter.chars().all(|c| c.is_ascii_uppercase())) { return Err("geçersiz sürücü harfi".to_string()); }
        let label = label.trim().to_string();
        if label.chars().any(|c| c.is_control() || "<>:\"/\\|?*".contains(c)) { return Err("ad geçersiz karakter içeriyor".into()); }
        let (old, _, nl) = drive_cfg(&email);
        remove_drive_mapping(&email);
        if !letter.is_empty() && Path::new(&format!("{letter}:\\")).exists() {
            // eski eşlemeyi geri kur
            save_drive_cfg(&email, &old, &drive_cfg(&email).1, &nl); ensure_network_location(&email);
            return Err(format!("{letter}: harfi başka bir sürücüde kullanılıyor"));
        }
        save_drive_cfg(&email, &letter, &label, &nl);
        ensure_network_location(&email);
        if !letter.is_empty() && !Path::new(&format!("{letter}:\\")).exists() { return Err("sürücü harfi atanamadı (uygulama yönetici olarak çalışıyorsa normal kullanıcı olarak aç)".into()); }
        Ok(())
    }).await.map_err(|e| e.to_string())?
}

// ---- Bağlı sürücü (WinFsp): Gezgin'de gerçek ağ sürücüsü, hesap kotasını gösterir ----
fn vcfg(email: &str) -> (bool, String, String) {
    let s = load_settings();
    let d = &s["vdrive"][email];
    (d["on"].as_bool().unwrap_or(false), d["letter"].as_str().unwrap_or("").to_string(), d["label"].as_str().unwrap_or("").to_string())
}
fn save_vcfg(email: &str, on: bool, letter: &str, label: &str) {
    let mut s = load_settings();
    s["vdrive"][email] = json!({ "on": on, "letter": letter, "label": label });
    save_settings(&s);
}
fn default_label(email: &str) -> String {
    let n = load_names();
    let name = n.get(email).and_then(|v| v.as_str()).unwrap_or("").trim().to_string();
    if !name.is_empty() { sanitize(&name) } else { email.split('@').next().unwrap_or("Drive").to_string() }
}

/// Gezgin'de "ad (\\sunucu) (X:)" yerine yalnızca "ad (X:)" görünsün: ağ sürücüsünü yeniden adlandırmak
/// Windows'ta MountPoints2 altına `_LabelFromReg` yazar; aynısını biz yazıyoruz.
fn set_net_label(label: &str) {
    let share = label.replace(' ', "_");
    let key = format!("HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\MountPoints2\\##Framio#{share}");
    run_hidden("reg", &["add", &key, "/v", "_LabelFromReg", "/t", "REG_SZ", "/d", label, "/f"]);
}

/// Açık olan tüm bağlı sürücüleri kapatır; bekleyen yüklemelerin bitmesini bekler (en çok 120 sn).
fn shutdown_mounts(app: &AppHandle) {
    let ms: Vec<drivefs::Mount> = { let st = app.state::<App>(); let mut g = st.mounts.lock().unwrap(); g.drain().map(|(_, m)| m).collect() };
    for m in &ms { m.wait_uploads(120); }
    drop(ms);
}

#[tauri::command]
fn vdrive_info(app: State<App>, email: String) -> Value {
    let email = email.to_lowercase();
    let (on, letter, label) = vcfg(&email);
    let mounted = app.mounts.lock().unwrap().contains_key(&email);
    let mut letters = free_letters();
    if !letter.is_empty() && !letters.contains(&letter) { letters.push(letter.clone()); letters.sort(); }
    json!({ "installed": drivefs::winfsp_installed(), "mounted": mounted, "on": on, "letter": letter, "label": if label.is_empty() { default_label(&email) } else { label }, "letters": letters, "err": app.verr.lock().unwrap().get(&email).cloned().unwrap_or_default() })
}

#[tauri::command]
async fn set_vdrive(app: AppHandle, email: String, on: bool, letter: String, label: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let email = email.to_lowercase();
        let letter = letter.trim().trim_end_matches(':').to_uppercase();
        let label = label.trim().to_string();
        let st = app.state::<App>();
        // Önce varsa eski bağlantıyı kapat
        let old = st.mounts.lock().unwrap().remove(&email);
        if let Some(m) = old { m.wait_uploads(60); drop(m); }
        if !on { save_vcfg(&email, false, &letter, &label); return Ok(()); }
        if !(letter.len() == 1 && letter.chars().all(|c| c.is_ascii_uppercase())) { return Err("Bir sürücü harfi seç".to_string()); }
        if label.is_empty() || label.chars().any(|c| c.is_control() || "<>:\"/\\|?*".contains(c)) { return Err("Sürücü adı boş ya da geçersiz karakter içeriyor".into()); }
        if Path::new(&format!("{letter}:\\")).exists() { return Err(format!("{letter}: harfi başka bir sürücüde kullanılıyor")); }
        if !drivefs::winfsp_installed() { return Err("WinFsp yüklü değil — önce \"WinFsp'yi yükle\"ye bas".into()); }
        let client = auth::Client::load()?;
        set_net_label(&label);
        let m = drivefs::start(&email, &letter, &label, client)?;
        st.mounts.lock().unwrap().insert(email.clone(), m);
        save_vcfg(&email, true, &letter, &label);
        cleanup_legacy_view(&email);
        Ok(())
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn install_winfsp() -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(|| {
        let ok = run_hidden("winget", &["install", "--id", "WinFsp.WinFsp", "-e", "--silent", "--accept-package-agreements", "--accept-source-agreements"]);
        if drivefs::winfsp_installed() { Ok(()) } else if ok { Err("Yükleme tamamlandı ama WinFsp algılanamadı; uygulamayı yeniden başlat".into()) } else { Err("WinFsp yüklenemedi. winget yoksa https://winfsp.dev adresinden elle kur".into()) }
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn add_account(app: State<'_, App>) -> Result<String, String> {
    let client = auth::Client::load()?;
    let email = auth::login(&client).await?.to_lowercase();
    drivesync::flog!("hesap eklendi: {email}");
    let _ = (&app, client);
    Ok(email)
}





#[tauri::command]
fn rename_account(email: String, name: String) -> Result<(), String> {
    let mut n = load_names();
    n.insert(email.to_lowercase(), json!(name.trim()));
    std::fs::write(names_path(), Value::Object(n).to_string()).map_err(|e| e.to_string())
}

#[tauri::command]
fn logs(since: u64) -> Value { json!(drivesync::recent_logs(since)) }

#[tauri::command]
fn app_version(app: tauri::AppHandle) -> String { app.package_info().version.to_string() }

#[tauri::command]
async fn check_update(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_updater::UpdaterExt;
    let u = app.updater().map_err(|e| e.to_string())?.check().await.map_err(|e| e.to_string())?;
    Ok(u.map(|u| u.version))
}

#[tauri::command]
async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_updater::UpdaterExt;
    let u = app.updater().map_err(|e| e.to_string())?.check().await.map_err(|e| e.to_string())?
        .ok_or_else(|| "Güncelleme bulunamadı".to_string())?;
    u.download_and_install(|_, _| {}, || {}).await.map_err(|e| e.to_string())?;
    // Yeniden başlamadan önce bağlı sürücüleri düzgünce kapat (harf yeni sürece serbest kalsın)
    let h = app.clone();
    let _ = tauri::async_runtime::spawn_blocking(move || shutdown_mounts(&h)).await;
    app.restart();
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            let files = send_args(&argv);
            if !files.is_empty() { app.state::<App>().pending.lock().unwrap().extend(files); }
            show_window(app);
        }))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(App::default())
        .setup(|app| {
            // Sistem tepsisi
            let open = MenuItem::with_id(app, "open", "Framio Drive'ı aç", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Çık", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &quit])?;
            if let Some(c) = load_settings()["accent"].as_str().and_then(parse_hex) { *ACCENT.lock().unwrap() = c; }
            let img = |st: logo::St, ph: f32| tauri::image::Image::new_owned(logo::render(32, accent(), st, ph), 32, 32);
            TrayIconBuilder::with_id("main").icon(img(logo::St::Idle, 0.0)).tooltip("Framio Drive").menu(&menu).show_menu_on_left_click(false)
                .on_menu_event(|app, ev| match ev.id.as_ref() { "open" => show_window(app), "quit" => { let h = app.clone(); std::thread::spawn(move || { shutdown_mounts(&h); h.exit(0); }); }, _ => {} })
                .on_tray_icon_event(|tray, ev| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = ev { show_window(tray.app_handle()); }
                })
                .build(app)?;
            // Tepsi simgesi: duruma göre değişir, eşitlerken halka döner
            let th = app.handle().clone();
            std::thread::spawn(move || {
                use logo::St;
                let (mut st, mut frame, mut tick) = (St::Idle, 0u32, 0u32);
                let mut last: (u8, u32, (u8, u8, u8)) = (99, 999, (0, 0, 0));
                let mut tip = String::new();
                loop {
                    std::thread::sleep(std::time::Duration::from_millis(80));
                    tick += 1;
                    if tick % 6 == 1 {
                        let busy: usize = { let a = th.state::<App>(); let g = a.mounts.lock().unwrap(); g.values().map(|m| m.pending()).sum() };
                        let (fail, any, allp) = (0usize, false, false);
                        st = if any && allp { St::Pause } else if fail > 0 { St::Err } else if busy > 0 { St::Sync } else { St::Idle };
                        let t = match st { St::Pause => "Eşitleme duraklatıldı".to_string(), St::Err => format!("{fail} yükleme hatası"), St::Sync => format!("{busy} dosya yükleniyor"), St::Idle => "Framio Drive — güncel".to_string() };
                        if t != tip { if let Some(tr) = th.tray_by_id("main") { let _ = tr.set_tooltip(Some(t.clone())); } tip = t; }
                    }
                    let f = if st == St::Sync { frame } else { 0 };
                    let key = (st as u8, f, accent());
                    if key != last {
                        last = key;
                        if let Some(tr) = th.tray_by_id("main") { let _ = tr.set_icon(Some(img(st, f as f32 / 16.0 * std::f32::consts::TAU))); }
                    }
                    if st == St::Sync { frame = (frame + 1) % 16; }
                }
            });
            std::thread::spawn(ensure_context_menu);
            let args: Vec<String> = std::env::args().collect();
            let first = send_args(&args);
            if !first.is_empty() { app.state::<App>().pending.lock().unwrap().extend(first); }
            // Bilinen hesapları açılışta otomatik bağla (arka planda)
            let h = app.handle().clone();
            std::thread::spawn(move || {
                let st = h.state::<App>();
                // Eski eşitleme motorundan kalanları (kenar çubuğu girişi, harf, kısayol) bir kez temizle
                for e in auth::accounts() {
                    let e = e.to_lowercase();
                    let _ = drivesync::unregister(&e);
                    let mut cfg = load_settings();
                    if cfg["legacy_done"][&e].as_bool() != Some(true) {
                        cleanup_legacy_view(&e);
                        cfg["legacy_done"][&e] = json!(true);
                        save_settings(&cfg);
                    }
                }
                // Bağlı sürücü açık olan hesapları bağla
                if let Ok(client) = auth::Client::load() {
                    for e in auth::accounts() {
                        let e = e.to_lowercase();
                        let (on, letter, label) = vcfg(&e);
                        if !on || letter.is_empty() || st.mounts.lock().unwrap().contains_key(&e) { continue; }
                        let label = if label.is_empty() { default_label(&e) } else { label };
                        set_net_label(&label);
                        // Güncelleme/yeniden başlatma sırasında eski süreç harfi henüz bırakmamış olabilir: birkaç kez dene
                        let mut last = String::new();
                        for attempt in 0..8 {
                            match drivefs::start(&e, &letter, &label, client.clone()) {
                                Ok(m) => { st.mounts.lock().unwrap().insert(e.clone(), m); st.verr.lock().unwrap().remove(&e); last.clear(); break; }
                                Err(err) => { last = err; drivesync::flog!("bağlı sürücü başlatılamadı ({e}), deneme {}: {last}", attempt + 1); std::thread::sleep(std::time::Duration::from_secs(4)); }
                            }
                        }
                        if !last.is_empty() { st.verr.lock().unwrap().insert(e.clone(), last); }
                    }
                }
            });
            Ok(())
        })
        .on_window_event(|w, ev| {
            // Pencereyi kapatınca tepsiye küçül; programdan çıkmak için tepsi menüsündeki "Çık".
            if let WindowEvent::CloseRequested { api, .. } = ev { api.prevent_close(); let _ = w.hide(); }
        })
        .invoke_handler(tauri::generate_handler![client_status, save_client, accounts, add_account, rename_account, logs, take_pending, sign_out, set_accent, vdrive_info, set_vdrive, install_winfsp, app_version, check_update, install_update, fs_list, fs_usage, fs_mkdir, fs_rename, fs_trash, fs_upload, fs_reveal])
        .run(tauri::generate_context!())
        .expect("uygulama başlatılamadı");
}
