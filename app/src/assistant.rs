//! Sesli asistan: Gemini çağrısı (anahtar Rust tarafında kalır) ve genel kısayol.
use super::*;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

/// Arayüzün hazırladığı generateContent gövdesini (ses, araçlar, geçmiş) Gemini'ye iletir.
#[tauri::command]
pub async fn assistant_gen(body: Value) -> Result<Value, String> {
    let key = drivenet::gemini::load_key().ok_or_else(|| "Gemini anahtarı yok: Ayarlar > Yapay zekâ bölümünden ekle".to_string())?;
    let model = load_settings()["ai"]["model"].as_str().unwrap_or("gemini-2.5-flash").to_string();
    drivenet::gemini::generate(&key, &model, &body).await
}

/// Ctrl+Alt+Boşluk genel kısayolunu açar/kapatır; basılınca pencereyi öne getirip arayüze haber verir.
#[tauri::command]
pub fn assistant_hotkey(app: AppHandle, on: bool) -> Result<(), String> {
    use tauri::Emitter;
    let sc = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::Space);
    let gs = app.global_shortcut();
    if on {
        if gs.is_registered(sc) { return Ok(()); }
        gs.on_shortcut(sc, |app, _s, ev| {
            if ev.state() == ShortcutState::Pressed {
                show_window(app);
                let _ = app.emit("assistant-toggle", ());
            }
        }).map_err(|e| format!("Kısayol kaydedilemedi (başka uygulama kullanıyor olabilir): {e}"))
    } else {
        let _ = gs.unregister(sc);
        Ok(())
    }
}
