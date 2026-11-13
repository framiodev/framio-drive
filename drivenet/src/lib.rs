//! Drive API istemcisi. NOT: Bu sandbox'ta crates.io erişimi olmadığı için DERLENMEDİ/TESTLENMEDİ.
//! Kendi bilgisayarında `cargo build` ile derleyip hataları bana ilet.
use drivecore::upload::{next_chunk, parse_confirmed, DEFAULT_CHUNK};
pub mod auth;
use serde::Deserialize;

const API: &str = "https://www.googleapis.com/drive/v3";
const UPLOAD: &str = "https://www.googleapis.com/upload/drive/v3/files";

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DriveFile {
    pub id: String,
    pub name: String,
    pub mime_type: String,
    #[serde(default)] pub size: Option<String>,
    #[serde(default)] pub md5_checksum: Option<String>,
    #[serde(default)] pub modified_time: Option<String>,
    /// Drive'ın hazır küçük resmi (thumbnail sağlayıcısı için).
    #[serde(default)] pub thumbnail_link: Option<String>,
    #[serde(default)] pub parents: Vec<String>,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ChangeFile {
    pub id: String,
    pub name: String,
    pub mime_type: String,
    #[serde(default)] pub trashed: bool,
    #[serde(default)] pub size: Option<String>,
    #[serde(default)] pub md5_checksum: Option<String>,
    #[serde(default)] pub parents: Vec<String>,
}
#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Change {
    #[serde(default)] pub removed: bool,
    pub file_id: String,
    #[serde(default)] pub file: Option<ChangeFile>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChangeList { #[serde(default)] changes: Vec<Change>, next_page_token: Option<String>, new_start_page_token: Option<String> }

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct FileList { files: Vec<DriveFile>, next_page_token: Option<String> }

/// Dosya adından MIME türü tahmini (yükleme sırasında Drive'ın doğru küçük resim üretmesi için).
pub fn mime_for(name: &str) -> &'static str {
    match name.rsplit('.').next().map(|e| e.to_ascii_lowercase()).as_deref() {
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("png") => "image/png",
        Some("gif") => "image/gif",
        Some("webp") => "image/webp",
        Some("heic") => "image/heic",
        Some("tif") | Some("tiff") => "image/tiff",
        Some("mp4") => "video/mp4",
        Some("mov") => "video/quicktime",
        Some("pdf") => "application/pdf",
        Some("txt") => "text/plain",
        Some("zip") => "application/zip",
        _ => "application/octet-stream",
    }
}

pub struct Drive { http: reqwest::Client, token: String }

