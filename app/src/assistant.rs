//! Sesli asistan: Gemini çağrısı (anahtar Rust tarafında kalır) ve genel kısayol.
use super::*;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

/// Arayüzün hazırladığı generateContent gövdesini (ses, araçlar, geçmiş) Gemini'ye iletir.
#[tauri::command]
pub async fn assistant_gen(body: Value) -> Result<Value, String> {
    let key = drivenet::gemini::load_key().ok_or_else(|| "Gemini anahtarı yok: Ayarlar > Yapay zekâ bölümünden ekle".to_string())?;
    let model = crate::org::ai_model().await;
    drivenet::gemini::generate(&key, &model, &body).await
}

/// Bağlantı tanısı (Ayarlar > Sesli asistan > Bağlantıyı test et).
#[tauri::command]
pub async fn assistant_diag() -> Result<Value, String> {
    let key = drivenet::gemini::load_key().ok_or_else(|| "Gemini anahtarı yok".to_string())?;
    let model = crate::org::ai_model().await;
    Ok(drivenet::gemini::diag(&key, &model).await)
}

/// Canlı konuşma için WebSocket adresi ve model. Anahtar yalnızca oturum süresince arayüz belleğinde tutulur.
#[tauri::command]
pub async fn assistant_live_cfg() -> Result<Value, String> {
    let key = drivenet::gemini::load_key().ok_or_else(|| "Gemini anahtarı yok: Ayarlar > Yapay zekâ bölümünden ekle".to_string())?;
    let saved = load_settings()["ai"]["live_model"].as_str().unwrap_or("").trim().to_string();
    let model = if saved.is_empty() { drivenet::gemini::pick_live_model(&key).await? } else { saved };
    Ok(json!({ "model": model, "url": format!("wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key={key}") }))
}

/// Ctrl+Alt+Boşluk genel kısayolunu açar/kapatır; basılınca pencereyi öne getirip arayüze haber verir.
/// Çağrılar sıraya konur; kayıt her seferinde önce temizlenip yeniden yapılır (çift kayıt hatası olmaz).
static HK_LOCK: std::sync::Mutex<()> = std::sync::Mutex::new(());

#[tauri::command]
pub fn assistant_hotkey(app: AppHandle, on: bool) -> Result<(), String> {
    use tauri::Emitter;
    let _g = HK_LOCK.lock().unwrap_or_else(|e| e.into_inner());
    let sc = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::Space);
    let gs = app.global_shortcut();
    let _ = gs.unregister(sc);
    if !on { return Ok(()); }
    let reg = |gs: &tauri_plugin_global_shortcut::GlobalShortcut<tauri::Wry>| gs.on_shortcut(sc, |app, _s, ev| {
        if ev.state() == ShortcutState::Pressed {
            show_window(app);
            let _ = app.emit("assistant-toggle", ());
        }
    });
    if reg(&gs).is_ok() { return Ok(()); }
    let _ = gs.unregister(sc);
    std::thread::sleep(std::time::Duration::from_millis(150));
    reg(&gs).map_err(|e| format!("Kısayol kaydedilemedi (başka uygulama veya açık kalmış başka bir Framio Drive penceresi kullanıyor olabilir): {e}"))
}
