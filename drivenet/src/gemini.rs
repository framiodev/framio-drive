//! Gemini API istemcisi (görselden yapılandırılmış bilgi okuma). Anahtar Windows Kimlik Bilgisi Yöneticisi'nde saklanır.
use serde_json::{json, Value};
use std::time::Duration;

const SERVICE: &str = "framio-drive";
const ACCOUNT: &str = "gemini-api-key";

pub fn save_key(k: &str) -> Result<(), String> {
    keyring::Entry::new(SERVICE, ACCOUNT).map_err(|e| e.to_string())?.set_password(k).map_err(|e| e.to_string())
}
pub fn load_key() -> Option<String> {
    keyring::Entry::new(SERVICE, ACCOUNT).ok()?.get_password().ok().filter(|k| !k.trim().is_empty())
}
pub fn clear_key() {
    if let Ok(e) = keyring::Entry::new(SERVICE, ACCOUNT) { let _ = e.delete_credential(); }
}

/// Emekliye ayrılan/eski nesil (1.x, 2.x) ya da boş model adı mı? Öyleyse güncel olanla değiştirilir.
pub fn is_retired(m: &str) -> bool {
    let m = m.trim();
    m.is_empty() || m.starts_with("gemini-1.") || m.starts_with("gemini-2.")
}

/// Anahtarın erişebildiği, metin üretebilen Gemini modelleri: (kimlik, görünen ad). Yeniler başta.
pub async fn list_models(key: &str) -> Result<Vec<(String, String)>, String> {
    let r = reqwest::Client::new().get("https://generativelanguage.googleapis.com/v1beta/models")
        .query(&[("pageSize", "1000")]).header("x-goog-api-key", key).timeout(Duration::from_secs(15))
        .send().await.map_err(|e| format!("Model listesi alınamadı: {e}"))?;
    let code = r.status();
    if !code.is_success() { return Err(format!("Model listesi alınamadı ({code}); anahtarı kontrol et")); }
    let v: Value = r.json().await.map_err(|e| e.to_string())?;
    const SKIP: &[&str] = &["image", "tts", "embedding", "live", "audio", "robotics", "computer", "vision", "imagen", "native"];
    let mut out: Vec<(String, String)> = v["models"].as_array().map(|a| a.iter().filter_map(|m| {
        let id = m["name"].as_str()?.trim_start_matches("models/").to_string();
        let ok = id.starts_with("gemini-") && m["supportedGenerationMethods"].as_array().map(|x| x.iter().any(|y| y == "generateContent")).unwrap_or(false);
        if !ok || SKIP.iter().any(|k| id.contains(k)) { return None; }
        Some((id, m["displayName"].as_str().unwrap_or("").to_string()))
    }).collect()).unwrap_or_default();
    out.sort_by(|a, b| b.0.cmp(&a.0));
    Ok(out)
}

/// Listeden en yeni kararlı Flash'ı seçer (önizleme/lite/deneysel hariç); yoksa "latest" takma adı.
pub fn pick_default(ids: &[String]) -> String {
    let mut best: Option<(f32, &String)> = None;
    for id in ids {
        if id.contains("lite") || id.contains("preview") || id.contains("exp") { continue; }
        let Some(mid) = id.strip_prefix("gemini-").and_then(|r| r.strip_suffix("-flash")) else { continue };
        let Ok(ver) = mid.parse::<f32>() else { continue };
        if best.map(|b| ver > b.0).unwrap_or(true) { best = Some((ver, id)); }
    }
    if let Some((_, id)) = best { return id.clone(); }
    if ids.iter().any(|i| i == "gemini-flash-latest") { return "gemini-flash-latest".into(); }
    ids.iter().find(|i| i.contains("flash")).cloned().unwrap_or_else(|| "gemini-flash-latest".into())
}

/// Kayıtlı model güncelse onu, değilse anahtarın erişebildiği en yeni Flash'ı döndürür.
pub async fn resolve_model(key: &str, saved: &str) -> String {
    if !is_retired(saved) { return saved.trim().to_string(); }
    match list_models(key).await { Ok(l) if !l.is_empty() => pick_default(&l.into_iter().map(|x| x.0).collect::<Vec<_>>()), _ => "gemini-flash-latest".into() }
}

