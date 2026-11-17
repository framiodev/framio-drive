//! Meta bağlantı sekmesi (Instagram, Facebook Sayfası, Threads): rehber + kimlik saklama + test/yenileme + Gemini yardımcısı.
use crate::{load_settings, save_settings};
use drivenet::{gemini, meta};
use serde_json::{json, Value};
use tauri::AppHandle;

const PF: [&str; 3] = ["instagram", "facebook", "threads"];
fn now() -> u64 { std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0) }
fn pf(p: &str) -> Result<&'static str, String> { PF.iter().copied().find(|x| *x == p).ok_or_else(|| "bilinmeyen platform".to_string()) }
/// Instagram eski anahtar adlarını korur (önceki sürümden gelen kayıtlar kaybolmasın).
fn acct(p: &str, kind: &str) -> String { if p == "instagram" { format!("meta-{kind}") } else { format!("meta-{p}-{kind}") } }
fn st(s: &Value, p: &str) -> Value {
    let v = &s["meta"]["pf"][p];
    if v.is_object() { return v.clone(); }
    if p == "instagram" && s["meta"]["app_id"].is_string() { return s["meta"].clone(); } // eski biçim
    json!({})
}
fn put(p: &str, f: impl FnOnce(&mut Value)) {
    let mut s = load_settings();
    let mut cur = st(&s, p);
    f(&mut cur);
    s["meta"]["pf"][p] = cur;
    save_settings(&s);
}

#[tauri::command]
pub fn meta_cfg_get() -> Value {
    let s = load_settings();
    let mut o = serde_json::Map::new();
    for p in PF {
        let m = st(&s, p);
        o.insert(p.into(), json!({
            "app_id": m["app_id"].as_str().unwrap_or(""),
            "has_secret": meta::load(&acct(p, "secret")).is_some(),
            "has_token": meta::load(&acct(p, "token")).is_some(),
            "username": m["username"].as_str().unwrap_or(""),
            "id": m["ig_id"].as_str().or(m["id"].as_str()).unwrap_or(""),
            "kind": m["account_type"].as_str().unwrap_or(""),
            "expires_at": m["expires_at"].as_u64().unwrap_or(0),
        }));
    }
    o.insert("has_gemini".into(), json!(gemini::load_key().is_some()));
    Value::Object(o)
}

/// Boş bırakılan alanlar mevcut değeri korur.
#[tauri::command]
pub fn meta_cfg_set(platform: String, app_id: String, secret: String, token: String) -> Result<(), String> {
    let p = pf(&platform)?;
    if !secret.trim().is_empty() { meta::save(&acct(p, "secret"), secret.trim())?; }
    if !token.trim().is_empty() { meta::save(&acct(p, "token"), token.trim())?; }
    let (aid, tk) = (app_id.trim().to_string(), !token.trim().is_empty());
    put(p, |m| {
        if !aid.is_empty() { m["app_id"] = json!(aid); }
        if tk { m["username"] = json!(""); m["id"] = json!(""); m["ig_id"] = json!(""); m["expires_at"] = json!(0); }
    });
    Ok(())
}

#[tauri::command]
pub fn meta_clear(platform: String) -> Result<(), String> {
    let p = pf(&platform)?;
    meta::clear(&acct(p, "secret")); meta::clear(&acct(p, "token"));
    if p == "facebook" { meta::clear("meta-fb-user"); }
    put(p, |m| *m = json!({ "cleared": true }));
    Ok(())
}

/// Belirteci sınar ve hesabı kaydeder. Facebook'ta kullanıcı belirteci verilmişse Sayfa listesi döner.
#[tauri::command]
pub async fn meta_test(platform: String) -> Result<Value, String> {
    let p = pf(&platform)?;
    let t = meta::load(&acct(p, "token")).ok_or("Önce erişim belirtecini kaydet")?;
    let v = meta::me(p, &t).await?;
    let idv = v["user_id"].as_str().map(|x| x.to_string()).or_else(|| v["user_id"].as_u64().map(|x| x.to_string())).or_else(|| v["id"].as_str().map(|x| x.to_string())).unwrap_or_default();
    let name = v["username"].as_str().or(v["name"].as_str()).unwrap_or("").to_string();
    let is_page = p != "facebook" || v["category"].is_string();
    let kind = if p == "facebook" { if is_page { "Sayfa".to_string() } else { "Kullanıcı belirteci".to_string() } } else { v["account_type"].as_str().unwrap_or("").to_string() };
    if p == "facebook" && !is_page { let _ = meta::save("meta-fb-user", &t); }
    put(p, |m| { m["username"] = json!(name); m["id"] = json!(idv); m["account_type"] = json!(kind); });
    Ok(json!({ "name": name, "id": idv, "kind": kind, "is_page": is_page, "media_count": v["media_count"] }))
}

