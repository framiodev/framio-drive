//! Forumda paylaş: forum profilleri, giriş ve forum bilgisi komutları.
use crate::{clean_name, data_dir, de, drv, shrink_to};
use std::path::PathBuf;
use tauri::{AppHandle, Emitter};
use base64::Engine as _;
use drivenet::forum;
use serde_json::{json, Value};

fn path() -> std::path::PathBuf { data_dir().join("forums.json") }

/// Eski sürümlerde gömülü gelen iki forum: yalnızca bu bilgisayarda zaten giriş yapılmışsa forums.json'a taşınır.
/// Yeni kurulumlarda hiçbir forum adresi uygulamanın içinde bulunmaz.
fn migrate_legacy() {
    if path().exists() { return; }
    let old = [("ulasimarsiv", "Ulaşım Arşiv", "https://forum.ulasimplatformu.com"), ("spotters", "Spotters Türkiye", "https://forum.spottersturkey.com")];
    let keep: Vec<Value> = old.iter().filter(|(id, _, _)| forum::load_session(id).is_some() || forum::load_cred(id).is_some())
        .map(|(id, n, b)| json!({ "id": id, "name": n, "base": b })).collect();
    if keep.is_empty() { return; }
    let _ = std::fs::create_dir_all(data_dir());
    let _ = std::fs::write(path(), Value::Array(keep).to_string());
}

fn profiles() -> Vec<Value> {
    std::fs::read_to_string(path()).ok().and_then(|t| serde_json::from_str::<Value>(&t).ok()).and_then(|v| v.as_array().cloned()).filter(|a| !a.is_empty())
        .unwrap_or_default()
}
pub fn find(id: &str) -> Result<(String, Value), String> {
    let p = profiles().into_iter().find(|p| p["id"].as_str() == Some(id)).ok_or("Forum bulunamadı")?;
    Ok((forum::clean_base(p["base"].as_str().unwrap_or(""))?, p))
}

#[tauri::command]
pub fn forum_list() -> Value {
    // Forum eklentisi kapaliysa forum ozellikleri hic gorunmez
    if !crate::ext_on("forum") { return Value::Array(vec![]); }
    migrate_legacy();
    Value::Array(profiles().into_iter().map(|mut p| {
        let s = p["id"].as_str().and_then(forum::load_session);
        p["user"] = s.as_ref().map(|s| s["username"].clone()).unwrap_or(Value::Null);
        // Kayıtlı kullanıcı adı: çıkıştan sonra giriş kutusu dolu gelir
        p["ident"] = p["id"].as_str().and_then(forum::load_cred).map(|c| c["ident"].clone()).unwrap_or(Value::Null);
        p
    }).collect())
}
#[tauri::command]
pub fn forum_save(list: Value) -> Result<(), String> {
    let arr = list.as_array().ok_or("Geçersiz liste")?;
    for p in arr {
        if p["id"].as_str().map(|s| s.is_empty()).unwrap_or(true) { return Err("Forum kimliği boş".into()); }
        forum::clean_base(p["base"].as_str().unwrap_or(""))?;
    }
    let _ = std::fs::create_dir_all(data_dir());
    std::fs::write(path(), list.to_string()).map_err(|e| e.to_string())
}
#[tauri::command]
pub async fn forum_login(id: String, ident: String, pass: String) -> Result<String, String> {
    let (base, _) = find(&id)?;
    if ident.trim().is_empty() || pass.is_empty() { return Err("Kullanıcı adı ve parola gerekli".into()); }
    let s = forum::login(&base, ident.trim(), &pass).await?;
    forum::save_session(&id, &s)?;
    // Oturum düşerse (jeton süresi, sunucu temizliği) sessizce yeniden giriş için; yalnızca Windows Kimlik Bilgisi Yöneticisi'nde
    let _ = forum::save_cred(&id, ident.trim(), &pass);
    Ok(s["username"].as_str().unwrap_or("").to_string())
}
#[tauri::command]
pub fn forum_logout(id: String) { forum::clear_session(&id); forum::forget_pass(&id); }