#[derive(Debug)]
pub enum Error { Http(reqwest::Error), Status(u16, String), Protocol(&'static str) }
impl From<reqwest::Error> for Error { fn from(e: reqwest::Error) -> Self { Error::Http(e) } }

impl Drive {
    pub fn new(access_token: String) -> Self { Drive { http: reqwest::Client::new(), token: access_token } }

    /// Bir klasörün çocukları (sayfalama dahil).
    pub async fn list_children(&self, folder_id: &str) -> Result<Vec<DriveFile>, Error> {
        let mut out = vec![]; let mut page: Option<String> = None;
        loop {
            let mut req = self.http.get(format!("{API}/files")).bearer_auth(&self.token).query(&[
                ("q", format!("'{folder_id}' in parents and trashed=false")),
                ("fields", "nextPageToken,files(id,name,mimeType,size,md5Checksum,modifiedTime,thumbnailLink,parents)".into()),
                ("pageSize", "1000".into()),
            ]);
            if let Some(p) = &page { req = req.query(&[("pageToken", p)]); }
            let r = req.send().await?;
            if !r.status().is_success() { return Err(Error::Status(r.status().as_u16(), r.text().await?)); }
            let l: FileList = r.json().await?;
            out.extend(l.files); page = l.next_page_token;
            if page.is_none() { return Ok(out); }
        }
    }

    /// Ada göre arama (çöpteki dosyalar hariç, ilk 100 sonuç).
    pub async fn search(&self, text: &str) -> Result<Vec<DriveFile>, Error> {
        let esc = text.replace('\\', "\\\\").replace('\'', "\\'");
        let r = self.http.get(format!("{API}/files")).bearer_auth(&self.token).query(&[
            ("q", format!("name contains '{esc}' and trashed=false")),
            ("fields", "files(id,name,mimeType,size,md5Checksum,modifiedTime,thumbnailLink,parents)".to_string()),
            ("pageSize", "100".to_string()),
        ]).send().await?;
        if !r.status().is_success() { return Err(Error::Status(r.status().as_u16(), r.text().await?)); }
        let l: FileList = r.json().await?;
        Ok(l.files)
    }

    /// Değişiklik akışının başlangıç işareti (bundan sonrası "yeni" sayılır).
    pub async fn changes_start_token(&self) -> Result<String, Error> {
        let r = self.http.get(format!("{API}/changes/startPageToken")).bearer_auth(&self.token).send().await?;
        if !r.status().is_success() { return Err(Error::Status(r.status().as_u16(), r.text().await?)); }
        let v: serde_json::Value = r.json().await?;
        v["startPageToken"].as_str().map(String::from).ok_or(Error::Protocol("startPageToken yok"))
    }

    /// `token`'dan beri olan değişiklikler ve bir sonraki işaret.
    pub async fn changes_since(&self, token: &str) -> Result<(Vec<Change>, String), Error> {
        let mut out = vec![]; let mut page = token.to_string();
        loop {
            let r = self.http.get(format!("{API}/changes")).bearer_auth(&self.token).query(&[
                ("pageToken", page.as_str()), ("pageSize", "500"), ("includeRemoved", "true"), ("spaces", "drive"),
                ("fields", "nextPageToken,newStartPageToken,changes(removed,fileId,file(id,name,mimeType,trashed,size,md5Checksum,parents))"),
            ]).send().await?;
            if !r.status().is_success() { return Err(Error::Status(r.status().as_u16(), r.text().await?)); }
            let l: ChangeList = r.json().await?;
            out.extend(l.changes);
            match (l.next_page_token, l.new_start_page_token) {
                (Some(n), _) => page = n,
                (None, Some(n)) => return Ok((out, n)),
                _ => return Err(Error::Protocol("changes: sayfa belirteci yok")),
            }
        }
    }

    /// Depolama kotası: (toplam sınır, kullanılan). Sınırsız hesaplarda sınır `None` döner.
    pub async fn storage_quota(&self) -> Result<(Option<u64>, u64), Error> {
        let r = self.http.get(format!("{API}/about")).bearer_auth(&self.token)
            .query(&[("fields", "storageQuota(limit,usage)")]).send().await?;
        if !r.status().is_success() { return Err(Error::Status(r.status().as_u16(), r.text().await?)); }
        let v: serde_json::Value = r.json().await?;
        let q = &v["storageQuota"];
        let limit = q["limit"].as_str().and_then(|x| x.parse::<u64>().ok());
        let usage = q["usage"].as_str().and_then(|x| x.parse::<u64>().ok()).unwrap_or(0);
        Ok((limit, usage))
    }

    /// Dosyanın [start, end] (end dahil) bayt aralığını bellekte okur (sanal sürücü için).
    pub async fn read_range(&self, id: &str, start: u64, end: u64) -> Result<Vec<u8>, Error> {
        let r = self.http.get(format!("{API}/files/{id}")).bearer_auth(&self.token)
            .query(&[("alt", "media")])
            .header("Range", format!("bytes={start}-{end}")).send().await?;
        match r.status().as_u16() {
            206 => Ok(r.bytes().await?.to_vec()),
            200 => {
                // Sunucu Range'i yok saydı: tamamını alıp dilimle.
                let all = r.bytes().await?;
                let s = (start as usize).min(all.len());
                let e = ((end as usize).saturating_add(1)).min(all.len());
                Ok(all[s..e].to_vec())
            }
            416 => Ok(Vec::new()),
            s => Err(Error::Status(s, r.text().await?)),
        }
    }

    /// Dosya içeriğini diske indirir (Range desteği sonraya).
    pub async fn download(&self, id: &str, dest: &std::path::Path) -> Result<(), Error> {
        use tokio::io::AsyncWriteExt;
        let mut r = self.http.get(format!("{API}/files/{id}")).bearer_auth(&self.token).query(&[("alt", "media")]).send().await?;
        if !r.status().is_success() { return Err(Error::Status(r.status().as_u16(), r.text().await?)); }
        let mut f = tokio::fs::File::create(dest).await.map_err(|_| Error::Protocol("dosya oluşturulamadı"))?;
        while let Some(c) = r.chunk().await? { f.write_all(&c).await.map_err(|_| Error::Protocol("yazma hatası"))?; }
        f.flush().await.map_err(|_| Error::Protocol("flush hatası"))?;
        f.sync_all().await.map_err(|_| Error::Protocol("sync hatası"))?;
        Ok(())
    }

    /// Yükleme oturumu açar; dönen URL ile parça parça gönderilir (kesilince aynı URL'den devam).
    pub async fn start_upload(&self, name: &str, parent: &str, total: u64) -> Result<String, Error> {
        let mime = mime_for(name);
        let meta = serde_json::json!({ "name": name, "parents": [parent], "mimeType": mime });
        let r = self.http.post(UPLOAD).bearer_auth(&self.token)
            .query(&[("uploadType", "resumable")])
            .header("X-Upload-Content-Length", total.to_string())
            .header("X-Upload-Content-Type", mime)
            .json(&meta).send().await?;
        if !r.status().is_success() { return Err(Error::Status(r.status().as_u16(), r.text().await?)); }
        r.headers().get("location").and_then(|v| v.to_str().ok()).map(String::from).ok_or(Error::Protocol("Location yok"))
    }

    /// Var olan dosyanın içeriğini değiştirmek için yükleme oturumu açar (Drive eski sürümü sürüm geçmişinde tutar).
    pub async fn start_update(&self, id: &str, total: u64) -> Result<String, Error> {
        let r = self.http.patch(format!("{UPLOAD}/{id}")).bearer_auth(&self.token)
            .query(&[("uploadType", "resumable")])
            .header("X-Upload-Content-Length", total.to_string())
            .json(&serde_json::json!({})).send().await?;
        if !r.status().is_success() { return Err(Error::Status(r.status().as_u16(), r.text().await?)); }
        r.headers().get("location").and_then(|v| v.to_str().ok()).map(String::from).ok_or(Error::Protocol("Location yok"))
    }

    /// Drive'da klasör oluşturur; kimliğini döndürür.
    pub async fn create_folder(&self, name: &str, parent: &str) -> Result<String, Error> {
        let meta = serde_json::json!({ "name": name, "parents": [parent], "mimeType": "application/vnd.google-apps.folder" });
        let r = self.http.post(format!("{API}/files")).bearer_auth(&self.token).query(&[("fields", "id")]).json(&meta).send().await?;
        if !r.status().is_success() { return Err(Error::Status(r.status().as_u16(), r.text().await?)); }
        let v: serde_json::Value = r.json().await?;
        v["id"].as_str().map(String::from).ok_or(Error::Protocol("id yok"))
    }

    /// Verilen türde (ör. Google Doc/Sheet) boş bir öğe oluşturur; kimliğini döndürür.
    pub async fn create_item(&self, name: &str, parent: &str, mime: &str) -> Result<String, Error> {
        let meta = serde_json::json!({ "name": name, "parents": [parent], "mimeType": mime });
        let r = self.http.post(format!("{API}/files")).bearer_auth(&self.token).query(&[("fields", "id")]).json(&meta).send().await?;
        if !r.status().is_success() { return Err(Error::Status(r.status().as_u16(), r.text().await?)); }
        let v: serde_json::Value = r.json().await?;
        v["id"].as_str().map(String::from).ok_or(Error::Protocol("id yok"))
    }

    /// Dosya/klasörü Drive çöpüne atar (30 gün geri alınabilir). Zaten yoksa (404) başarı sayılır.
    pub async fn trash(&self, id: &str) -> Result<(), Error> {
        let r = self.http.patch(format!("{API}/files/{id}")).bearer_auth(&self.token)
            .json(&serde_json::json!({ "trashed": true })).send().await?;
        match r.status().as_u16() {
            200..=299 | 404 => Ok(()),
            s => Err(Error::Status(s, r.text().await?)),
        }
    }

    /// Adı değiştirir ve gerekirse başka klasöre taşır.
    pub async fn move_rename(&self, id: &str, new_name: &str, new_parent: &str) -> Result<(), Error> {
        let cur = self.file_meta(id).await?;
        let mut req = self.http.patch(format!("{API}/files/{id}")).bearer_auth(&self.token);
        if let Some(old) = cur.parents.first() {
            if old != new_parent { req = req.query(&[("addParents", new_parent), ("removeParents", old.as_str())]); }
        }
        let r = req.json(&serde_json::json!({ "name": new_name })).send().await?;
        if !r.status().is_success() { return Err(Error::Status(r.status().as_u16(), r.text().await?)); }
        Ok(())
    }

    /// Tek dosyanın üst verisi (md5, boyut, değişim zamanı).
    pub async fn file_meta(&self, id: &str) -> Result<DriveFile, Error> {
        let r = self.http.get(format!("{API}/files/{id}")).bearer_auth(&self.token)
            .query(&[("fields", "id,name,mimeType,size,md5Checksum,modifiedTime,thumbnailLink,parents")]).send().await?;
        if !r.status().is_success() { return Err(Error::Status(r.status().as_u16(), r.text().await?)); }
        Ok(r.json().await?)
    }

    /// Oturumda sunucunun kaç bayt aldığını sorar (kesintiden sonra devam için).
    pub async fn query_confirmed(&self, session: &str, total: u64) -> Result<u64, Error> {
        let r = self.http.put(session).header("Content-Range", format!("bytes */{total}")).header("Content-Length", "0").send().await?;
        match r.status().as_u16() {
            308 => parse_confirmed(r.headers().get("range").and_then(|v| v.to_str().ok())).ok_or(Error::Protocol("Range okunamadı")),
            200 | 201 => Ok(total),
            s => Err(Error::Status(s, r.text().await?)),
        }
    }

    /// Dosyayı kaldığı yerden parça parça yükler. `on_progress(onaylanan_bayt)` kuyruğa ilerleme bildirir.
    pub async fn upload_file(&self, session: &str, path: &std::path::Path, mut on_progress: impl FnMut(u64)) -> Result<Option<String>, Error> {
        use tokio::io::{AsyncReadExt, AsyncSeekExt};
        let total = tokio::fs::metadata(path).await.map_err(|_| Error::Protocol("dosya yok"))?.len();
        let id_of = |v: &serde_json::Value| v["id"].as_str().map(String::from);
        if total == 0 {
            let r = self.http.put(session).header("Content-Length", "0").send().await?;
            return match r.status().as_u16() {
                200 | 201 => Ok(id_of(&r.json::<serde_json::Value>().await?)),
                s => Err(Error::Status(s, r.text().await?)),
            };
        }
        let mut confirmed = self.query_confirmed(session, total).await?;
        let mut f = tokio::fs::File::open(path).await.map_err(|_| Error::Protocol("açılamadı"))?;
        let mut file_id = None;
        while let Some(c) = next_chunk(total, confirmed, DEFAULT_CHUNK) {
            f.seek(std::io::SeekFrom::Start(c.start)).await.map_err(|_| Error::Protocol("seek"))?;
            let mut buf = vec![0u8; c.len() as usize];
            f.read_exact(&mut buf).await.map_err(|_| Error::Protocol("okuma"))?;
            let r = self.http.put(session).header("Content-Range", c.content_range()).body(buf).send().await?;
            match r.status().as_u16() {
                308 => confirmed = parse_confirmed(r.headers().get("range").and_then(|v| v.to_str().ok())).ok_or(Error::Protocol("Range"))?,
                200 | 201 => { confirmed = total; file_id = id_of(&r.json::<serde_json::Value>().await?); }
                s => return Err(Error::Status(s, r.text().await?)),
            }
            on_progress(confirmed);
        }
        Ok(file_id)
    }
}
