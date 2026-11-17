//! Çoklu yapay zekâ ve ses sağlayıcıları: OpenAI uyumlu uçlar (OpenRouter, NVIDIA, Groq, Ollama, VoiceStudio…) ve ElevenLabs.
//! API anahtarları Windows Kimlik Bilgisi Yöneticisi'nde saklanır; bir sağlayıcıya birden çok anahtar eklenebilir.
use serde_json::{json, Value};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Duration;

const SERVICE: &str = "framio-drive";
static ROT: AtomicUsize = AtomicUsize::new(0);

fn acct(id: &str) -> String { format!("provider-{id}") }

pub fn keys_get(id: &str) -> Vec<String> {
    keyring::Entry::new(SERVICE, &acct(id)).ok().and_then(|e| e.get_password().ok())
        .and_then(|t| serde_json::from_str::<Vec<String>>(&t).ok()).unwrap_or_default()
}
pub fn keys_set(id: &str, keys: &[String]) -> Result<(), String> {
    let clean: Vec<String> = keys.iter().map(|k| k.trim().to_string()).filter(|k| !k.is_empty()).collect();
    let e = keyring::Entry::new(SERVICE, &acct(id)).map_err(|e| e.to_string())?;
    if clean.is_empty() { let _ = e.delete_credential(); return Ok(()); }
    e.set_password(&serde_json::to_string(&clean).map_err(|e| e.to_string())?).map_err(|e| format!("anahtar kasası: {e}"))
}
pub fn keys_del(id: &str) { if let Ok(e) = keyring::Entry::new(SERVICE, &acct(id)) { let _ = e.delete_credential(); } }

fn client() -> reqwest::Client {
    reqwest::Client::builder().timeout(Duration::from_secs(90)).build().unwrap_or_default()
}
fn base(b: &str) -> String { b.trim().trim_end_matches('/').to_string() }

async fn err_text(r: reqwest::Response) -> String {
    let code = r.status();
    let t = r.text().await.unwrap_or_default();
    let t: String = t.chars().take(300).collect();
    format!("{code}: {t}")
}

/// İsteği sırayla anahtarlarla dener; 401/402/403/429 gelirse sıradaki anahtara geçer.
async fn send_keys<F>(keys: &[String], mut build: F) -> Result<reqwest::Response, String>
where F: FnMut(Option<&str>) -> reqwest::RequestBuilder {
    if keys.is_empty() { return build(None).send().await.map_err(|e| format!("bağlantı kurulamadı: {e}")); }
    let start = ROT.load(Ordering::Relaxed) % keys.len();
    let mut last: Option<reqwest::Response> = None;
    for i in 0..keys.len() {
        let idx = (start + i) % keys.len();
        let r = build(Some(&keys[idx])).send().await.map_err(|e| format!("bağlantı kurulamadı: {e}"))?;
        let s = r.status().as_u16();
        if matches!(s, 401 | 402 | 403 | 429) && i + 1 < keys.len() { ROT.store(idx + 1, Ordering::Relaxed); last = Some(r); continue; }
        ROT.store(idx, Ordering::Relaxed);
        return Ok(r);
    }
    last.ok_or_else(|| "anahtar denenemedi".to_string())
}

fn bearer(rb: reqwest::RequestBuilder, k: Option<&str>) -> reqwest::RequestBuilder {
    let rb = rb.header("X-Title", "Framio Drive");
    match k { Some(k) if !k.is_empty() => rb.bearer_auth(k), _ => rb }
}

/// OpenAI uyumlu sohbet (araç çağırma dâhil). Gövde arayüzden hazır gelir; yanıt olduğu gibi döner.
pub async fn chat(base_url: &str, keys: &[String], body: &Value) -> Result<Value, String> {
    let url = format!("{}/chat/completions", base(base_url));
    let r = send_keys(keys, |k| bearer(client().post(&url), k).json(body)).await?;
    if !r.status().is_success() { return Err(err_text(r).await); }
    r.json::<Value>().await.map_err(|e| format!("yanıt okunamadı: {e}"))
}

/// Sağlayıcının model kimlikleri (GET /models).
pub async fn list_models(base_url: &str, keys: &[String]) -> Result<Vec<String>, String> {
    let url = format!("{}/models", base(base_url));
    let r = send_keys(keys, |k| bearer(client().get(&url), k)).await?;
    if !r.status().is_success() { return Err(err_text(r).await); }
    let v: Value = r.json().await.map_err(|e| e.to_string())?;
    let arr = v["data"].as_array().or_else(|| v["models"].as_array()).cloned().unwrap_or_default();
    let mut out: Vec<String> = arr.iter().filter_map(|m| m["id"].as_str().or_else(|| m["name"].as_str()).map(|s| s.to_string())).collect();
    out.sort();
    Ok(out)
}