#[tauri::command]
pub async fn forum_meta(id: String) -> Result<Value, String> {
    let (base, tok) = sess(&id).await?;
    let mut m = forum::meta(&base, &tok).await?;
    // Üyenin forumdaki varsayılan imzası (asistan tercihi)
    let uid = forum::load_session(&id).map(|s| s["userId"].as_i64().unwrap_or(0)).unwrap_or(0);
    if let Ok(u) = forum::call(&base, &tok, "GET", &format!("/api/users/{uid}"), None).await {
        m["defaultWatermark"] = u["data"]["attributes"]["preferences"]["framio_assistant_watermark"].clone();
    }
    // Yönetici mi? (üye adına paylaşım yalnız yöneticide)
    let admin = forum::call(&base, &tok, "GET", &format!("/api/users/{uid}?include=groups"), None).await.ok()
        .map(|u| u["included"].as_array().map(|a| a.iter().any(|g| g["type"] == "groups" && g["id"].as_str() == Some("1"))).unwrap_or(false)).unwrap_or(false);
    m["isAdmin"] = json!(admin);
    if let Ok(u) = forum::call(&base, &tok, "GET", &format!("/api/users/{uid}"), None).await {
        m["user"] = json!({ "id": uid.to_string(), "attributes": u["data"]["attributes"].clone(), "isAdmin": admin });
    }
    m["base"] = json!(base);
    Ok(m)
}

pub fn bases() -> Vec<String> { profiles().iter().filter_map(|p| p["base"].as_str().map(|b| b.trim_end_matches('/').to_string())).collect() }

static CHECKED: std::sync::OnceLock<std::sync::Mutex<std::collections::HashMap<String, std::time::Instant>>> = std::sync::OnceLock::new();

/// Oturum (adres, jeton). Jeton forumca reddedilmişse (401) kayıtlı giriş bilgisiyle sessizce yeniden giriş yapılır;
/// güvenlik duvarı/ağ hatasında (belirsiz) oturum olduğu gibi kullanılır. Doğrulama 10 dakikada bir yapılır.
pub async fn sess(id: &str) -> Result<(String, String), String> {
    let (base, _) = find(id)?;
    let mut s = forum::load_session(id);
    let map = CHECKED.get_or_init(|| std::sync::Mutex::new(Default::default()));
    let fresh = map.lock().ok().and_then(|m| m.get(id).map(|t| t.elapsed().as_secs() < 600)).unwrap_or(false);
    let bad = match &s {
        None => true,
        Some(_) if fresh => false,
        Some(v) => forum::check(&base, v["token"].as_str().unwrap_or("")).await == Some(false),
    };
    if bad {
        let c = forum::load_cred(id);
        let (i, p) = c.as_ref().map(|c| (c["ident"].as_str().unwrap_or("").to_string(), c["pass"].as_str().unwrap_or("").to_string())).unwrap_or_default();
        if !i.is_empty() && !p.is_empty() {
            let n = forum::login(&base, &i, &p).await.map_err(|e| format!("Oturum yenilenemedi: {e}"))?;
            forum::save_session(id, &n)?;
            s = Some(n);
        } else {
            forum::clear_session(id);
            return Err(if s.is_some() { "Oturum süresi dolmuş; Ayarlar > Forumlar'dan yeniden giriş yap".into() } else { "Bu foruma giriş yapılmamış".to_string() });
        }
    }
    if let Ok(mut m) = map.lock() { m.insert(id.to_string(), std::time::Instant::now()); }
    let s = s.ok_or("Bu foruma giriş yapılmamış")?;
    Ok((base, s["token"].as_str().unwrap_or("").to_string()))
}

fn enc(s: &str) -> String {
    s.bytes().map(|b| if b.is_ascii_alphanumeric() || b"-_.~".contains(&b) { (b as char).to_string() } else { format!("%{:02X}", b) }).collect()
}

/// Kaynak görselin baytları: {kind:"drive",email,key} ya da {kind:"local",path}
async fn source_bytes(src: &Value, name: &str) -> Result<Vec<u8>, String> {
    if src["kind"] == "drive" {
        let d = drv(src["email"].as_str().unwrap_or("")).await?;
        let tmp = std::env::temp_dir().join("FramioShare");
        let _ = std::fs::create_dir_all(&tmp);
        let p = tmp.join(format!("{}_{}", std::process::id(), clean_name(name)));
        d.download(src["key"].as_str().unwrap_or(""), &p).await.map_err(de)?;
        let b = std::fs::read(&p).map_err(|e| e.to_string());
        let _ = std::fs::remove_file(&p);
        b
    } else {
        std::fs::read(src["path"].as_str().unwrap_or("")).map_err(|e| format!("Dosya okunamadı: {e}"))
    }
}

