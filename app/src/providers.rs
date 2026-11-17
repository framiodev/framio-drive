//! Çoklu sağlayıcı ayarları ve çağrıları (arayüz buradan konuşur; anahtarlar kasada kalır, arayüze dönmez).
use crate::{load_settings, save_settings};
use base64::Engine as _;
use drivenet::providers as pv;
use serde_json::{json, Value};

fn providers() -> Vec<Value> { load_settings()["providers"].as_array().cloned().unwrap_or_default() }
fn find(id: &str) -> Result<Value, String> {
    providers().into_iter().find(|p| p["id"].as_str() == Some(id)).ok_or_else(|| "sağlayıcı bulunamadı".to_string())
}
fn s(v: &Value, k: &str) -> String { v[k].as_str().unwrap_or("").to_string() }

#[tauri::command]
pub fn prov_list() -> Value {
    let st = load_settings();
    let list: Vec<Value> = providers().into_iter().map(|mut p| {
        let id = s(&p, "id");
        let n = pv::keys_get(&id).len();
        p["has_key"] = json!(n > 0);
        p["key_count"] = json!(n);
        p
    }).collect();
    json!({ "providers": list, "roles": st["roles"].clone() })
}

/// Sağlayıcı ekler/günceller. `keys` verilirse kasadaki anahtarların yerine geçer (boş liste = sil); verilmezse korunur.
#[tauri::command]
pub fn prov_save(p: Value, keys: Option<Vec<String>>) -> Result<String, String> {
    let mut p = p;
    let mut id = s(&p, "id");
    if id.is_empty() {
        let t = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_millis()).unwrap_or(0);
        id = format!("p{t:x}");
        p["id"] = json!(id);
    }
    let kind = s(&p, "kind");
    if kind != "openai" && kind != "elevenlabs" { return Err("bilinmeyen sağlayıcı türü".into()); }
    if kind == "openai" && s(&p, "base_url").trim().is_empty() { return Err("Adres (base URL) boş olamaz".into()); }
    if s(&p, "name").trim().is_empty() { return Err("Ad boş olamaz".into()); }
    if let Some(k) = keys { pv::keys_set(&id, &k)?; }
    let mut st = load_settings();
    let mut arr = providers();
    match arr.iter().position(|x| x["id"].as_str() == Some(id.as_str())) { Some(i) => arr[i] = p, None => arr.push(p) }
    st["providers"] = json!(arr);
    save_settings(&st);
    Ok(id)
}

#[tauri::command]
pub fn prov_delete(id: String) -> Result<(), String> {
    pv::keys_del(&id);
    let mut st = load_settings();
    let arr: Vec<Value> = providers().into_iter().filter(|x| x["id"].as_str() != Some(id.as_str())).collect();
    st["providers"] = json!(arr);
    // Bu sağlayıcıyı kullanan roller temizlenir.
    if let Some(r) = st["roles"].as_object_mut() {
        for (_, v) in r.iter_mut() { if v["provider"].as_str() == Some(id.as_str()) { *v = json!({}); } }
    }
    save_settings(&st);
    Ok(())
}

#[tauri::command]
pub fn prov_roles_set(roles: Value) -> Result<(), String> {
    let mut st = load_settings();
    st["roles"] = roles;
    save_settings(&st);
    Ok(())
}

#[tauri::command]
pub async fn prov_models(id: String) -> Result<Vec<String>, String> {
    let p = find(&id)?;
    pv::list_models(&s(&p, "base_url"), &pv::keys_get(&id)).await
}

#[tauri::command]
pub async fn prov_voices(id: String) -> Result<Vec<Value>, String> {
    let p = find(&id)?;
    if s(&p, "kind") != "elevenlabs" { return Err("Bu sağlayıcıda ses listesi yok".into()); }
    let v = pv::eleven_voices(&pv::keys_get(&id)).await?;
    Ok(v.into_iter().map(|(i, n)| json!({ "id": i, "name": n })).collect())
}

/// OpenAI biçiminde sohbet gövdesini gönderir (model alanı arayüzden gelir).
#[tauri::command]
pub async fn prov_chat(id: String, body: Value) -> Result<Value, String> {
    let p = find(&id)?;
    if s(&p, "kind") != "openai" { return Err("Bu sağlayıcı sohbet için değil".into()); }
    pv::chat(&s(&p, "base_url"), &pv::keys_get(&id), &body).await
}

/// Metni sese çevirir: { mime, data (base64) }.
#[tauri::command]
pub async fn prov_speech(id: String, text: String, voice: String, model: String) -> Result<Value, String> {
    let p = find(&id)?;
    let keys = pv::keys_get(&id);
    let bytes = if s(&p, "kind") == "elevenlabs" {
        pv::eleven_tts(&keys, &voice, &model, &text).await?
    } else {
        pv::speech_openai(&s(&p, "base_url"), &keys, &model, &voice, &text).await?
    };
    Ok(json!({ "mime": "audio/mpeg", "data": base64::engine::general_purpose::STANDARD.encode(bytes) }))
}

/// Sesi yazıya çevirir (base64 ses).
#[tauri::command]
pub async fn prov_transcribe(id: String, audio: String, mime: String, model: String) -> Result<String, String> {
    let p = find(&id)?;
    let keys = pv::keys_get(&id);
    let bytes = base64::engine::general_purpose::STANDARD.decode(audio.as_bytes()).map_err(|e| e.to_string())?;
    if s(&p, "kind") == "elevenlabs" { pv::eleven_stt(&keys, bytes, &mime, "tr").await }
    else { pv::transcribe_openai(&s(&p, "base_url"), &keys, &model, bytes, &mime, "tr").await }
}

/// Bağlantı sınaması: { ok, ms, text? , err? }.
#[tauri::command]
pub async fn prov_test(id: String, model: String) -> Value {
    let t0 = std::time::Instant::now();
    let r: Result<String, String> = async {
        let p = find(&id)?;
        let keys = pv::keys_get(&id);
        if s(&p, "kind") == "elevenlabs" {
            let v = pv::eleven_voices(&keys).await?;
            Ok(format!("{} ses bulundu", v.len()))
        } else if model.trim().is_empty() {
            let m = pv::list_models(&s(&p, "base_url"), &keys).await?;
            Ok(format!("{} model listelendi", m.len()))
        } else {
            let body = json!({ "model": model, "messages": [{ "role": "user", "content": "Tek kelimeyle merhaba de." }], "max_tokens": 24 });
            let v = pv::chat(&s(&p, "base_url"), &keys, &body).await?;
            Ok(v["choices"][0]["message"]["content"].as_str().unwrap_or("(yanıt boş)").trim().chars().take(80).collect())
        }
    }.await;
    let ms = t0.elapsed().as_millis() as u64;
    match r { Ok(t) => json!({ "ok": true, "ms": ms, "text": t }), Err(e) => json!({ "ok": false, "ms": ms, "err": e }) }
}
