//! Google OAuth (masaüstü, loopback + PKCE). Refresh token Windows Kimlik Bilgisi Yöneticisi'nde saklanır.
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::io::{Read, Write};
use std::net::TcpListener;

const AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const SCOPE: &str = "https://www.googleapis.com/auth/drive";
const SERVICE: &str = "framio-drive";

#[derive(Clone)]
pub struct Client { pub id: String, pub secret: String }

impl Client {
    /// Client ID/Secret ortam değişkenlerinden okunur; koda veya repoya yazılmaz.
    pub fn from_env() -> Result<Self, String> {
        let g = |k: &str| std::env::var(k).map_err(|_| format!("{k} ortam değişkeni tanımlı değil"));
        Ok(Client { id: g("DRIVE_CLIENT_ID")?, secret: g("DRIVE_CLIENT_SECRET")? })
    }
}

fn client_file() -> Result<std::path::PathBuf, String> {
    let base = std::env::var("APPDATA").map_err(|_| "APPDATA yok".to_string())?;
    let dir = std::path::Path::new(&base).join("FramioDrive");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("client.json"))
}

impl Client {
    /// Önce ortam değişkenleri, yoksa %APPDATA%\FramioDrive\client.json (uygulamadaki kurulum ekranı yazar).
    pub fn load() -> Result<Self, String> {
        if let Ok(c) = Self::from_env() { return Ok(c); }
        if let Ok(t) = std::fs::read_to_string(client_file()?) {
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&t) {
                let (id, secret) = (v["id"].as_str().unwrap_or(""), v["secret"].as_str().unwrap_or(""));
                if !id.is_empty() && !secret.is_empty() { return Ok(Client { id: id.into(), secret: secret.into() }); }
            }
        }
        // Derleme sırasında DRIVE_CLIENT_ID / DRIVE_CLIENT_SECRET tanımlıysa exe'ye gömülür (masaüstü uygulamalarında bu gizli sayılmaz).
        if let (Some(id), Some(secret)) = (option_env!("DRIVE_CLIENT_ID"), option_env!("DRIVE_CLIENT_SECRET")) {
            if !id.is_empty() && !secret.is_empty() { return Ok(Client { id: id.into(), secret: secret.into() }); }
        }
        let t = std::fs::read_to_string(client_file()?).map_err(|_| "Google istemci bilgileri henüz girilmemiş".to_string())?;
        let v: serde_json::Value = serde_json::from_str(&t).map_err(|e| e.to_string())?;
        let id = v["id"].as_str().unwrap_or("").to_string();
        let secret = v["secret"].as_str().unwrap_or("").to_string();
        if id.is_empty() || secret.is_empty() { return Err("Google istemci bilgileri eksik".into()); }
        Ok(Client { id, secret })
    }
    pub fn save(id: &str, secret: &str) -> Result<(), String> {
        let v = serde_json::json!({ "id": id.trim(), "secret": secret.trim() });
        std::fs::write(client_file()?, v.to_string()).map_err(|e| e.to_string())
    }
}