async fn shrunk(bytes: Vec<u8>, max: u32, q: u32, tag: &str) -> Vec<u8> {
    let tmp = std::env::temp_dir().join("FramioShare");
    let _ = std::fs::create_dir_all(&tmp);
    let (a, b) = (tmp.join(format!("{}_{tag}_in", std::process::id())), tmp.join(format!("{}_{tag}_out.jpg", std::process::id())));
    if std::fs::write(&a, &bytes).is_err() { return bytes; }
    let (a2, b2) = (a.clone(), b.clone());
    let ok = tauri::async_runtime::spawn_blocking(move || shrink_to(&a2, &b2, max, q)).await.unwrap_or(false);
    let out = if ok { std::fs::read(&b).unwrap_or(bytes) } else { bytes };
    let _ = std::fs::remove_file(&a); let _ = std::fs::remove_file(&b);
    out
}

fn str_of(v: &Value) -> String { v.as_str().unwrap_or("").trim().to_string() }

/// Özgün dosyanın ilk 256 KB'ı (EXIF: çekim yılı, GPS) ve dosyanın değişiklik yılı (EXIF yoksa son çare).
fn head_of(b: &[u8]) -> Vec<u8> { b[..b.len().min(262144)].to_vec() }
fn year_of_file(src: &Value) -> String {
    let Some(p) = src["path"].as_str() else { return String::new() };
    let Ok(t) = std::fs::metadata(p).and_then(|m| m.modified()) else { return String::new() };
    let secs = t.duration_since(std::time::UNIX_EPOCH).map(|d| d.as_secs() as i64).unwrap_or(0);
    // gün sayısından takvim yılı (Howard Hinnant algoritması)
    let z = secs / 86400 + 719468; let era = z.div_euclid(146097); let doe = z.rem_euclid(146097);
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365; let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153; let m = if mp < 10 { mp + 3 } else { mp - 9 };
    (yoe + era * 400 + if m <= 2 { 1 } else { 0 }).to_string()
}

/// Forumun yapay zekâsıyla künye alanlarını doldurur. Forumdaki künye penceresiyle aynı istek: özgün EXIF başlığı, dosya adı,
/// başlığın etiketi/kimliği (kategori şeması) ve doğruluk kipi. Yanıttaki tüm alanlar döner (hat, filo kodu, şehir…).
#[tauri::command]
pub async fn forum_ai_fill(id: String, src: Value, name: String, tag_slug: Option<String>, discussion_id: Option<String>, deep: Option<bool>) -> Result<Value, String> {
    let (base, tok) = sess(&id).await?;
    let b = source_bytes(&src, &name).await?;
    let head = head_of(&b);
    let small = shrunk(b, 1600, 85, "ai").await;
    let r = drivenet::forum::analyze(&base, &tok, small, head, &name, tag_slug.as_deref().unwrap_or(""), discussion_id.as_deref().unwrap_or(""), deep.unwrap_or(false)).await?;
    let d = &r["data"];
    let mut o = d.as_object().cloned().unwrap_or_default();
    // Alanları metne çevir
    for (_, v) in o.iter_mut() { if !v.is_string() { *v = json!(v.as_i64().map(|n| n.to_string()).or_else(|| v.as_str().map(|s| s.to_string())).unwrap_or_default()); } }
    let place = [str_of(&d["place"]), str_of(&d["city"])].into_iter().filter(|x| !x.is_empty()).collect::<Vec<_>>().join(", ");
    if str_of(&d["location"]).is_empty() { o.insert("location".into(), json!(place)); }
    if str_of(&d["year"]).is_empty() { o.insert("year".into(), json!(year_of_file(&src))); o.insert("yearSource".into(), json!("file")); }
    o.insert("locationSource".into(), r["locationSource"].clone());
    Ok(Value::Object(o))
}

