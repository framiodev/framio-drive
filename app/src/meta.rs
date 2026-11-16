//! Meta / Instagram bağlantı sekmesi: rehber + kimlik bilgisi saklama + bağlantı testi + Gemini yardımcısı.
use crate::{load_settings, save_settings};
use drivenet::{gemini, meta};
use serde_json::{json, Value};

fn now() -> u64 { std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0) }

#[tauri::command]
pub fn meta_cfg_get() -> Value {
    let s = load_settings();
    let m = &s["meta"];
    json!({
        "app_id": m["app_id"].as_str().unwrap_or(""),
        "has_secret": meta::load("meta-secret").is_some(),
        "has_token": meta::load("meta-token").is_some(),
        "username": m["username"].as_str().unwrap_or(""),
        "ig_id": m["ig_id"].as_str().unwrap_or(""),
        "account_type": m["account_type"].as_str().unwrap_or(""),
        "expires_at": m["expires_at"].as_u64().unwrap_or(0),
        "checked_at": m["checked_at"].as_u64().unwrap_or(0),
        "has_gemini": gemini::load_key().is_some()
    })
}

/// Boş bırakılan alanlar mevcut değeri korur.
#[tauri::command]
pub fn meta_cfg_set(app_id: String, secret: String, token: String) -> Result<(), String> {
    let mut s = load_settings();
    if !app_id.trim().is_empty() { s["meta"]["app_id"] = json!(app_id.trim()); }
    if !secret.trim().is_empty() { meta::save("meta-secret", secret.trim())?; }
    if !token.trim().is_empty() {
        meta::save("meta-token", token.trim())?;
        s["meta"]["username"] = json!(""); s["meta"]["ig_id"] = json!(""); s["meta"]["expires_at"] = json!(0);
    }
    save_settings(&s);
    Ok(())
}

#[tauri::command]
pub fn meta_clear() {
    meta::clear("meta-secret"); meta::clear("meta-token");
    let mut s = load_settings();
    s["meta"] = json!({});
    save_settings(&s);
}

/// Belirteci sınar ve hesabı kaydeder.
#[tauri::command]
pub async fn meta_test() -> Result<Value, String> {
    let t = meta::load("meta-token").ok_or("Önce erişim belirtecini kaydet")?;
    let v = meta::me(&t).await?;
    let mut s = load_settings();
    s["meta"]["username"] = v["username"].clone();
    s["meta"]["ig_id"] = json!(v["user_id"].as_str().map(|x| x.to_string()).or_else(|| v["user_id"].as_u64().map(|x| x.to_string())).unwrap_or_default());
    s["meta"]["account_type"] = v["account_type"].clone();
    s["meta"]["checked_at"] = json!(now());
    save_settings(&s);
    Ok(v)
}

/// Uzun ömürlü belirteci 60 gün uzatır.
#[tauri::command]
pub async fn meta_refresh() -> Result<Value, String> {
    let t = meta::load("meta-token").ok_or("Belirteç yok")?;
    let v = meta::refresh(&t).await?;
    if let Some(n) = v["access_token"].as_str() { meta::save("meta-token", n)?; }
    let mut s = load_settings();
    s["meta"]["expires_at"] = json!(now() + v["expires_in"].as_u64().unwrap_or(0));
    save_settings(&s);
    Ok(json!({ "expires_in": v["expires_in"] }))
}

/// Kısa ömürlü belirteci (ya da kayıtlı olanı) uzun ömürlüye çevirir; uygulama gizli anahtarı gerekir.
#[tauri::command]
pub async fn meta_exchange(short: String) -> Result<Value, String> {
    let secret = meta::load("meta-secret").ok_or("Önce Instagram uygulama gizli anahtarını kaydet")?;
    let src = if short.trim().is_empty() { meta::load("meta-token").ok_or("Belirteç yok")? } else { short.trim().to_string() };
    let v = meta::exchange(&secret, &src).await?;
    let n = v["access_token"].as_str().ok_or("Meta belirteç döndürmedi")?;
    meta::save("meta-token", n)?;
    let mut s = load_settings();
    s["meta"]["expires_at"] = json!(now() + v["expires_in"].as_u64().unwrap_or(0));
    save_settings(&s);
    Ok(json!({ "expires_in": v["expires_in"] }))
}

const SYS: &str = "Sen Framio Drive uygulamasındaki Meta/Instagram bağlantı rehberinin yardımcısısın. Kullanıcı kendi Meta geliştirici uygulamasını oluşturup Instagram profesyonel (işletme/oluşturucu) hesabını bağlıyor; yöntem 'Instagram API with Instagram Login' (Facebook Sayfası gerekmez). Adımlar: 1) developers.facebook.com'da hesap aç, 2) Uygulamayı oluştur (tür: Business), 3) Ürün olarak Instagram'ı ekle ve 'API setup with Instagram business login' bölümüne gir, 4) Instagram profesyonel hesabını ekle (Instagram > API setup > Generate access tokens > hesabı ekle), kendi hesabın için Roller'den test kullanıcısı/yönetici olarak yetkilendirmen yeterli, 5) 'Generate token' ile belirteci al, 6) Business login settings bölümündeki Instagram uygulama kimliği ve gizli anahtarını al, 7) bunları Framio Drive'a yapıştır, bağlantıyı test et. İzinler: instagram_business_basic ve instagram_business_content_publish. Yayın iki adımlıdır (medya kapsayıcısı oluştur, sonra yayınla); görsel herkese açık bir URL'de olmalı; Instagram yerel zamanlama sunmaz, zamanlamayı uygulama yapar. Kişisel hesaplar desteklenmez. Meta arayüzü sık değiştiği için emin olmadığın menü adlarını 'şuna benzer bir yer' diye belirt. Yanıtı Türkçe, kısa ve adım adım ver. Kullanıcıdan şifre, belirteç ya da gizli anahtar isteme; yapıştırırsa uyar ve bunların gizli tutulması gerektiğini söyle.";

#[tauri::command]
pub async fn meta_ask(question: String, step: String) -> Result<String, String> {
    let key = gemini::load_key().ok_or("Gemini anahtarı yok — Ayarlar sekmesindeki Yapay zekâ bölümünden ekle")?;
    let model = load_settings()["ai"]["model"].as_str().unwrap_or("gemini-2.5-flash").to_string();
    let q = format!("Kullanıcı şu an rehberde bu adımda: {step}\n\nSorusu: {question}");
    meta::chat(&key, &model, SYS, &q).await
}

/// Yalnızca Meta geliştirici/Instagram adreslerini tarayıcıda açar.
#[tauri::command]
pub fn meta_open(url: String) -> Result<(), String> {
    let ok = ["https://developers.facebook.com/", "https://business.facebook.com/", "https://www.instagram.com/", "https://help.instagram.com/"].iter().any(|b| url.starts_with(b));
    if !ok { return Err("izin verilmeyen adres".into()); }
    { use std::os::windows::process::CommandExt; std::process::Command::new("cmd").args(["/C", "start", "", &url]).creation_flags(0x0800_0000).spawn() }.map(|_| ()).map_err(|e| e.to_string())
}
