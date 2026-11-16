//! Meta / Instagram (Instagram API with Instagram Login) bağlantı yardımcıları.
//! Gizli değerler (uygulama gizli anahtarı, erişim belirteci) Windows Kimlik Bilgisi Yöneticisi'nde saklanır.
use serde_json::{json, Value};

const SERVICE: &str = "framio-drive";

fn entry(name: &str) -> Result<keyring::Entry, String> { keyring::Entry::new(SERVICE, name).map_err(|e| e.to_string()) }
pub fn save(name: &str, v: &str) -> Result<(), String> { entry(name)?.set_password(v).map_err(|e| e.to_string()) }
pub fn load(name: &str) -> Option<String> { entry(name).ok()?.get_password().ok().filter(|k| !k.trim().is_empty()) }
pub fn clear(name: &str) { if let Ok(e) = entry(name) { let _ = e.delete_credential(); } }

async fn get(url: &str, q: &[(&str, &str)]) -> Result<Value, String> {
    let r = reqwest::Client::new().get(url).query(q).send().await.map_err(|e| format!("Bağlantı kurulamadı: {e}"))?;
    let st = r.status().as_u16();
    let v: Value = r.json().await.map_err(|e| format!("Yanıt çözülemedi: {e}"))?;
    if !(200..300).contains(&st) || v.get("error").is_some() {
        let m = v["error"]["message"].as_str().unwrap_or("bilinmeyen hata");
        return Err(format!("Meta hatası ({st}): {m}"));
    }
    Ok(v)
}

/// Belirtecin sahibi hesabı sorgular.
pub async fn me(token: &str) -> Result<Value, String> {
    get("https://graph.instagram.com/v21.0/me", &[("fields", "user_id,username,account_type,media_count"), ("access_token", token)]).await
}
/// Uzun ömürlü belirteci 60 gün daha uzatır. {access_token, expires_in}
pub async fn refresh(token: &str) -> Result<Value, String> {
    get("https://graph.instagram.com/refresh_access_token", &[("grant_type", "ig_refresh_token"), ("access_token", token)]).await
}
/// Kısa ömürlü belirteci uzun ömürlüye (60 gün) çevirir.
pub async fn exchange(secret: &str, short: &str) -> Result<Value, String> {
    get("https://graph.instagram.com/access_token", &[("grant_type", "ig_exchange_token"), ("client_secret", secret), ("access_token", short)]).await
}

/// Gemini ile sohbet (rehber yardımcısı).
pub async fn chat(key: &str, model: &str, system: &str, question: &str) -> Result<String, String> {
    let body = json!({
        "systemInstruction": { "parts": [ { "text": system } ] },
        "contents": [ { "role": "user", "parts": [ { "text": question } ] } ],
        "generationConfig": { "temperature": 0.3 }
    });
    let url = format!("https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent");
    let r = reqwest::Client::new().post(&url).header("x-goog-api-key", key).json(&body).send().await.map_err(|e| e.to_string())?;
    let st = r.status().as_u16();
    let v: Value = r.json().await.map_err(|e| e.to_string())?;
    if !(200..300).contains(&st) { return Err(format!("Gemini hatası {st}: {}", v["error"]["message"].as_str().unwrap_or(""))); }
    v["candidates"][0]["content"]["parts"][0]["text"].as_str().map(|s| s.to_string()).ok_or_else(|| "Gemini boş yanıt verdi".to_string())
}
