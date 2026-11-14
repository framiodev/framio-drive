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
    Ok(s["username"].as_str().unwrap_or("").to_string())
}
#[tauri::command]
pub fn forum_logout(id: String) { forum::clear_session(&id); }

#[tauri::command]
pub async fn forum_meta(id: String) -> Result<Value, String> {
    let (base, _) = find(&id)?;
    let s = forum::load_session(&id).ok_or("Önce bu foruma giriş yap")?;
    let tok = s["token"].as_str().unwrap_or("").to_string();
    match forum::meta(&base, &tok).await {
        Ok(m) => Ok(m),
        Err(e) => {
            if !forum::check(&base, &tok).await { forum::clear_session(&id); return Err("Oturum süresi dolmuş; yeniden giriş yap".into()); }
            Err(e)
        }
    }
}

pub fn bases() -> Vec<String> { profiles().iter().filter_map(|p| p["base"].as_str().map(|b| b.trim_end_matches('/').to_string())).collect() }

fn sess(id: &str) -> Result<(String, String), String> {
    let (base, _) = find(id)?;
    let s = drivenet::forum::load_session(id).ok_or("Bu foruma giriş yapılmamış")?;
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

/// Forumun yapay zekâsıyla künye alanlarını doldurur (ilk görsel).
#[tauri::command]
pub async fn forum_ai_fill(id: String, src: Value, name: String) -> Result<Value, String> {
    let (base, tok) = sess(&id)?;
    let b = source_bytes(&src, &name).await?;
    let small = shrunk(b, 1600, 85, "ai").await;
    let d = drivenet::forum::analyze(&base, &tok, small, "foto.jpg").await?;
    let place = [str_of(&d["place"]), str_of(&d["city"])].into_iter().filter(|x| !x.is_empty()).collect::<Vec<_>>().join(", ");
    let loc = if str_of(&d["location"]).is_empty() { place } else { str_of(&d["location"]) };
    Ok(json!({ "company": str_of(&d["company"]), "plate": str_of(&d["plate"]), "brand": str_of(&d["brand"]), "model": str_of(&d["model"]),
               "location": loc, "year": str_of(&d["year"]) }))
}

/// Künyeye göre önerilen başlıklar (forumun öğrenen yönlendiricisi).
#[tauri::command]
pub async fn forum_route(id: String, fields: Value, hint: String) -> Result<Value, String> {
    let (base, tok) = sess(&id)?;
    let v = drivenet::forum::call(&base, &tok, "POST", "/api/framio-assistant/route", Some(json!({
        "plate": fields["plate"], "brand": fields["brand"], "model": fields["model"], "company": fields["company"], "year": fields["year"], "hint": hint }))).await?;
    Ok(v["suggestions"].clone())
}

/// Başlık arama (yanıt vermek için).
#[tauri::command]
pub async fn forum_find_topic(id: String, q: String) -> Result<Value, String> {
    let (base, tok) = sess(&id)?;
    let v = drivenet::forum::call(&base, &tok, "GET", &format!("/api/discussions?filter%5Bq%5D={}&page%5Blimit%5D=10", enc(q.trim())), None).await?;
    Ok(Value::Array(v["data"].as_array().cloned().unwrap_or_default().iter().map(|d| json!({ "discussion_id": d["id"], "title": d["attributes"]["title"], "url": d["attributes"]["shareUrl"] })).collect()))
}

fn kunye(f: &Value, theme: &str) -> String {
    let g = |k: &str| str_of(&f[k]);
    let join = |a: Vec<String>, sep: &str| a.into_iter().filter(|x| !x.is_empty()).collect::<Vec<_>>().join(sep);
    let l1 = join(vec![g("company"), g("plate")], " | ");
    let l2 = join(vec![g("brand"), g("model")], " ");
    let yy = { let y = g("year"); if y.is_empty() { String::new() } else { let c: Vec<char> = y.chars().collect(); format!("'{}", c[c.len().saturating_sub(2)..].iter().collect::<String>()) } };
    let l3 = join(vec![g("location"), yy], " / ");
    let lines: Vec<String> = [l1, l2, l3].into_iter().filter(|l| !l.is_empty()).map(|l| format!("- **{l}**")).collect();
    if lines.is_empty() { return String::new(); }
    let theme = if theme.is_empty() { "classic" } else { theme };
    format!("[framio-kunye theme=\"{theme}\"]\n{}\n[/framio-kunye]", lines.join("\n"))
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

/// Görselleri yükleyip (imzalı) künyeyle birlikte seçilen başlığa yanıt olarak paylaşır.
#[tauri::command]
pub async fn forum_share(app: AppHandle, id: String, req: Value) -> Result<Value, String> {
    let (base, tok) = sess(&id)?;
    let topic = req["topic"].as_str().map(|s| s.to_string()).or(req["topic"].as_i64().map(|n| n.to_string())).ok_or("Başlık seçilmedi")?;
    let items = req["items"].as_array().cloned().unwrap_or_default();
    if items.is_empty() { return Err("Görsel yok".into()); }
    let wm = str_of(&req["watermark"]);
    let f = &req["fields"];
    let total = items.len();
    let mut codes: Vec<String> = vec![];
    let alt = [[str_of(&f["company"]), str_of(&f["plate"])].into_iter().filter(|x| !x.is_empty()).collect::<Vec<_>>().join(" | "),
               [str_of(&f["brand"]), str_of(&f["model"])].into_iter().filter(|x| !x.is_empty()).collect::<Vec<_>>().join(" ")]
        .into_iter().filter(|x| !x.is_empty()).collect::<Vec<_>>().join(" - ");
    for (i, it) in items.iter().enumerate() {
        let name = it["name"].as_str().unwrap_or("foto.jpg").to_string();
        let _ = app.emit("forum-share", json!({ "i": i, "total": total, "msg": format!("Yükleniyor: {name}") }));
        let b = source_bytes(&it["src"], &name).await?;
        let r = match drivenet::forum::upload(&base, &tok, b.clone(), &name, &wm).await {
            Err(e) if e == "TOO_LARGE" => {
                let s = shrunk(b, 3840, 92, "up").await;
                drivenet::forum::upload(&base, &tok, s, &name, &wm).await.map_err(|e| if e == "TOO_LARGE" { "Görsel forumun boyut sınırını aşıyor".to_string() } else { e })?
            }
            r => r?,
        };
        codes.push(set_alt(r["bbcode"].as_str().unwrap_or(""), &alt));
    }
    let k = kunye(f, req["theme"].as_str().unwrap_or(""));
    let content = format!("{}{}\n", codes.join("\n"), if k.is_empty() { String::new() } else { format!("\n{k}") });
    let _ = app.emit("forum-share", json!({ "i": total, "total": total, "msg": "Mesaj gönderiliyor…" }));
    let created = drivenet::forum::call(&base, &tok, "POST", "/api/posts", Some(json!({ "data": { "type": "posts", "attributes": { "content": content },
        "relationships": { "discussion": { "data": { "type": "discussions", "id": topic } } } } }))).await?;
    let number = created["data"]["attributes"]["number"].as_i64();
    let _ = drivenet::forum::call(&base, &tok, "POST", "/api/framio-assistant/learn", Some(json!({ "plate": f["plate"], "brand": f["brand"], "model": f["model"], "company": f["company"], "discussion_id": topic }))).await;
    let url = format!("{base}/d/{topic}{}", number.map(|n| format!("/{n}")).unwrap_or_default());
    Ok(json!({ "url": url, "count": total }))
}

/// Önizleme küçük resmi (data URL, ~320 px)
#[tauri::command]
pub async fn forum_thumb(src: Value, name: String) -> Result<String, String> {
    let b = source_bytes(&src, &name).await?;
    let small = shrunk(b, 320, 75, "th").await;
    Ok(format!("data:image/jpeg;base64,{}", base64::engine::general_purpose::STANDARD.encode(small)))
}