/// Seçilen başlığın künye bağlamı: etiketine göre kategori şeması (alanlar + çıktı şablonu) ve marka/model listesi.
#[tauri::command]
pub async fn forum_context(id: String, discussion_id: String, slugs: Vec<String>) -> Result<Value, String> {
    let (base, tok) = sess(&id).await?;
    let mut schema = Value::Null;
    for sl in &slugs {
        let q = format!("/api/framio-media/category-schemas?tag_slug={}{}", enc(sl), if discussion_id.is_empty() { String::new() } else { format!("&discussion_id={}", enc(&discussion_id)) });
        if let Ok(v) = forum::call(&base, &tok, "GET", &q, None).await { if v["data"]["fields_config"].is_array() || v["data"]["fields_config"].is_string() { schema = v["data"].clone(); break; } }
    }
    let tq = if discussion_id.is_empty() { "/api/framio-media/taxonomy".to_string() } else { format!("/api/framio-media/taxonomy?discussion_id={}", enc(&discussion_id)) };
    let tax = forum::call(&base, &tok, "GET", &tq, None).await.map(|v| v["data"].clone()).unwrap_or(json!([]));
    Ok(json!({ "schema": schema, "taxonomy": tax }))
}

/// Başlığın etiketleri (künye şeması ve şehir içi kipi için)
#[tauri::command]
pub async fn forum_topic_tags(id: String, discussion_id: String) -> Result<Value, String> {
    let (base, tok) = sess(&id).await?;
    let v = forum::call(&base, &tok, "GET", &format!("/api/discussions/{}?include=tags", enc(&discussion_id)), None).await?;
    Ok(Value::Array(v["included"].as_array().cloned().unwrap_or_default().iter().filter(|x| x["type"] == "tags").map(|t| json!({ "id": t["id"], "slug": t["attributes"]["slug"] })).collect()))
}

/// Forumun /api/framio-media/ altındaki okuma uçları (şehir ve hat listesi)
#[tauri::command]
pub async fn forum_get(id: String, path: String) -> Result<Value, String> {
    if !(path.starts_with("/api/framio-media/") || path.starts_with("/api/framio/crosspost/")) || path.contains("..") { return Err("İzin verilmeyen adres".into()); }
    let (base, tok) = sess(&id).await?;
    forum::call(&base, &tok, "GET", &path, None).await
}

/// Tek görseli (imzalı) arka planda yükler; BBCode döner. Görsel eklenir eklenmez çağrılır, paylaşımda hazır kullanılır.
#[tauri::command]
pub async fn forum_upload_one(id: String, src: Value, name: String, watermark: String, target: Option<String>) -> Result<String, String> {
    let tu = target.unwrap_or_default();
    let (base, tok) = sess(&id).await?;
    let b = source_bytes(&src, &name).await?;
    let r = match drivenet::forum::upload_as(&base, &tok, b.clone(), &name, &watermark, &tu).await {
        Err(e) if e == "TOO_LARGE" => {
            let s = shrunk(b, 3840, 92, "up").await;
            drivenet::forum::upload_as(&base, &tok, s, &name, &watermark, &tu).await.map_err(|e| if e == "TOO_LARGE" { "Görsel forumun boyut sınırını aşıyor".to_string() } else { e })?
        }
        r => r?,
    };
    Ok(r["bbcode"].as_str().unwrap_or("").to_string())
}

fn pct_decode(s: &str) -> String {
    let b = s.as_bytes();
    let mut o: Vec<u8> = vec![];
    let mut i = 0;
    while i < b.len() {
        if b[i] == b'%' && i + 2 < b.len() {
            if let Some(Ok(v)) = s.get(i + 1..i + 3).map(|h| u8::from_str_radix(h, 16)) { o.push(v); i += 3; continue; }
        }
        o.push(b[i]); i += 1;
    }
    String::from_utf8_lossy(&o).to_string()
}

/// Forum eklentisi paketinin (forum-port) tüm istekleri buradan geçer: ham gövde + üstbilgiler (x-fid, x-method, x-path, x-ct).
#[tauri::command]
pub async fn forum_fwd(request: tauri::ipc::Request<'_>) -> Result<Value, String> {
    let h = request.headers();
    let get = |k: &str| h.get(k).and_then(|v| v.to_str().ok()).unwrap_or("").to_string();
    let (id, method, path, ct) = (get("x-fid"), get("x-method").to_uppercase(), pct_decode(&get("x-path")), get("x-ct"));
    let body = match request.body() { tauri::ipc::InvokeBody::Raw(b) => b.clone(), _ => vec![] };
    let (base, tok) = sess(&id).await?;
    let (st, text) = drivenet::forum::fwd(&base, &tok, &method, &path, &ct, body).await?;
    Ok(json!({ "status": st, "body": text }))
}