/// Facebook: kullanıcı belirtecinin yönettiği Sayfalar.
#[tauri::command]
pub async fn meta_fb_pages() -> Result<Value, String> {
    let t = meta::load(&acct("facebook", "token")).ok_or("Önce kullanıcı belirtecini kaydet")?;
    let v = meta::fb_pages(&t).await?;
    Ok(json!(v.iter().map(|x| json!({ "id": x["id"], "name": x["name"] })).collect::<Vec<_>>()))
}

/// Facebook: seçilen Sayfanın belirtecini kaydeder (kullanıcı belirteci yerine).
#[tauri::command]
pub async fn meta_fb_use(page_id: String) -> Result<Value, String> {
    let t = meta::load(&acct("facebook", "token")).ok_or("Belirteç yok")?;
    let v = meta::fb_pages(&t).await?;
    let pg = v.iter().find(|x| x["id"].as_str() == Some(page_id.as_str())).ok_or("Sayfa bulunamadı")?;
    let pt = pg["access_token"].as_str().ok_or("Bu Sayfa için belirteç verilmedi (yönetici yetkin ve pages_show_list izni olmalı)")?;
    meta::save(&acct("facebook", "token"), pt)?;
    let name = pg["name"].as_str().unwrap_or("").to_string();
    put("facebook", |m| { m["username"] = json!(name); m["id"] = json!(page_id); m["account_type"] = json!("Sayfa"); });
    Ok(json!({ "name": name }))
}

/// Uzun ömürlü belirteci uzatır (Instagram, Threads).
#[tauri::command]
pub async fn meta_refresh(platform: String) -> Result<Value, String> {
    let p = pf(&platform)?;
    let t = meta::load(&acct(p, "token")).ok_or("Belirteç yok")?;
    let v = meta::refresh(p, &t).await?;
    if let Some(n) = v["access_token"].as_str() { meta::save(&acct(p, "token"), n)?; }
    let ex = v["expires_in"].as_u64().unwrap_or(0);
    put(p, |m| m["expires_at"] = json!(now() + ex));
    Ok(json!({ "expires_in": ex }))
}

/// Kısa ömürlü belirteci (ya da kayıtlı olanı) uzun ömürlüye çevirir; uygulama gizli anahtarı gerekir.
#[tauri::command]
pub async fn meta_exchange(platform: String, short: String) -> Result<Value, String> {
    let p = pf(&platform)?;
    let secret = meta::load(&acct(p, "secret")).ok_or("Önce uygulama gizli anahtarını kaydet")?;
    let app_id = st(&load_settings(), p)["app_id"].as_str().unwrap_or("").to_string();
    if p == "facebook" && app_id.is_empty() { return Err("Önce uygulama kimliğini kaydet".into()); }
    let src = if short.trim().is_empty() { meta::load(&acct(p, "token")).ok_or("Belirteç yok")? } else { short.trim().to_string() };
    let v = meta::exchange(p, &app_id, &secret, &src).await?;
    let n = v["access_token"].as_str().ok_or("Meta belirteç döndürmedi")?;
    meta::save(&acct(p, "token"), n)?;
    let ex = v["expires_in"].as_u64().unwrap_or(0);
    put(p, |m| m["expires_at"] = json!(if ex > 0 { now() + ex } else { 0 }));
    Ok(json!({ "expires_in": ex }))
}