#[derive(Deserialize)]
struct TokenResp { access_token: String, #[serde(default)] refresh_token: Option<String> }

fn random_b64(n: usize) -> String {
    let mut b = vec![0u8; n];
    getrandom::getrandom(&mut b).expect("rastgele sayı alınamadı");
    URL_SAFE_NO_PAD.encode(b)
}

fn entry(account: &str) -> Result<keyring::Entry, String> {
    keyring::Entry::new(SERVICE, account).map_err(|e| format!("kimlik kasası: {e}"))
}

/// Tarayıcıyı açar, izin verilince hesabın refresh token'ını kasaya yazar.
pub async fn login(client: &Client) -> Result<String, String> {
    let listener = TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    let redirect = format!("http://127.0.0.1:{port}");
    let verifier = random_b64(32);
    let challenge = URL_SAFE_NO_PAD.encode(Sha256::digest(verifier.as_bytes()));
    let state = random_b64(16);

    let url = reqwest::Url::parse_with_params(AUTH_URL, &[
        ("client_id", client.id.as_str()), ("redirect_uri", redirect.as_str()),
        ("response_type", "code"), ("scope", SCOPE),
        ("code_challenge", challenge.as_str()), ("code_challenge_method", "S256"),
        ("access_type", "offline"), ("prompt", "select_account consent"), ("state", state.as_str()),
    ]).map_err(|e| e.to_string())?;

    println!("Tarayıcı açılıyor. Açılmazsa bu adresi elle aç:\n{url}\n");
    let _ = std::process::Command::new("rundll32").args(["url.dll,FileProtocolHandler", url.as_str()]).spawn();

    let (mut stream, _) = listener.accept().map_err(|e| e.to_string())?;
    let mut buf = [0u8; 4096];
    let n = stream.read(&mut buf).map_err(|e| e.to_string())?;
    let req = String::from_utf8_lossy(&buf[..n]);
    let path = req.lines().next().and_then(|l| l.split_whitespace().nth(1)).ok_or("geçersiz istek")?;
    let parsed = reqwest::Url::parse(&format!("http://127.0.0.1{path}")).map_err(|e| e.to_string())?;
    let q: std::collections::HashMap<_, _> = parsed.query_pairs().into_owned().collect();
    let body = "<html><body style='font-family:sans-serif'><h3>Giriş tamam, bu sekmeyi kapatabilirsin.</h3></body></html>";
    let _ = stream.write_all(format!("HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\n\r\n{body}", body.len()).as_bytes());

    if q.get("state") != Some(&state) { return Err("state uyuşmadı (olası sahte istek)".into()); }
    let code = q.get("code").ok_or_else(|| format!("izin verilmedi: {:?}", q.get("error")))?;

    let r = reqwest::Client::new().post(TOKEN_URL).form(&[
        ("code", code.as_str()), ("client_id", &client.id), ("client_secret", &client.secret),
        ("redirect_uri", redirect.as_str()), ("grant_type", "authorization_code"), ("code_verifier", verifier.as_str()),
    ]).send().await.map_err(|e| e.to_string())?;
    if !r.status().is_success() { return Err(format!("token alınamadı: {}", r.text().await.unwrap_or_default())); }
    let t: TokenResp = r.json().await.map_err(|e| e.to_string())?;
    let rt = t.refresh_token.ok_or("refresh token gelmedi")?;
    let email = fetch_email(&t.access_token).await?;
    entry(&email)?.set_password(&rt).map_err(|e| format!("kasaya yazılamadı: {e}"))?;
    register_account(&email)?;
    Ok(email)
}

#[derive(Deserialize)]
struct About { user: AboutUser }
#[derive(Deserialize)]
struct AboutUser { #[serde(rename = "emailAddress")] email_address: String }

/// Hesabın e-posta adresini Drive'dan okur (ek izin gerektirmez). Sistemin iç kimliği budur.
async fn fetch_email(access_token: &str) -> Result<String, String> {
    let r = reqwest::Client::new().get("https://www.googleapis.com/drive/v3/about")
        .bearer_auth(access_token).query(&[("fields", "user(emailAddress)")])
        .send().await.map_err(|e| e.to_string())?;
    if !r.status().is_success() { return Err(format!("e-posta okunamadı: {}", r.text().await.unwrap_or_default())); }
    Ok(r.json::<About>().await.map_err(|e| e.to_string())?.user.email_address.to_lowercase())
}

fn accounts_file() -> Result<std::path::PathBuf, String> {
    let base = std::env::var("APPDATA").map_err(|_| "APPDATA yok".to_string())?;
    Ok(std::path::Path::new(&base).join("FramioDrive").join("accounts.txt"))
}

fn register_account(email: &str) -> Result<(), String> {
    let f = accounts_file()?;
    std::fs::create_dir_all(f.parent().unwrap()).map_err(|e| e.to_string())?;
    let mut list = accounts();
    if !list.iter().any(|a| a == email) {
        list.push(email.to_string());
        std::fs::write(&f, list.join("\n")).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Hesabı unutur: kasadaki token silinir, listeden çıkarılır.
pub fn forget(email: &str) -> Result<(), String> {
    if let Ok(e) = entry(email) { let _ = e.delete_credential(); }
    let f = accounts_file()?;
    let rest: Vec<String> = accounts().into_iter().filter(|a| a != email).collect();
    std::fs::write(&f, rest.join("\n")).map_err(|e| e.to_string())
}

/// Giriş yapılmış hesapların e-posta listesi (token'lar kasada, burada sadece adresler).
pub fn accounts() -> Vec<String> {
    accounts_file().ok().and_then(|f| std::fs::read_to_string(f).ok())
        .map(|t| t.lines().map(str::trim).filter(|l| !l.is_empty()).map(String::from).collect())
        .unwrap_or_default()
}

/// Kayıtlı refresh token ile kısa ömürlü access token alır.
pub async fn access_token(client: &Client, account: &str) -> Result<String, String> {
    let rt = entry(account)?.get_password().map_err(|_| format!("'{account}' için giriş yok; önce: drivecli login"))?;
    let r = reqwest::Client::new().post(TOKEN_URL).form(&[
        ("client_id", client.id.as_str()), ("client_secret", client.secret.as_str()),
        ("refresh_token", rt.as_str()), ("grant_type", "refresh_token"),
    ]).send().await.map_err(|e| e.to_string())?;
    if !r.status().is_success() { return Err(format!("yenileme başarısız: {}", r.text().await.unwrap_or_default())); }
    Ok(r.json::<TokenResp>().await.map_err(|e| e.to_string())?.access_token)
}