/// Görseli verilen istemle inceler; `fields` (anahtar, açıklama) için metin alanları + güven + not içeren JSON döndürür.
/// 429/503 yanıtlarında bekleyip yeniden dener.
pub async fn analyze(key: &str, model: &str, prompt: &str, fields: &[(String, String)], mime: &str, b64: &str) -> Result<Value, String> {
    let mut props = serde_json::Map::new();
    for (k, d) in fields { props.insert(k.clone(), json!({ "type": "STRING", "description": d })); }
    props.insert("guven".into(), json!({ "type": "NUMBER", "description": "Genel güven, 0 ile 1 arası" }));
    props.insert("not".into(), json!({ "type": "STRING", "description": "Belirsizlikler için kısa not" }));
    let body = json!({
        "contents": [{ "parts": [ { "text": prompt }, { "inline_data": { "mime_type": mime, "data": b64 } } ] }],
        "generationConfig": { "responseMimeType": "application/json", "responseSchema": { "type": "OBJECT", "properties": props }, "temperature": 0.1 }
    });
    let url = format!("https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent");
    let client = reqwest::Client::new();
    for attempt in 0..5u64 {
        let r = client.post(&url).header("x-goog-api-key", key).json(&body).send().await.map_err(|e| e.to_string())?;
        let st = r.status().as_u16();
        if st == 429 || st == 503 { tokio::time::sleep(Duration::from_secs(20 * (attempt + 1))).await; continue; }
        let v: Value = r.json().await.map_err(|e| e.to_string())?;
        if !(200..300).contains(&st) { return Err(format!("Gemini hatası {st}: {}", v["error"]["message"].as_str().unwrap_or(""))); }
        let t = v["candidates"][0]["content"]["parts"][0]["text"].as_str().ok_or("Gemini boş yanıt verdi (içerik engellenmiş olabilir)")?;
        return serde_json::from_str(t).map_err(|e| format!("yanıt çözülemedi: {e}"));
    }
    Err("Gemini kotası doldu (429); birkaç dakika sonra tekrar dene".into())
}


/// Ham generateContent çağrısı (sesli asistan): gövdeyi olduğu gibi gönderir, tüm yanıtı döndürür.
/// 429/503 yanıtlarında bekleyip yeniden dener.
/// Hata zincirini ("üst hata › neden › neden") okunur bir metne çevirir ve türünü ipucuyla belirtir.
pub fn net_err(e: &reqwest::Error) -> String {
    let mut s = e.to_string();
    let mut src = std::error::Error::source(e);
    while let Some(c) = src { s.push_str(&format!(" › {c}")); src = c.source(); }
    let hint = if e.is_timeout() { "zaman aşımı" } else if e.is_connect() { "bağlantı kurulamadı (internet, VPN, güvenlik duvarı ya da antivirüs engelliyor olabilir)" } else { "istek gönderilemedi" };
    format!("{hint}: {s}")
}

pub async fn generate(key: &str, model: &str, body: &Value) -> Result<Value, String> {
    let url = format!("https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent");
    // HTTP/1.1 + bağlantı havuzsuz: bayat/yarım kalmış bağlantılardan kaynaklanan "istek gönderilemedi" hatalarını önler
    let client = reqwest::Client::builder().connect_timeout(Duration::from_secs(10)).timeout(Duration::from_secs(45))
        .http1_only().pool_max_idle_per_host(0).build().map_err(|e| e.to_string())?;
    let mut last = String::new();
    for i in 0..3u64 {
        let r = match client.post(&url).header("x-goog-api-key", key).json(body).send().await {
            Ok(r) => r,
            Err(e) => { last = format!("Gemini'ye bağlanılamadı — {}", net_err(&e)); if i < 2 { tokio::time::sleep(Duration::from_secs(1 + i)).await; continue; } return Err(last); }
        };
        let st = r.status().as_u16();
        let v: Value = r.json().await.map_err(|e| format!("Gemini yanıtı okunamadı: {e}"))?;
        if (200..300).contains(&st) { return Ok(v); }
        last = format!("Gemini hatası {st}: {}", v["error"]["message"].as_str().unwrap_or(""));
        if (st == 429 || st == 503) && i < 2 { tokio::time::sleep(Duration::from_secs(2 + i * 2)).await; continue; }
        return Err(last);
    }
    Err(last)
}

/// Canlı (çift yönlü ses) konuşmayı destekleyen modeller. En yeni sürüm, eşitse önizleme olmayan seçilir.
pub async fn pick_live_model(key: &str) -> Result<String, String> {
    let r = reqwest::Client::builder().http1_only().build().map_err(|e| e.to_string())?
        .get("https://generativelanguage.googleapis.com/v1beta/models").query(&[("pageSize", "1000")])
        .header("x-goog-api-key", key).timeout(Duration::from_secs(20)).send().await.map_err(|e| format!("Model listesi alınamadı — {}", net_err(&e)))?;
    if !r.status().is_success() { return Err(format!("Model listesi alınamadı ({})", r.status())); }
    let v: Value = r.json().await.map_err(|e| e.to_string())?;
    let ver = |id: &str| -> f32 {
        let b = id.as_bytes(); let mut i = 0;
        while i + 2 < b.len() { if b[i].is_ascii_digit() && b[i + 1] == b'.' && b[i + 2].is_ascii_digit() { let mut j = i + 3; while j < b.len() && b[j].is_ascii_digit() { j += 1; } return id[i..j].parse().unwrap_or(0.0); } i += 1; }
        0.0
    };
    let mut ids: Vec<String> = v["models"].as_array().map(|a| a.iter().filter_map(|m| {
        let id = m["name"].as_str()?.trim_start_matches("models/").to_string();
        let ok = id.starts_with("gemini-") && m["supportedGenerationMethods"].as_array().map(|x| x.iter().any(|y| y == "bidiGenerateContent")).unwrap_or(false);
        if ok { Some(id) } else { None }
    }).collect()).unwrap_or_default();
    ids.sort_by(|a, b| ver(b).partial_cmp(&ver(a)).unwrap_or(std::cmp::Ordering::Equal).then(a.contains("preview").cmp(&b.contains("preview"))));
    ids.into_iter().next().ok_or_else(|| "Bu anahtar hiçbir canlı (Live) modele erişemiyor".to_string())
}

