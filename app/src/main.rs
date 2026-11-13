#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod logo;
use drivenet::auth;
use drivesync::Engine;
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
struct App { engines: Mutex<HashMap<String, Engine>>, pending: Mutex<Vec<String>> }

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

/// Hesabın Windows bütünleşmesi: sürücü harfi + adı, "Ağdaki konumlar" kısayolu, kenar çubuğu simgesi/adı.
fn ensure_network_location(email: &str) {
    let Ok(root) = drivesync::root_path(email) else { return };
    let icon = ensure_drive_icon();
    let (letter, label, old_nl) = drive_cfg(email);
    let nl_name = if label.trim().is_empty() { format!("Framio Drive ({email})") } else { sanitize(&label) };
    let nl_base = Path::new(&std::env::var("APPDATA").unwrap_or_default()).join("Microsoft").join("Windows").join("Network Shortcuts");
    if !old_nl.is_empty() && old_nl != nl_name { run_hidden("cmd", &["/C", "rmdir", "/S", "/Q", &nl_base.join(&old_nl).display().to_string()]); }
    let nl = nl_base.join(&nl_name);
    let _ = std::fs::create_dir_all(&nl);
    let ini = nl.join("desktop.ini");
    run_hidden("attrib", &["-s", "-h", &ini.display().to_string()]);
    let text = format!("[.ShellClassInfo]\r\nCLSID2={{0AFACED1-E828-11D1-9187-B532F1E9575D}}\r\nFlags=2\r\nIconFile={}\r\nIconIndex=0\r\n", icon.display());
    let mut bytes: Vec<u8> = vec![0xFF, 0xFE];
    for u in text.encode_utf16() { bytes.extend_from_slice(&u.to_le_bytes()); }
    let _ = std::fs::write(&ini, bytes);
    save_drive_cfg(email, &letter, &label, &nl_name);

    // sürücü harfi
    if !letter.is_empty() {
        if !Path::new(&format!("{letter}:\\")).exists() {
            if !run_hidden("subst", &[&format!("{letter}:"), &root.display().to_string()]) { drivesync::flog!("sürücü harfi atanamadı: {letter}:"); }
        }
        let key = drive_key(&letter);
        if label.trim().is_empty() { run_hidden("reg", &["delete", &key, "/f"]); }
        else {
            run_hidden("reg", &["add", &format!("{key}\\DefaultLabel"), "/ve", "/d", label.trim(), "/f"]);
            run_hidden("reg", &["add", &format!("{key}\\DefaultIcon"), "/ve", "/d", &format!("{},0", icon.display()), "/f"]);
        }
    }
    let shown = if label.trim().is_empty() { format!("Framio Drive ({email})") } else { label.trim().to_string() };
    let script = format!(
        "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('{lnk}'); $s.TargetPath='{target}'; $s.IconLocation='{icon},0'; $s.Save(); \
         attrib +r '{nl}'; attrib +s +h '{ini}'; \
         Get-ChildItem 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\SyncRootManager' -ErrorAction SilentlyContinue | Where-Object {{ $_.PSChildName -like 'FramioDrive!*{email}' }} | ForEach-Object {{ Set-ItemProperty -Path $_.PSPath -Name IconResource -Value '{icon},0'; Set-ItemProperty -Path $_.PSPath -Name DisplayNameResource -Value '{shown}' }}; & ie4uinit.exe -show",
        lnk = q(&nl.join("target.lnk").display().to_string()), target = q(&if !letter.is_empty() && Path::new(&format!("{letter}:\\")).exists() { format!("{letter}:\\") } else { root.display().to_string() }), icon = q(&icon.display().to_string()),
        nl = q(&nl.display().to_string()), ini = q(&ini.display().to_string()), email = q(email), shown = q(&shown));
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

#[tauri::command]
async fn list_dirs(email: String, rel: String) -> Result<Value, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dir = drivesync::root_path(&email)?.join(safe_rel(&rel)?);
        let mut v: Vec<String> = vec![];
        for e in std::fs::read_dir(&dir).map_err(|e| e.to_string())?.flatten() {
            if e.metadata().map(|m| m.is_dir()).unwrap_or(false) { v.push(e.file_name().to_string_lossy().into_owned()); }
        }
        v.sort_by_key(|s| s.to_lowercase());
        Ok::<Value, String>(json!(v))
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn make_dir(email: String, rel: String, name: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let name = name.trim().to_string();
        if name.is_empty() || name.contains(['\\', '/', ':', '*', '?', '"', '<', '>', '|']) { return Err("geçersiz klasör adı".to_string()); }
        let dir = drivesync::root_path(&email)?.join(safe_rel(&rel)?).join(name);
        std::fs::create_dir(&dir).map_err(|e| e.to_string())
    }).await.map_err(|e| e.to_string())?
}