/// Dosyanın ham baytları (yerel ya da Drive); forum paketi bunları File nesnesine çevirir.
#[tauri::command]
pub async fn forum_file_bytes(src: Value, name: String) -> Result<tauri::ipc::Response, String> {
    let b = source_bytes(&src, &name).await?;
    Ok(tauri::ipc::Response::new(b))
}

/// Genel forum isteği (GET/POST/PATCH/DELETE; yalnız /api/ altı). Görsel silme, özel veri, taslak vb. için.
#[tauri::command]
pub async fn forum_req(id: String, method: String, path: String, body: Option<Value>) -> Result<Value, String> {
    if !path.starts_with("/api/") { return Err("Geçersiz yol".into()); }
    let m = method.to_uppercase();
    if !["GET", "POST", "PATCH", "DELETE"].contains(&m.as_str()) { return Err("Geçersiz yöntem".into()); }
    let (base, tok) = sess(&id).await?;
    drivenet::forum::call(&base, &tok, &m, &path, body).await
}

/// Kişisel imza yükle (yalnız forum izin veriyorsa; ad forumun beklediği biçimde verilir).
#[tauri::command]
pub async fn forum_wm_upload(id: String, src: Value, name: String) -> Result<Value, String> {
    let (base, tok) = sess(&id).await?;
    let b = source_bytes(&src, &name).await?;
    drivenet::forum::wm_upload(&base, &tok, b, &name).await
}

/// Künyeye göre önerilen başlıklar (forumun öğrenen yönlendiricisi).
#[tauri::command]
pub async fn forum_route(id: String, fields: Value, hint: String) -> Result<Value, String> {
    let (base, tok) = sess(&id).await?;
    let v = drivenet::forum::call(&base, &tok, "POST", "/api/framio-assistant/route", Some(json!({
        "plate": fields["plate"], "brand": fields["brand"], "model": fields["model"], "company": fields["company"], "year": fields["year"], "hint": hint }))).await?;
    Ok(v["suggestions"].clone())
}

/// Başlık arama (yanıt vermek için).
#[tauri::command]
pub async fn forum_find_topic(id: String, q: String) -> Result<Value, String> {
    let (base, tok) = sess(&id).await?;
    let v = drivenet::forum::call(&base, &tok, "GET", &format!("/api/discussions?filter%5Bq%5D={}&page%5Blimit%5D=10", enc(q.trim())), None).await?;
    Ok(Value::Array(v["data"].as_array().cloned().unwrap_or_default().iter().map(|d| json!({ "discussion_id": d["id"], "title": d["attributes"]["title"], "url": d["attributes"]["shareUrl"] })).collect()))
}

/// BBCode etiketindeki öznitelik (url="…" ya da url=…)
fn attr_of(code: &str, name: &str) -> String {
    let key = format!("{name}=");
    let mut from = 0;
    while let Some(i) = code[from..].find(&key) {
        let at = from + i;
        let ok = at == 0 || !code.as_bytes()[at - 1].is_ascii_alphanumeric();
        if ok {
            let rest = &code[at + key.len()..];
            let mut ch = rest.chars();
            return match ch.next() {
                Some(q) if q == '"' || q == '\'' => rest[1..].split(q).next().unwrap_or("").to_string(),
                _ => rest.split(|c: char| c.is_whitespace() || c == ']').next().unwrap_or("").to_string(),
            };
        }
        from = at + key.len();
    }
    String::new()
}

fn set_alt(code: &str, alt: &str) -> String {
    if alt.is_empty() { return code.to_string(); }
    let alt = alt.replace('"', "&quot;");
    let mut out = String::new(); let mut rest = code;
    while let Some(i) = rest.find("alt=\"") {
        out.push_str(&rest[..i + 5]);
        let after = &rest[i + 5..];
        match after.find('"') { Some(j) => { out.push_str(&alt); rest = &after[j..]; } None => { rest = after; break; } }
    }
    out.push_str(rest); out
}

