//! Flarum forum istemcisi: kullanıcı kendi hesabıyla giriş yapar (/api/token), jeton Windows Kimlik Bilgisi Yöneticisi'nde saklanır.
//! Parola hiçbir yerde saklanmaz.
use serde_json::{json, Value};
use std::time::Duration;

const SERVICE: &str = "framio-drive";
/// Forum yöneticisi güvenlik duvarında bu adı izinli yapabilsin diye sabit ve tanımlayıcı
pub const UA: &str = "FramioDrive-Client/1.0 (+https://github.com/framiodev/framio-drive)";

fn acct(id: &str) -> String { format!("forum:{id}") }
pub fn save_session(id: &str, v: &Value) -> Result<(), String> {
    keyring::Entry::new(SERVICE, &acct(id)).map_err(|e| e.to_string())?.set_password(&v.to_string()).map_err(|e| e.to_string())
}
pub fn load_session(id: &str) -> Option<Value> {
    let t = keyring::Entry::new(SERVICE, &acct(id)).ok()?.get_password().ok()?;
    serde_json::from_str(&t).ok().filter(|v: &Value| v["token"].as_str().map(|t| !t.is_empty()).unwrap_or(false))
}
pub fn clear_session(id: &str) {
    if let Ok(e) = keyring::Entry::new(SERVICE, &acct(id)) { let _ = e.delete_credential(); }
}

/// Yalnızca https adresleri kabul edilir; sondaki / atılır.
pub fn clean_base(b: &str) -> Result<String, String> {
    let b = b.trim().trim_end_matches('/');
    if !b.starts_with("https://") || b.len() < 12 || b.contains(' ') { return Err("Forum adresi https:// ile başlamalı".into()); }
    Ok(b.to_string())
}

fn client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder().timeout(Duration::from_secs(40)).user_agent(UA).default_headers({ let mut h = reqwest::header::HeaderMap::new(); h.insert(reqwest::header::ACCEPT, reqwest::header::HeaderValue::from_static("application/json")); h }).build().map_err(|e| e.to_string())
}

async fn json_of(r: reqwest::Response) -> Result<(u16, Value), String> {
    let st = r.status().as_u16();
    let t = r.text().await.map_err(|e| e.to_string())?;
    match serde_json::from_str::<Value>(&t) {
        Ok(v) => Ok((st, v)),
        Err(_) => Err(if st == 403 || st == 429 || st == 503 || t.contains("Cloudflare") || t.to_lowercase().contains("just a moment") || t.contains("cf-chl") {
            format!("Forumun güvenlik duvarı isteği engelledi (HTTP {st}). Forum sahibi olarak güvenlik kuralında User-Agent'ı “FramioDrive” içeren /api isteklerine izin ver.")
        } else { format!("Forum JSON yerine başka bir yanıt verdi (HTTP {st}).") }),
    }
}

fn api_err(st: u16, v: &Value) -> String {
    let d = v["errors"][0]["detail"].as_str().or(v["errors"][0]["code"].as_str()).unwrap_or("");
    match st {
        401 | 403 if d.is_empty() => "Kullanıcı adı veya parola hatalı ya da yetkin yok".into(),
        _ => format!("Forum hatası {st}: {d}"),
    }
}

/// Kullanıcı adı/e-posta + parola ile giriş; ~30 gün geçerli kişisel jeton döner.
pub async fn login(base: &str, ident: &str, pass: &str) -> Result<Value, String> {
    let c = client()?;
    let r = c.post(format!("{base}/api/token")).json(&json!({ "identification": ident, "password": pass, "lifetime": 2592000 }))
        .send().await.map_err(|e| format!("Foruma bağlanılamadı: {e}"))?;
    let (st, v) = json_of(r).await?;
    if st != 200 { return Err(api_err(st, &v)); }
    let token = v["token"].as_str().ok_or("Forum jeton vermedi (2 adımlı doğrulama veya özel giriş olabilir)")?.to_string();
    let uid = v["userId"].as_i64().or(v["userId"].as_str().and_then(|s| s.parse().ok())).unwrap_or(0);
    let mut username = ident.to_string();
    if let Ok(r) = c.get(format!("{base}/api/users/{uid}")).header("Authorization", format!("Token {token}")).send().await {
        if let Ok((200, u)) = json_of(r).await { if let Some(n) = u["data"]["attributes"]["username"].as_str() { username = n.to_string(); } }
    }
    Ok(json!({ "token": token, "userId": uid, "username": username }))
}

async fn get(c: &reqwest::Client, base: &str, token: &str, path: &str) -> Result<(u16, Value), String> {
    let r = c.get(format!("{base}{path}")).header("Authorization", format!("Token {token}")).send().await.map_err(|e| e.to_string())?;
    json_of(r).await
}

/// Oturum durumu: Some(true) geçerli, Some(false) jeton reddedildi (401), None belirsiz (güvenlik duvarı/ağ) — belirsizse oturum silinmemeli.
pub async fn check(base: &str, token: &str) -> Option<bool> {
    let c = client().ok()?;
    let r = c.get(format!("{base}/api")).header("Authorization", format!("Token {token}")).send().await.ok()?;
    let st = r.status().as_u16();
    let t = r.text().await.ok()?;
    let v: Value = serde_json::from_str(&t).ok()?;
    if st == 401 { return Some(false); }
    if st == 200 && v["data"].is_object() { return Some(true); }
    None
}