/// Seçilen dosyaları hesabın seçilen klasörüne kopyalar; yükleme kuyruğu gerisini halleder.
#[tauri::command]
async fn send_files(app: State<'_, App>, email: String, rel: String, paths: Vec<String>) -> Result<Value, String> {
    if !app.engines.lock().unwrap().contains_key(&email.to_lowercase()) { return Err("hesap bağlı değil".into()); }
    tauri::async_runtime::spawn_blocking(move || {
        let dir = drivesync::root_path(&email)?.join(safe_rel(&rel)?);
        if !dir.is_dir() { return Err("hedef klasör bulunamadı".to_string()); }
        let (mut sent, mut failed) = (0u32, vec![]);
        for p in paths {
            let src = PathBuf::from(&p);
            let Some(name) = src.file_name() else { continue };
            let dst = unique_dest(&dir, name);
            match copy_any(&src, &dst) {
                Ok(()) => { sent += 1; drivesync::flog!("gönderildi: {} -> {}", src.display(), dst.display()); }
                Err(e) => { drivesync::flog!("gönderilemedi {}: {e}", src.display()); failed.push(p); }
            }
        }
        Ok::<Value, String>(json!({ "sent": sent, "failed": failed }))
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
fn client_status() -> bool { auth::Client::load().is_ok() }

#[tauri::command]
fn save_client(id: String, secret: String) -> Result<(), String> { auth::Client::save(&id, &secret) }

#[tauri::command]
fn accounts(app: State<App>) -> Value {
    let names = load_names();
    let engines = app.engines.lock().unwrap();
    let list: Vec<Value> = auth::accounts().into_iter().map(|e| {
        let st = engines.get(&e).map(|g| g.status());
        json!({ "email": e, "name": names.get(&e).and_then(|v| v.as_str()).unwrap_or(""), "connected": st.is_some(), "status": st })
    }).collect();
    json!(list)
}

#[tauri::command]
fn connect(app: State<App>, email: String) -> Result<(), String> {
    let email = email.to_lowercase();
    if app.engines.lock().unwrap().contains_key(&email) { return Ok(()); }
    let client = auth::Client::load()?;
    let eng = Engine::start(&email, client)?;
    app.engines.lock().unwrap().insert(email.clone(), eng);
    std::thread::spawn(move || ensure_network_location(&email));
    Ok(())
}

#[tauri::command]
async fn disconnect(app: State<'_, App>, email: String) -> Result<(), String> {
    let email = email.to_lowercase();
    let eng = app.engines.lock().unwrap().remove(&email);
    tauri::async_runtime::spawn_blocking(move || { if let Some(e) = eng { e.shutdown(); } remove_drive_mapping(&email); }).await.map_err(|e| e.to_string())
}

/// Hesaptan çıkış: bağlantıyı kapatır, eşitleme kaydını, sürücü harfini ve kısayolu siler, yerel klasörü temizler, token'ı unutur.
/// Yüklenmemiş dosya varsa reddeder. Drive'daki dosyalara dokunulmaz.
#[tauri::command]
async fn sign_out(app: State<'_, App>, email: String) -> Result<(), String> {
    let email = email.to_lowercase();
    let eng = app.engines.lock().unwrap().remove(&email);
    if let Some(e) = &eng {
        let (p, u, f, _) = e.summary();
        if p + u + f > 0 {
            let n = p + u + f;
            app.engines.lock().unwrap().insert(email.clone(), eng.unwrap());
            return Err(format!("Yüklenmemiş {n} dosya var. Önce yüklemelerin bitmesini bekle ya da hatalı olanları çöz."));
        }
    }
    tauri::async_runtime::spawn_blocking(move || {
        if let Some(e) = eng { e.shutdown(); }
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

#[tauri::command]
async fn add_account(app: State<'_, App>) -> Result<String, String> {
    let client = auth::Client::load()?;
    let email = auth::login(&client).await?.to_lowercase();
    drivesync::flog!("hesap eklendi: {email}");
    let eng = Engine::start(&email, client)?;
    app.engines.lock().unwrap().insert(email.clone(), eng);
    let e2 = email.clone();
    std::thread::spawn(move || ensure_network_location(&e2));
    Ok(email)
}

#[tauri::command]
fn clear_cache(app: State<App>, email: String, days: Option<u64>) -> Result<Value, String> {
    let g = app.engines.lock().unwrap();
    Ok(g.get(&email.to_lowercase()).ok_or("hesap bağlı değil")?.clear(days))
}

#[tauri::command]
fn retry(app: State<App>, email: String) { if let Some(e) = app.engines.lock().unwrap().get(&email.to_lowercase()) { e.retry(); } }

#[tauri::command]
fn set_paused(app: State<App>, email: String, paused: bool) { if let Some(e) = app.engines.lock().unwrap().get(&email.to_lowercase()) { e.set_paused(paused); } }

#[tauri::command]
fn open_folder(email: String) -> Result<(), String> {
    let p = drivesync::root_path(&email)?;
    std::process::Command::new("explorer").arg(p).spawn().map(|_| ()).map_err(|e| e.to_string())
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
                .on_menu_event(|app, ev| match ev.id.as_ref() { "open" => show_window(app), "quit" => app.exit(0), _ => {} })
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
                        let (mut busy, mut fail, mut any, mut allp) = (0usize, 0usize, false, true);
                        { let a = th.state::<App>(); let g = a.engines.lock().unwrap();
                          for e in g.values() { let (p, u, f, pz) = e.summary(); any = true; if !pz { busy += p + u; fail += f; } allp &= pz; } }
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
                if let Ok(client) = auth::Client::load() {
                    for e in auth::accounts() {
                        let e = e.to_lowercase();
                        if st.engines.lock().unwrap().contains_key(&e) { continue; }
                        match Engine::start(&e, client.clone()) {
                            Ok(eng) => { st.engines.lock().unwrap().insert(e.clone(), eng); ensure_network_location(&e); }
                            Err(err) => drivesync::flog!("otomatik bağlanma başarısız ({e}): {err}"),
                        }
                    }
                }
            });
            Ok(())
        })
        .on_window_event(|w, ev| {
            // Pencereyi kapatınca tepsiye küçül; programdan çıkmak için tepsi menüsündeki "Çık".
            if let WindowEvent::CloseRequested { api, .. } = ev { api.prevent_close(); let _ = w.hide(); }
        })
        .invoke_handler(tauri::generate_handler![client_status, save_client, accounts, connect, disconnect, add_account, clear_cache, retry, set_paused, open_folder, rename_account, logs, take_pending, list_dirs, make_dir, send_files, sign_out, set_accent, drive_info, set_drive, check_update, install_update])
        .run(tauri::generate_context!())
        .expect("uygulama başlatılamadı");
}