/// Görselleri (arka planda yüklenmemişse yükleyip) künyeleriyle birlikte seçilen başlığa yanıt olarak paylaşır.
/// items: [{name, src, bbcode?, alt, kunye, fields}] — künye metni arayüzde forumun şemasına göre üretilir.
#[tauri::command]
pub async fn forum_share(app: AppHandle, id: String, req: Value) -> Result<Value, String> {
    let (base, tok) = sess(&id).await?;
    let topic = req["topic"].as_str().map(|s| s.to_string()).or(req["topic"].as_i64().map(|n| n.to_string())).ok_or("Başlık seçilmedi")?;
    let items = req["items"].as_array().cloned().unwrap_or_default();
    if items.is_empty() { return Err("Görsel yok".into()); }
    let wm = str_of(&req["watermark"]);
    let total = items.len();
    let mut blocks: Vec<(String, String)> = vec![];
    for (i, it) in items.iter().enumerate() {
        let name = it["name"].as_str().unwrap_or("foto.jpg").to_string();
        let mut code = str_of(&it["bbcode"]);
        if code.is_empty() {
            let _ = app.emit("forum-share", json!({ "i": i, "total": total, "msg": format!("Yükleniyor: {name}") }));
            let wmi = { let w = str_of(&it["watermark"]); if w.is_empty() { wm.clone() } else { w } };
            code = forum_upload_one(id.clone(), it["src"].clone(), name.clone(), wmi, Some(str_of(&req["postAsName"]))).await?;
        } else {
            let _ = app.emit("forum-share", json!({ "i": i, "total": total, "msg": format!("Hazır: {name}") }));
        }
        blocks.push((set_alt(&code, &str_of(&it["alt"])), str_of(&it["kunye"])));
    }
    // Forumdaki finishProcess ile aynı birleştirme: künye (tek/birden çok), fotoğrafa özel Info, gönderi geneli "Meraklısına Info"
    let infos = req["info"].as_array().cloned().unwrap_or_default();
    let photo_infos: Vec<&Value> = infos.iter().filter(|x| x["scope"] == "photos" && x["photos"].as_array().map(|a| !a.is_empty()).unwrap_or(false)).collect();
    let last_photo = |x: &Value| x["photos"].as_array().map(|a| a.iter().filter_map(|v| v.as_i64()).max().unwrap_or(-1)).unwrap_or(-1);
    let general = infos.iter().filter(|x| x["scope"] != "photos").map(|x| str_of(&x["formatted"])).filter(|t| !t.is_empty()).collect::<Vec<_>>().join("\n>\n");
    let same = blocks.iter().all(|b| b.1 == blocks[0].1);
    let mut content = if same {
        let k = &blocks[0].1;
        let mut t = blocks.iter().map(|b| b.0.clone()).collect::<Vec<_>>().join("\n");
        if !k.is_empty() { t.push('\n'); t.push_str(k); }
        for x in &photo_infos { t.push_str("\n\n"); t.push_str(&str_of(&x["formatted"])); }
        t
    } else {
        blocks.iter().enumerate().map(|(i, b)| {
            let mut t = if b.1.is_empty() { b.0.clone() } else { format!("{}\n{}", b.0, b.1) };
            for x in photo_infos.iter().filter(|x| last_photo(x) == i as i64) { t.push_str("\n\n"); t.push_str(&str_of(&x["formatted"])); }
            t
        }).collect::<Vec<_>>().join("\n\n")
    };
    if general.trim().is_empty() { content.push('\n'); }
    else {
        content.push_str("\n\n> **Meraklısına Info**\n>\n");
        content.push_str(&general.split('\n').map(|l| format!("> {l}")).collect::<Vec<_>>().join("\n"));
        content.push('\n');
    }
    // Müzik / konum: görsellerin özel verisi (forumda yayın sırasında PATCH edilir)
    for (i, it) in items.iter().enumerate() {
        if it["music"].is_null() && it["gps"].is_null() { continue; }
        let iid = attr_of(&blocks[i].0, "id");
        if iid.is_empty() { continue; }
        let _ = drivenet::forum::call(&base, &tok, "PATCH", &format!("/api/framio-media/image/{iid}/custom-data"), Some(json!({ "custom_music": it["music"], "custom_gps": it["gps"] }))).await;
    }
    let label = items.iter().filter_map(|i| i["alt"].as_str()).find(|a| !a.is_empty()).map(|s| s.to_string()).unwrap_or_else(|| name_of(&items));
    let publish_at = str_of(&req["publish_at"]);
    let learn_all = |topic: &str| items.iter().map(|it| json!({ "plate": it["fields"]["plate"], "brand": it["fields"]["brand"], "model": it["fields"]["model"], "company": it["fields"]["company"], "discussion_id": topic })).collect::<Vec<_>>();
    if req["draft"].as_bool() == Some(true) {
        let _ = app.emit("forum-share", json!({ "i": total, "total": total, "msg": "Taslak kaydediliyor…" }));
        let title = str_of(&req["draftTitle"]);
        let d = drivenet::forum::call(&base, &tok, "POST", "/api/drafts", Some(json!({ "data": { "type": "drafts", "attributes": {
            "title": if title.is_empty() { label.clone() } else { title }, "content": content,
            "relationships": { "discussion": { "data": { "type": "discussions", "id": topic } } }, "extra": {} } } }))).await?;
        return Ok(json!({ "draft": true, "id": d["data"]["id"], "count": total }));
    }
    if !publish_at.is_empty() {
        let _ = app.emit("forum-share", json!({ "i": total, "total": total, "msg": "Zamanlanıyor…" }));
        let r = drivenet::forum::call(&base, &tok, "POST", "/api/framio-assistant/schedule", Some(json!({ "items": [{
            "discussion_id": topic.parse::<i64>().unwrap_or(0), "content": content, "label": label, "publish_at": publish_at }] }))).await?;
        if r["ok"].as_bool() != Some(true) { return Err("Forum zamanlamayı kabul etmedi (tarih geçmişte olabilir)".into()); }
        for l in learn_all(&topic) { let _ = drivenet::forum::call(&base, &tok, "POST", "/api/framio-assistant/learn", Some(l)).await; }
        return Ok(json!({ "scheduled": true, "at": publish_at, "count": total }));
    }
    let _ = app.emit("forum-share", json!({ "i": total, "total": total, "msg": "Mesaj gönderiliyor…" }));
    let created = drivenet::forum::call(&base, &tok, "POST", "/api/posts", Some(json!({ "data": { "type": "posts", "attributes": post_attrs(&content, &req["postAs"]),
        "relationships": { "discussion": { "data": { "type": "discussions", "id": topic } } } } }))).await?;
    let number = created["data"]["attributes"]["number"].as_i64();
    let post_id = created["data"]["id"].as_str().map(|s| s.to_string()).or(created["data"]["id"].as_i64().map(|n| n.to_string()));
    for l in learn_all(&topic) { let _ = drivenet::forum::call(&base, &tok, "POST", "/api/framio-assistant/learn", Some(l)).await; }
    let url = format!("{base}/d/{topic}{}", number.map(|n| format!("/{n}")).unwrap_or_default());
    // Ağa aktar: her düğüm için ayrı istek (hedef başlık/yeni başlık, etiket, imza düğüme göre değişir)
    let nodes = req["nodes"].as_array().cloned().unwrap_or_default();
    let mut cross: Vec<Value> = vec![];
    if !nodes.is_empty() {
        if let Some(pid) = post_id {
            let _ = app.emit("forum-share", json!({ "i": total, "total": total, "msg": "Ağdaki diğer forumlara aktarılıyor…" }));
            let username = forum::load_session(&id).map(|s| str_of(&s["username"])).unwrap_or_default();
            let urls_of: Vec<String> = blocks.iter().map(|b| attr_of(&b.0, "url")).collect();
            for n in &nodes {
                let nid = str_of(&n["id"]);
                if nid.is_empty() { continue; }
                let wm_mode = { let m = str_of(&n["wmMode"]); if m.is_empty() { "keep_source".to_string() } else { m } };
                let mut body = json!({ "post_id": pid.parse::<i64>().unwrap_or(0), "target_nodes": [nid.clone()], "watermark_mode": wm_mode,
                    "custom_title": str_of(&n["title"]) });
                let one = |v: &str| { let mut m = serde_json::Map::new(); m.insert(nid.clone(), json!(v)); Value::Object(m) };
                body["target_usernames"] = one(&username);
                if str_of(&n["mode"]) != "new_discussion" && !str_of(&n["url"]).is_empty() { body["target_discussion_urls"] = one(&str_of(&n["url"])); }
                if !str_of(&n["tag"]).is_empty() { body["target_tags"] = one(&str_of(&n["tag"])); }
                if wm_mode == "target_site" {
                    let ids: Vec<String> = n["wmByItem"].as_array().map(|a| a.iter().map(str_of).collect()).unwrap_or_default();
                    let mut map = serde_json::Map::new();
                    for (i, u) in urls_of.iter().enumerate() { if !u.is_empty() { if let Some(w) = ids.get(i).filter(|w| !w.is_empty()) { map.insert(u.clone(), json!(w)); } } }
                    body["watermark_map"] = Value::Object(map);
                    if let Some(w) = ids.iter().find(|w| !w.is_empty()) { body["watermark_id"] = json!(w); }
                }
                cross.push(match drivenet::forum::call(&base, &tok, "POST", "/api/framio/crosspost/outbound", Some(body)).await {
                    Ok(v) => json!({ "node": nid, "results": v["results"].clone() }),
                    Err(e) => json!({ "node": nid, "error": e }),
                });
            }
        }
    }
    Ok(json!({ "url": url, "count": total, "cross": cross }))
}

