//! Gemini API istemcisi (görselden yapılandırılmış bilgi okuma). Anahtar Windows Kimlik Bilgisi Yöneticisi'nde saklanır.
use serde_json::{json, Value};
use std::time::Duration;

const SERVICE: &str = "framio-drive";
const ACCOUNT: &str = "gemini-api-key";

pub fn save_key(k: &str) -> Result<(), String> {
    keyring::Entry::new(SERVICE, ACCOUNT).map_err(|e| e.to_string())?.set_password(k).map_err(|e| e.to_string())
}
pub fn load_key() -> Option<String> {
    keyring::Entry::new(SERVICE, ACCOUNT).ok()?.get_password().ok().filter(|k| !k.trim().is_empty())
}
pub fn clear_key() {
    if let Ok(e) = keyring::Entry::new(SERVICE, ACCOUNT) { let _ = e.delete_credential(); }
}

/// Görseli verilen istemle inceler; `fields` (anahtar, açıklama) için metin alanları + güven + not içeren JSON döndürür.
/// 429/503 yanıtlarında bekleyip yeniden dener.
pub async fn analyze(key: &str, model: &str, prompt: &str, fields: &[(String, String)], mime: &str, b64: &str) -> Result<Value, String> {
    let mut props = serde_json::Map::new();
    for (k, d) in fields { props.insert(k.clone(), json!({ "type": "STRING", "description": d })); }
    props.insert("guven".into(), json!({ "type": "NUMBER", "description": "Genel güven, 0 ile 1 arası" }));
    props.insert("not".into(), json!({ "type": "STRING", "description": "Belirsizlikler için kısa not" }));
    let body = json!({
        "contents": [{ "parts": [ { "text": prompt }, { "inline_data": { "mime_type": mime, "data": b64 } } ] }],
        "generationConfig": { "responseMimeType": "application/json", "responseSchema": { "type": "OBJECT", "properties": props }, "temperature": 0.1 }
    });
    let url = format!("https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent");
    let client = reqwest::Client::new();
    for attempt in 0..5u64 {
        let r = client.post(&url).header("x-goog-api-key", key).json(&body).send().await.map_err(|e| e.to_string())?;
        let st = r.status().as_u16();
        if st == 429 || st == 503 { tokio::time::sleep(Duration::from_secs(20 * (attempt + 1))).await; continue; }
        let v: Value = r.json().await.map_err(|e| e.to_string())?;
        if !(200..300).contains(&st) { return Err(format!("Gemini hatası {st}: {}", v["error"]["message"].as_str().unwrap_or(""))); }
        let t = v["candidates"][0]["content"]["parts"][0]["text"].as_str().ok_or("Gemini boş yanıt verdi (içerik engellenmiş olabilir)")?;
        return serde_json::from_str(t).map_err(|e| format!("yanıt çözülemedi: {e}"));
    }
    Err("Gemini kotası doldu (429); birkaç dakika sonra tekrar dene".into())
}
