//! Forumda paylaş: forum profilleri, giriş ve forum bilgisi komutları.
use crate::{clean_name, data_dir, de, drv, shrink_to};
use std::path::PathBuf;
use tauri::{AppHandle, Emitter};
use base64::Engine as _;
use drivenet::forum;
use serde_json::{json, Value};

fn path() -> std::path::PathBuf { data_dir().join("forums.json") }

fn defaults() -> Value {
    json!([
        { "id": "ulasimarsiv", "name": "Ulaşım Arşiv", "base": "https://forum.ulasimplatformu.com" },
        { "id": "spotters", "name": "Spotters Türkiye", "base": "https://forum.spottersturkey.com" }
    ])
}

fn profiles() -> Vec<Value> {
    std::fs::read_to_string(path()).ok().and_then(|t| serde_json::from_str::<Value>(&t).ok()).and_then(|v| v.as_array().cloned()).filter(|a| !a.is_empty())
        .unwrap_or_else(|| defaults().as_array().cloned().unwrap_or_default())
}
pub fn find(id: &str) -> Result<(String, Value), String> {
    let p = profiles().into_iter().find(|p| p["id"].as_str() == Some(id)).ok_or("Forum bulunamadı")?;
    Ok((forum::clean_base(p["base"].as_str().unwrap_or(""))?, p))
}

#[tauri::command]
pub fn forum_list() -> Value {
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
    if !path.starts_with("/api/framio-media/") || path.contains("..") { return Err("İzin verilmeyen adres".into()); }
    let (base, tok) = sess(&id).await?;
    forum::call(&base, &tok, "GET", &path, None).await
}

/// Tek görseli (imzalı) arka planda yükler; BBCode döner. Görsel eklenir eklenmez çağrılır, paylaşımda hazır kullanılır.
#[tauri::command]
pub async fn forum_upload_one(id: String, src: Value, name: String, watermark: String) -> Result<String, String> {
    let (base, tok) = sess(&id).await?;
    let b = source_bytes(&src, &name).await?;
    let r = match drivenet::forum::upload(&base, &tok, b.clone(), &name, &watermark).await {
        Err(e) if e == "TOO_LARGE" => {
            let s = shrunk(b, 3840, 92, "up").await;
            drivenet::forum::upload(&base, &tok, s, &name, &watermark).await.map_err(|e| if e == "TOO_LARGE" { "Görsel forumun boyut sınırını aşıyor".to_string() } else { e })?
        }
        r => r?,
    };
    Ok(r["bbcode"].as_str().unwrap_or("").to_string())
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
            code = forum_upload_one(id.clone(), it["src"].clone(), name.clone(), wm.clone()).await?;
        } else {
            let _ = app.emit("forum-share", json!({ "i": i, "total": total, "msg": format!("Hazır: {name}") }));
        }
        blocks.push((set_alt(&code, &str_of(&it["alt"])), str_of(&it["kunye"])));
    }
    // Hepsinin künyesi aynıysa görseller art arda, sonda tek künye; farklıysa her görselin altında kendi künyesi
    let same = blocks.iter().all(|b| b.1 == blocks[0].1);
    let content = if same {
        let k = &blocks[0].1;
        format!("{}{}\n", blocks.iter().map(|b| b.0.clone()).collect::<Vec<_>>().join("\n"), if k.is_empty() { String::new() } else { format!("\n\n{k}") })
    } else {
        format!("{}\n", blocks.iter().map(|b| if b.1.is_empty() { b.0.clone() } else { format!("{}\n{}", b.0, b.1) }).collect::<Vec<_>>().join("\n\n"))
    };
    let label = items.iter().filter_map(|i| i["alt"].as_str()).find(|a| !a.is_empty()).map(|s| s.to_string()).unwrap_or_else(|| name_of(&items));
    let publish_at = str_of(&req["publish_at"]);
    let learn_all = |topic: &str| items.iter().map(|it| json!({ "plate": it["fields"]["plate"], "brand": it["fields"]["brand"], "model": it["fields"]["model"], "company": it["fields"]["company"], "discussion_id": topic })).collect::<Vec<_>>();
    if !publish_at.is_empty() {
        let _ = app.emit("forum-share", json!({ "i": total, "total": total, "msg": "Zamanlanıyor…" }));
        let r = drivenet::forum::call(&base, &tok, "POST", "/api/framio-assistant/schedule", Some(json!({ "items": [{
            "discussion_id": topic.parse::<i64>().unwrap_or(0), "content": content, "label": label, "publish_at": publish_at }] }))).await?;
        if r["ok"].as_bool() != Some(true) { return Err("Forum zamanlamayı kabul etmedi (tarih geçmişte olabilir)".into()); }
        for l in learn_all(&topic) { let _ = drivenet::forum::call(&base, &tok, "POST", "/api/framio-assistant/learn", Some(l)).await; }
        return Ok(json!({ "scheduled": true, "at": publish_at, "count": total }));
    }
    let _ = app.emit("forum-share", json!({ "i": total, "total": total, "msg": "Mesaj gönderiliyor…" }));
    let created = drivenet::forum::call(&base, &tok, "POST", "/api/posts", Some(json!({ "data": { "type": "posts", "attributes": { "content": content },
        "relationships": { "discussion": { "data": { "type": "discussions", "id": topic } } } } }))).await?;
    let number = created["data"]["attributes"]["number"].as_i64();
    let post_id = created["data"]["id"].as_str().map(|s| s.to_string()).or(created["data"]["id"].as_i64().map(|n| n.to_string()));
    for l in learn_all(&topic) { let _ = drivenet::forum::call(&base, &tok, "POST", "/api/framio-assistant/learn", Some(l)).await; }
    let url = format!("{base}/d/{topic}{}", number.map(|n| format!("/{n}")).unwrap_or_default());
    // Ağa aktar: seçilen düğümlere (diğer forumlara) gönderiyi yayınla
    let nodes = req["nodes"].as_array().cloned().unwrap_or_default();
    let mut cross = Value::Null;
    if !nodes.is_empty() {
        if let Some(pid) = post_id {
            let _ = app.emit("forum-share", json!({ "i": total, "total": total, "msg": "Ağdaki diğer forumlara aktarılıyor…" }));
            let ids: Vec<Value> = nodes.iter().map(|n| n["id"].clone()).collect();
            let mut urls = serde_json::Map::new();
            for n in &nodes { if let (Some(i), Some(u)) = (n["id"].as_str(), n["url"].as_str()) { if !u.trim().is_empty() { urls.insert(i.to_string(), json!(u.trim())); } } }
            cross = match drivenet::forum::call(&base, &tok, "POST", "/api/framio/crosspost/outbound", Some(json!({
                "post_id": pid.parse::<i64>().unwrap_or(0), "target_nodes": ids, "target_discussion_urls": urls, "watermark_mode": "keep_source" }))).await {
                Ok(v) => v["results"].clone(), Err(e) => json!({ "error": e }) };
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