fn name_of(items: &[Value]) -> String { items.first().and_then(|i| i["name"].as_str()).unwrap_or("Görsel").to_string() }

/// Önizleme küçük resmi (data URL, ~320 px)
#[tauri::command]
pub async fn forum_thumb(src: Value, name: String, max: Option<u32>) -> Result<String, String> {
    let b = source_bytes(&src, &name).await?;
    let big = max.unwrap_or(320);
    let small = shrunk(b, big, if big > 400 { 82 } else { 75 }, &format!("th{big}")).await;
    Ok(format!("data:image/jpeg;base64,{}", base64::engine::general_purpose::STANDARD.encode(small)))
}

/// Ağa aktarma düğümleri (diğer forumlar) ve bu başlık için eşleşen hedef başlıklar
#[tauri::command]
pub async fn forum_nodes(id: String, discussion_id: String) -> Result<Value, String> {
    let (base, tok) = sess(&id).await?;
    drivenet::forum::call(&base, &tok, "GET", &format!("/api/framio/crosspost/nodes?discussion_id={}", enc(&discussion_id)), None).await
}

/// Paylaş > E-posta: varsayılan posta uygulamasında hazır bir ileti açar (ek eklenemez; bağlantılar metne yazılır).
#[tauri::command]
pub fn share_mail(subject: String, body: String) -> Result<(), String> {
    let enc = |t: &str| t.bytes().map(|b| if b.is_ascii_alphanumeric() || b"-_.~".contains(&b) { (b as char).to_string() } else { format!("%{:02X}", b) }).collect::<String>();
    let url = format!("mailto:?subject={}&body={}", enc(&subject), enc(&body));
    if url.len() > 6000 { return Err("İleti çok uzun; daha az görsel seç".into()); }
    std::process::Command::new("cmd").args(["/C", "start", "", &url]).spawn().map(|_| ()).map_err(|e| e.to_string())
}
/// Dosyayı Gezgin'de seçili olarak gösterir.
#[tauri::command]
pub fn share_reveal(path: String) -> Result<(), String> {
    if !std::path::Path::new(&path).exists() { return Err("Dosya bulunamadı".into()); }
    std::process::Command::new("explorer.exe").arg(format!("/select,{}", path)).spawn().map(|_| ()).map_err(|e| e.to_string())
}

/// Gönderi öznitelikleri; yönetici bir üye adına paylaşıyorsa `framioPostAs` (üye kimliği) eklenir.
fn post_attrs(content: &str, post_as: &Value) -> Value {
    let mut a = json!({ "content": content });
    let id = post_as.as_i64().or(post_as.as_str().and_then(|s| s.parse().ok())).unwrap_or(0);
    if id > 0 { a["framioPostAs"] = json!(id); }
    a
}
