//! Forumda paylaş: forum profilleri, giriş ve forum bilgisi komutları.
use crate::{data_dir};
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