/// Paylaşım formu için forum bilgisi: etiketler, görsel etiketi adı, künye şemaları, filigranlar.
pub async fn meta(base: &str, token: &str) -> Result<Value, String> {
    let c = client()?;
    let (st, root) = get(&c, base, token, "/api").await?;
    if st != 200 { return Err(api_err(st, &root)); }
    let a = &root["data"]["attributes"];
    let (_, tags) = get(&c, base, token, "/api/tags?page%5Blimit%5D=200").await.unwrap_or((0, json!({})));
    let tag_list: Vec<Value> = tags["data"].as_array().cloned().unwrap_or_default().iter().map(|t| {
        let at = &t["attributes"];
        json!({ "id": t["id"], "name": at["name"], "slug": at["slug"], "parent": t["relationships"]["parent"]["data"]["id"], "position": at["position"],
                "canStart": at["canStartDiscussion"].as_bool().unwrap_or(true), "isChild": at["isChild"] })
    }).collect();
    let schemas = get(&c, base, token, "/api/framio-media/category-schemas").await.map(|x| x.1).unwrap_or(json!(null));
    let marks = get(&c, base, token, "/api/framio-media/watermarks").await.map(|x| x.1).unwrap_or(json!(null));
    Ok(json!({
        "title": a["title"], "canStartDiscussion": a["canStartDiscussion"], "bbcodeTag": a["framio-upload-exif.active_bbcode_tag"], "kunyeTheme": a["framio-upload-exif.kunye_theme"],
        "tags": tag_list, "schemas": schemas, "watermarks": marks,
    }))
}

/// Forumun kendi yapay zekâ çözümlemesi (forumdaki anahtar/ayarlar/yazım kuralları sunucuda kullanılır; anahtar istemciye gelmez).
pub async fn analyze(base: &str, token: &str, bytes: Vec<u8>, filename: &str) -> Result<Value, String> {
    let part = reqwest::multipart::Part::bytes(bytes).file_name(filename.to_string()).mime_str("image/jpeg").map_err(|e| e.to_string())?;
    let form = reqwest::multipart::Form::new().part("image", part);
    let c = reqwest::Client::builder().timeout(Duration::from_secs(120)).user_agent(UA).default_headers({ let mut h = reqwest::header::HeaderMap::new(); h.insert(reqwest::header::ACCEPT, reqwest::header::HeaderValue::from_static("application/json")); h }).build().map_err(|e| e.to_string())?;
    let r = c.post(format!("{base}/api/framio-media/analyze-ai")).header("Authorization", format!("Token {token}")).multipart(form).send().await.map_err(|e| format!("Foruma bağlanılamadı: {e}"))?;
    let (st, v) = json_of(r).await?;
    if st == 401 || st == 403 { return Err("Forum oturumu geçersiz; Ayarlar'dan yeniden giriş yap".into()); }
    if st == 429 { return Err("Forum hız sınırı (429); biraz sonra tekrar dene".into()); }
    if v["success"].as_bool() != Some(true) {
        let why = v["error"].as_str().map(|s| s.to_string()).or_else(|| v["reason"].as_str().map(|r| match r { "disabled" => "Forumda yapay zekâ kapalı".to_string(), "not_configured" => "Forumda yapay zekâ anahtarı tanımlı değil".to_string(), o => o.to_string() })).unwrap_or(format!("HTTP {st}"));
        return Err(why);
    }
    Ok(v["data"].clone())
}

fn long_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder().connect_timeout(Duration::from_secs(20)).timeout(Duration::from_secs(300)).user_agent(UA).default_headers({ let mut h = reqwest::header::HeaderMap::new(); h.insert(reqwest::header::ACCEPT, reqwest::header::HeaderValue::from_static("application/json")); h }).build().map_err(|e| e.to_string())
}

fn err_text(st: u16, v: &Value) -> String {
    if let Some(e) = v["error"].as_str() { return e.to_string(); }
    if let Some(d) = v["errors"][0]["detail"].as_str() { return format!("{d}"); }
    api_err(st, v)
}

/// Kimlikli JSON çağrısı (GET/POST). Başarısızsa forumun hata metnini döndürür.
pub async fn call(base: &str, token: &str, method: &str, path: &str, body: Option<Value>) -> Result<Value, String> {
    let c = long_client()?;
    let url = format!("{base}{path}");
    let mut rb = if method == "POST" { c.post(url) } else { c.get(url) };
    rb = rb.header("Authorization", format!("Token {token}"));
    if let Some(b) = body { rb = rb.json(&b); }
    let r = rb.send().await.map_err(|e| format!("Foruma bağlanılamadı: {e}"))?;
    let (st, v) = json_of(r).await?;
    if st >= 400 { return Err(err_text(st, &v)); }
    Ok(v)
}

/// Forumun yükleme ucu: görseli (orijinal baytlarıyla) yükler, imzayı ekletir; yanıtta BBCode döner.
pub async fn upload(base: &str, token: &str, bytes: Vec<u8>, filename: &str, watermark: &str) -> Result<Value, String> {
    let lower = filename.to_lowercase();
    let mime = if lower.ends_with(".png") { "image/png" } else if lower.ends_with(".webp") { "image/webp" } else { "image/jpeg" };
    let part = reqwest::multipart::Part::bytes(bytes).file_name(filename.to_string()).mime_str(mime).map_err(|e| e.to_string())?;
    let form = reqwest::multipart::Form::new().part("image", part).text("watermark_type", if watermark.is_empty() { "none".to_string() } else { watermark.to_string() });
    let r = long_client()?.post(format!("{base}/api/framio-media/upload")).header("Authorization", format!("Token {token}")).multipart(form).send().await.map_err(|e| format!("Yükleme gönderilemedi: {e}"))?;
    let st = r.status().as_u16();
    if st == 413 { return Err("TOO_LARGE".into()); }
    let (st, v) = json_of(r).await?;
    if st >= 400 { return Err(err_text(st, &v)); }
    if v["bbcode"].as_str().is_none() { return Err("Forum yükleme yanıtında BBCode yok".into()); }
    Ok(v)
}