fn sys(p: &str) -> String {
    let own = match p {
        "facebook" => "Platform: Facebook Sayfası. Kişisel profillere ve gruplara API ile paylaşım yapılamaz; yalnızca yöneticisi olunan Sayfaya. Yöntem: Meta uygulaması (Business) oluştur, Graph API Explorer'dan pages_show_list, pages_read_engagement ve pages_manage_posts izinleriyle kullanıcı belirteci üret, /me/accounts ile Sayfa belirtecini al (uzun ömürlü kullanıcı belirtecinden alınan Sayfa belirtecinin son kullanma tarihi olmaz). Facebook Sayfa paylaşımı yerel zamanlamayı destekler (published=false ve scheduled_publish_time, 10 dakika ile 30 gün arası). Başkalarının Sayfalarına yayın için uygulama incelemesi gerekir.",
        "threads" => "Platform: Threads. Yöntem: Meta uygulaması oluştururken 'Threads API'ye eriş' kullanım senaryosunu seç; iki set uygulama kimliği/gizli anahtar çıkar, Threads olanı kullan. İzinler threads_basic ve threads_content_publish. Kısa ömürlü belirteç 1 saat geçerlidir, uzun ömürlüye (60 gün) çevrilir, 24 saat sonra ve süre dolmadan yenilenebilir. Yayın iki adımlıdır (kapsayıcı oluştur, yayınla); yerel zamanlama yoktur, zamanlamayı uygulama yapar. Test kullanıcısı (Threads tester) olarak hesabı eklemek gerekir.",
        _ => "Platform: Instagram (Instagram API with Instagram Login, Facebook Sayfası gerekmez). Instagram profesyonel (işletme/oluşturucu) hesap şart. İzinler instagram_business_basic ve instagram_business_content_publish. Belirteç: uygulama panosunda Instagram > API setup with Instagram business login > Generate token. Yayın iki adımlıdır; görsel herkese açık URL'de olmalı; yerel zamanlama yok, zamanlamayı uygulama yapar. Kişisel hesaplar desteklenmez.",
    };
    format!("Sen Framio Drive uygulamasındaki Meta bağlantı rehberinin yardımcısısın. Kullanıcı kendi Meta geliştirici uygulamasını oluşturup hesabını bağlıyor. {own} Meta arayüzü sık değiştiği için emin olmadığın menü adlarını 'şuna benzer bir yer' diye belirt. Yanıtı Türkçe, kısa ve adım adım ver. Kullanıcıdan şifre, belirteç ya da gizli anahtar isteme; yapıştırırsa uyar ve gizli tutması gerektiğini söyle.")
}

/// API anahtarı varsa uygulama içinde yanıtlar.
#[tauri::command]
pub async fn meta_ask(platform: String, question: String, step: String) -> Result<String, String> {
    let p = pf(&platform)?;
    let key = gemini::load_key().ok_or("Gemini API anahtarı yok — “Gemini’de sor” ile kendi Gemini hesabında sorabilirsin")?;
    let model = load_settings()["ai"]["model"].as_str().unwrap_or("gemini-2.5-flash").to_string();
    meta::chat(&key, &model, &sys(p), &format!("Kullanıcı şu an rehberde bu adımda: {step}\n\nSorusu: {question}")).await
}

/// Uygulamanın genel Gemini mantığı: istemi panoya koyar, kullanıcının kendi Gemini penceresini açar.
#[tauri::command]
pub fn meta_ask_web(app: AppHandle, email: String, platform: String, question: String, step: String) -> Result<(), String> {
    let p = pf(&platform)?;
    let txt = format!("{}\n\nŞu an rehberde bu adımdayım: {step}\n\nSorum: {question}", sys(p));
    crate::set_clip(&txt);
    crate::open_gemini_window(&app, &email)
}

/// Yalnızca Meta geliştirici/Instagram/Threads adreslerini tarayıcıda açar.
#[tauri::command]
pub fn meta_open(url: String) -> Result<(), String> {
    let ok = ["https://developers.facebook.com/", "https://business.facebook.com/", "https://www.instagram.com/", "https://help.instagram.com/", "https://www.threads.net/", "https://www.facebook.com/"].iter().any(|b| url.starts_with(b));
    if !ok { return Err("izin verilmeyen adres".into()); }
    { use std::os::windows::process::CommandExt; std::process::Command::new("cmd").args(["/C", "start", "", &url]).creation_flags(0x0800_0000).spawn() }.map(|_| ()).map_err(|e| e.to_string())
}

// ---- Toplu ekleme: tek Facebook hesabındaki tüm Sayfalar ve bağlı Instagram hesapları ----

fn user_tok() -> Result<String, String> {
    meta::load("meta-fb-user").or_else(|| meta::load(&acct("facebook", "token"))).ok_or_else(|| "Önce Facebook sekmesinde kullanıcı belirtecini kaydet ve test et".to_string())
}