/// OpenAI uyumlu konuşma sentezi (VoiceStudio, OpenAI…): ses baytları döner.
pub async fn speech_openai(base_url: &str, keys: &[String], model: &str, voice: &str, text: &str) -> Result<Vec<u8>, String> {
    let url = format!("{}/audio/speech", base(base_url));
    let body = json!({ "model": model, "voice": voice, "input": text, "response_format": "mp3" });
    let r = send_keys(keys, |k| bearer(client().post(&url), k).json(&body)).await?;
    if !r.status().is_success() { return Err(err_text(r).await); }
    r.bytes().await.map(|b| b.to_vec()).map_err(|e| e.to_string())
}

/// OpenAI uyumlu ses tanıma (whisper uyumlu uçlar).
pub async fn transcribe_openai(base_url: &str, keys: &[String], model: &str, audio: Vec<u8>, mime: &str, lang: &str) -> Result<String, String> {
    let url = format!("{}/audio/transcriptions", base(base_url));
    let model = model.to_string(); let mime = mime.to_string(); let lang = lang.to_string();
    let r = send_keys(keys, |k| {
        let part = reqwest::multipart::Part::bytes(audio.clone()).file_name("ses.wav").mime_str(&mime).unwrap_or_else(|_| reqwest::multipart::Part::bytes(audio.clone()));
        let mut form = reqwest::multipart::Form::new().part("file", part);
        if !model.is_empty() { form = form.text("model", model.clone()); }
        if !lang.is_empty() { form = form.text("language", lang.clone()); }
        bearer(client().post(&url), k).multipart(form)
    }).await?;
    if !r.status().is_success() { return Err(err_text(r).await); }
    let v: Value = r.json().await.map_err(|e| e.to_string())?;
    Ok(v["text"].as_str().unwrap_or("").trim().to_string())
}

const EL: &str = "https://api.elevenlabs.io";

fn xi(rb: reqwest::RequestBuilder, k: Option<&str>) -> reqwest::RequestBuilder {
    match k { Some(k) if !k.is_empty() => rb.header("xi-api-key", k), _ => rb }
}

/// ElevenLabs sesleri: (kimlik, ad).
pub async fn eleven_voices(keys: &[String]) -> Result<Vec<(String, String)>, String> {
    let url = format!("{EL}/v1/voices");
    let r = send_keys(keys, |k| xi(client().get(&url), k)).await?;
    if !r.status().is_success() { return Err(err_text(r).await); }
    let v: Value = r.json().await.map_err(|e| e.to_string())?;
    Ok(v["voices"].as_array().cloned().unwrap_or_default().iter()
        .filter_map(|x| Some((x["voice_id"].as_str()?.to_string(), x["name"].as_str().unwrap_or("").to_string()))).collect())
}

/// ElevenLabs konuşma sentezi (mp3).
pub async fn eleven_tts(keys: &[String], voice: &str, model: &str, text: &str) -> Result<Vec<u8>, String> {
    let url = format!("{EL}/v1/text-to-speech/{voice}?output_format=mp3_44100_64");
    let body = json!({ "text": text, "model_id": if model.is_empty() { "eleven_flash_v2_5" } else { model } });
    let r = send_keys(keys, |k| xi(client().post(&url), k).json(&body)).await?;
    if !r.status().is_success() { return Err(err_text(r).await); }
    r.bytes().await.map(|b| b.to_vec()).map_err(|e| e.to_string())
}

/// ElevenLabs ses tanıma.
pub async fn eleven_stt(keys: &[String], audio: Vec<u8>, mime: &str, lang: &str) -> Result<String, String> {
    let url = format!("{EL}/v1/speech-to-text");
    let mime = mime.to_string(); let lang = lang.to_string();
    let r = send_keys(keys, |k| {
        let part = reqwest::multipart::Part::bytes(audio.clone()).file_name("ses.wav").mime_str(&mime).unwrap_or_else(|_| reqwest::multipart::Part::bytes(audio.clone()));
        let mut form = reqwest::multipart::Form::new().part("file", part).text("model_id", "scribe_v1");
        if !lang.is_empty() { form = form.text("language_code", lang.clone()); }
        xi(client().post(&url), k).multipart(form)
    }).await?;
    if !r.status().is_success() { return Err(err_text(r).await); }
    let v: Value = r.json().await.map_err(|e| e.to_string())?;
    Ok(v["text"].as_str().unwrap_or("").trim().to_string())
}