/// Bağlantı tanısı: model listesi (GET), küçük istek (POST) ve ~700 KB'lık ses gövdeli istek (POST); süre ve hata zinciriyle.
pub async fn diag(key: &str, model: &str) -> Value {
    use std::time::Instant;
    let client = match reqwest::Client::builder().connect_timeout(Duration::from_secs(10)).timeout(Duration::from_secs(40)).http1_only().pool_max_idle_per_host(0).build() {
        Ok(c) => c, Err(e) => return json!({ "hata": e.to_string() }),
    };
    async fn run(label: &str, rb: reqwest::RequestBuilder) -> Value {
        let t = Instant::now();
        match rb.send().await {
            Ok(r) => { let st = r.status().as_u16(); let b = r.text().await.unwrap_or_default();
                let msg = serde_json::from_str::<Value>(&b).ok().and_then(|v| v["error"]["message"].as_str().map(String::from)).unwrap_or_default();
                json!({ "ad": label, "ok": (200..300).contains(&st), "durum": st, "ms": t.elapsed().as_millis() as u64, "mesaj": msg }) }
            Err(e) => json!({ "ad": label, "ok": false, "ms": t.elapsed().as_millis() as u64, "mesaj": net_err(&e) }),
        }
    }
    let base = "https://generativelanguage.googleapis.com/v1beta";
    let url = format!("{base}/models/{model}:generateContent");
    let small = json!({ "contents": [{ "role": "user", "parts": [{ "text": "Sadece 'tamam' yaz." }] }] });
    // 22 sn sessiz 16 kHz WAV ≈ 700 KB → base64 ≈ 940 KB
    let n = 16000usize * 22; let data = (n * 2) as u32;
    let mut wav = Vec::with_capacity(44 + n * 2);
    wav.extend_from_slice(b"RIFF"); wav.extend_from_slice(&(36 + data).to_le_bytes()); wav.extend_from_slice(b"WAVEfmt ");
    for x in [16u32.to_le_bytes().to_vec(), 1u16.to_le_bytes().to_vec(), 1u16.to_le_bytes().to_vec(), 16000u32.to_le_bytes().to_vec(), 32000u32.to_le_bytes().to_vec(), 2u16.to_le_bytes().to_vec(), 16u16.to_le_bytes().to_vec()] { wav.extend_from_slice(&x); }
    wav.extend_from_slice(b"data"); wav.extend_from_slice(&data.to_le_bytes()); wav.extend(std::iter::repeat(0u8).take(n * 2));
    let big = json!({ "contents": [{ "role": "user", "parts": [{ "text": "Bu kayıtta konuşma var mı? Sadece 'yok' ya da 'var' yaz." }, { "inline_data": { "mime_type": "audio/wav", "data": base64_std(&wav) } }] }] });
    let r1 = run("Model listesi (GET)", client.get(format!("{base}/models")).query(&[("pageSize", "5")]).header("x-goog-api-key", key)).await;
    let r2 = run(&format!("Küçük istek (POST, {model})"), client.post(&url).header("x-goog-api-key", key).json(&small)).await;
    let r3 = run("Büyük ses isteği (POST, ~0,9 MB)", client.post(&url).header("x-goog-api-key", key).json(&big)).await;
    json!({ "model": model, "adimlar": [r1, r2, r3] })
}

fn base64_std(b: &[u8]) -> String {
    const T: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut o = String::with_capacity(b.len() / 3 * 4 + 4);
    for c in b.chunks(3) {
        let n = (c[0] as u32) << 16 | (*c.get(1).unwrap_or(&0) as u32) << 8 | *c.get(2).unwrap_or(&0) as u32;
        o.push(T[(n >> 18) as usize & 63] as char); o.push(T[(n >> 12) as usize & 63] as char);
        o.push(if c.len() > 1 { T[(n >> 6) as usize & 63] as char } else { '=' }); o.push(if c.len() > 2 { T[n as usize & 63] as char } else { '=' });
    }
    o
}