/// Kullanıcı belirtecinin eriştiği tüm Sayfalar (doğrudan + işletme portföyleri). Belirteçler döndürülmez.
async fn scan_all(t: &str) -> Result<Vec<Value>, String> {
    let mut by: std::collections::BTreeMap<String, Value> = Default::default();
    for pg in meta::fb_pages(t).await? {
        if let Some(id) = pg["id"].as_str() { let mut x = pg.clone(); x["business"] = json!("Doğrudan"); by.insert(id.into(), x); }
    }
    let mut biz_err = String::new();
    match meta::fb_businesses(t).await {
        Ok(bs) => for b in bs {
            let (bid, bname) = (b["id"].as_str().unwrap_or("").to_string(), b["name"].as_str().unwrap_or("").to_string());
            for pg in meta::fb_biz_pages(t, &bid).await {
                let Some(id) = pg["id"].as_str().map(|x| x.to_string()) else { continue };
                let mut x = pg.clone(); x["business"] = json!(bname);
                let keep_old = by.get(&id).map(|o| o["access_token"].is_string()).unwrap_or(false) && !x["access_token"].is_string();
                if keep_old { if let Some(o) = by.get_mut(&id) { o["business"] = json!(bname); } } else { by.insert(id, x); }
            }
        },
        Err(e) => biz_err = e,
    }
    let _ = biz_err;
    Ok(by.into_values().collect())
}

fn brief(x: &Value) -> Value {
    json!({ "id": x["id"], "name": x["name"], "business": x["business"], "has_token": x["access_token"].is_string(),
            "ig_id": x["instagram_business_account"]["id"], "ig_username": x["instagram_business_account"]["username"] })
}

#[tauri::command]
pub async fn meta_bulk_scan() -> Result<Value, String> {
    let t = user_tok()?;
    let all = scan_all(&t).await?;
    let added: Vec<String> = load_settings()["meta"]["pages"].as_array().map(|a| a.iter().filter_map(|x| x["id"].as_str().map(|s| s.to_string())).collect()).unwrap_or_default();
    Ok(json!(all.iter().map(|x| { let mut b = brief(x); b["added"] = json!(added.contains(&x["id"].as_str().unwrap_or("").to_string())); b }).collect::<Vec<_>>()))
}

/// Seçilen Sayfaların belirteçlerini Kimlik Bilgisi Yöneticisi'ne kaydeder, listeyi ayarlara yazar.
#[tauri::command]
pub async fn meta_bulk_add(ids: Vec<String>) -> Result<Value, String> {
    let t = user_tok()?;
    let all = scan_all(&t).await?;
    let mut s = load_settings();
    let mut list: Vec<Value> = s["meta"]["pages"].as_array().cloned().unwrap_or_default();
    let (mut n, mut skipped) = (0u32, vec![]);
    for id in ids {
        let Some(pg) = all.iter().find(|x| x["id"].as_str() == Some(id.as_str())) else { continue };
        let Some(tok) = pg["access_token"].as_str() else { skipped.push(pg["name"].as_str().unwrap_or(&id).to_string()); continue };
        meta::save(&format!("meta-pg-{id}"), tok)?;
        let mut b = brief(pg); b["has_token"] = json!(true);
        list.retain(|x| x["id"].as_str() != Some(id.as_str()));
        list.push(b); n += 1;
    }
    s["meta"]["pages"] = json!(list);
    save_settings(&s);
    Ok(json!({ "added": n, "skipped": skipped }))
}

#[tauri::command]
pub fn meta_pages_list() -> Value { let s = load_settings(); if s["meta"]["pages"].is_array() { s["meta"]["pages"].clone() } else { json!([]) } }

#[tauri::command]
pub fn meta_page_remove(id: String) {
    meta::clear(&format!("meta-pg-{id}"));
    let mut s = load_settings();
    if let Some(a) = s["meta"]["pages"].as_array() { s["meta"]["pages"] = json!(a.iter().filter(|x| x["id"].as_str() != Some(id.as_str())).cloned().collect::<Vec<_>>()); }
    save_settings(&s);
}

/// Kayıtlı tüm Sayfa belirteçlerini sınar.
#[tauri::command]
pub async fn meta_pages_test() -> Result<Value, String> {
    let list: Vec<Value> = load_settings()["meta"]["pages"].as_array().cloned().unwrap_or_default();
    let mut out = vec![];
    for x in list {
        let id = x["id"].as_str().unwrap_or("").to_string();
        let ok = match meta::load(&format!("meta-pg-{id}")) { Some(t) => meta::fb_page_me(&t).await.map(|_| String::new()).unwrap_or_else(|e| e), None => "belirteç yok".to_string() };
        out.push(json!({ "id": id, "ok": ok.is_empty(), "err": ok }));
    }
    Ok(json!(out))
}
