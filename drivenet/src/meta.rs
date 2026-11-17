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

/// Belirtecin sahibi hesabı sorgular. platform: instagram | facebook | threads
pub async fn me(p: &str, token: &str) -> Result<Value, String> {
    match p {
        "threads" => get("https://graph.threads.net/v1.0/me", &[("fields", "id,username,name"), ("access_token", token)]).await,
        "facebook" => get("https://graph.facebook.com/v21.0/me", &[("fields", "id,name,category"), ("access_token", token)]).await,
        _ => get("https://graph.instagram.com/v21.0/me", &[("fields", "user_id,username,account_type,media_count"), ("access_token", token)]).await,
    }
}
/// Uzun ömürlü belirteci uzatır (Instagram, Threads). {access_token, expires_in}
pub async fn refresh(p: &str, token: &str) -> Result<Value, String> {
    match p {
        "threads" => get("https://graph.threads.net/refresh_access_token", &[("grant_type", "th_refresh_token"), ("access_token", token)]).await,
        "instagram" => get("https://graph.instagram.com/refresh_access_token", &[("grant_type", "ig_refresh_token"), ("access_token", token)]).await,
        _ => Err("Facebook Sayfa belirteci uzatılmaz: uzun ömürlü kullanıcı belirtecinden alınan Sayfa belirtecinin son kullanma tarihi yoktur".into()),
    }
}
/// Kısa ömürlü belirteci uzun ömürlüye çevirir.
pub async fn exchange(p: &str, app_id: &str, secret: &str, short: &str) -> Result<Value, String> {
    match p {
        "threads" => get("https://graph.threads.net/access_token", &[("grant_type", "th_exchange_token"), ("client_secret", secret), ("access_token", short)]).await,
        "facebook" => get("https://graph.facebook.com/v21.0/oauth/access_token", &[("grant_type", "fb_exchange_token"), ("client_id", app_id), ("client_secret", secret), ("fb_exchange_token", short)]).await,
        _ => get("https://graph.instagram.com/access_token", &[("grant_type", "ig_exchange_token"), ("client_secret", secret), ("access_token", short)]).await,
    }
}
/// Sayfalı Graph yanıtlarını (paging.next) sonuna kadar toplar (en fazla 20 sayfa).
async fn get_all(url: &str, q: &[(&str, &str)]) -> Result<Vec<Value>, String> {
    let mut out = vec![];
    let mut v = get(url, q).await?;
    for _ in 0..20 {
        if let Some(a) = v["data"].as_array() { out.extend(a.iter().cloned()); }
        let Some(next) = v["paging"]["next"].as_str().map(|x| x.to_string()) else { break };
        let r = reqwest::Client::new().get(&next).send().await.map_err(|e| e.to_string())?;
        v = r.json().await.map_err(|e| e.to_string())?;
        if v.get("error").is_some() { break; }
    }
    Ok(out)
}
const PGF: &str = "id,name,access_token,tasks,instagram_business_account{id,username}";
/// Kullanıcı belirtecinin doğrudan yönettiği Sayfalar (her biri kendi Sayfa belirteciyle).
pub async fn fb_pages(token: &str) -> Result<Vec<Value>, String> {
    get_all("https://graph.facebook.com/v21.0/me/accounts", &[("fields", PGF), ("limit", "100"), ("access_token", token)]).await
}
/// Kullanıcının erişebildiği işletme portföyleri.
pub async fn fb_businesses(token: &str) -> Result<Vec<Value>, String> {
    get_all("https://graph.facebook.com/v21.0/me/businesses", &[("fields", "id,name"), ("limit", "100"), ("access_token", token)]).await
}
/// Bir işletme portföyünün sahip olduğu ve (ajans olarak) eriştiği Sayfalar.
pub async fn fb_biz_pages(token: &str, biz: &str) -> Vec<Value> {
    let mut all = vec![];
    for edge in ["owned_pages", "client_pages"] {
        if let Ok(v) = get_all(&format!("https://graph.facebook.com/v21.0/{biz}/{edge}"), &[("fields", PGF), ("limit", "100"), ("access_token", token)]).await { all.extend(v); }
    }
    all
}
/// Bir Sayfayı kendi belirteciyle sınar.
pub async fn fb_page_me(token: &str) -> Result<Value, String> {
    get("https://graph.facebook.com/v21.0/me", &[("fields", "id,name,instagram_business_account{id,username}"), ("access_token", token)]).await
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
