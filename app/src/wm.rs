//! Filigran: kullanıcının kendi şeffaf PNG'sini görsellerin üstüne ekler. Orijinal dosyaya dokunulmaz;
//! filigranlı kopya, Drive'da aynı klasöre ayrı bir dosya olarak kaydedilir.
use super::*;
use base64::Engine as _;

pub fn ps_out(script: &str) -> String {
    use std::os::windows::process::CommandExt;
    std::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-STA", "-ExecutionPolicy", "Bypass", "-Command", script])
        .creation_flags(0x0800_0000)
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_default()
}

/// Yedek: %APPDATA%\FramioDrive\watermarks (kurulum klasörü silinse bile filigranlar kaybolmaz).
fn wm_backup() -> PathBuf {
    let d = data_dir().join("watermarks");
    let _ = std::fs::create_dir_all(&d);
    d
}

/// Ana klasör: uygulamanın kurulu olduğu dizinde `Filigranlar`; yazılamıyorsa yedek klasör kullanılır.
fn wm_dir() -> PathBuf {
    if let Some(p) = std::env::current_exe().ok().and_then(|e| e.parent().map(|d| d.join("Filigranlar"))) {
        if std::fs::create_dir_all(&p).is_ok() {
            let t = p.join(".yaz");
            if std::fs::write(&t, b"1").is_ok() {
                let _ = std::fs::remove_file(&t);
                return p;
            }
        }
    }
    wm_backup()
}

/// Göreli kimlik: "dosya.png" ya da "Klasör/dosya.png". Üst dizine çıkışa izin verilmez.
fn safe_rel(id: &str) -> Result<PathBuf, String> {
    if id.is_empty() || id.contains("..") || id.contains('\\') || id.contains(':') || id.starts_with('/') || id.matches('/').count() > 1 {
        return Err("Geçersiz yol".into());
    }
    Ok(PathBuf::from(id))
}
fn safe_name(n: &str) -> Result<String, String> {
    let c = clean_name(n.trim()).trim_matches('.').trim().to_string();
    if c.is_empty() { Err("Ad boş olamaz".into()) } else { Ok(c) }
}
fn roots() -> Vec<PathBuf> {
    let (a, b) = (wm_dir(), wm_backup());
    if a == b { vec![a] } else { vec![a, b] }
}
fn is_png(f: &str) -> bool { f.to_lowercase().ends_with(".png") }
fn uniq(dir: &Path, name: &str) -> String {
    if !dir.join(name).exists() { return name.to_string(); }
    let (stem, ext) = name.rsplit_once('.').map(|(a, b)| (a.to_string(), format!(".{b}"))).unwrap_or((name.to_string(), String::new()));
    for n in 2..1000 {
        let c = format!("{stem} ({n}){ext}");
        if !dir.join(&c).exists() { return c; }
    }
    name.to_string()
}
fn subdirs(d: &Path) -> Vec<String> {
    std::fs::read_dir(d).map(|rd| rd.flatten().filter(|e| e.path().is_dir()).map(|e| e.file_name().to_string_lossy().into_owned()).collect()).unwrap_or_default()
}
fn files_in(d: &Path) -> Vec<String> {
    std::fs::read_dir(d).map(|rd| rd.flatten().filter(|e| e.path().is_file()).map(|e| e.file_name().to_string_lossy().into_owned()).filter(|f| is_png(f)).collect()).unwrap_or_default()
}
fn count_all(d: &Path) -> usize { files_in(d).len() + subdirs(d).iter().map(|s| files_in(&d.join(s)).len()).sum::<usize>() }

fn copy_missing(from: &Path, to: &Path) {
    let _ = std::fs::create_dir_all(to);
    for f in files_in(from) { if !to.join(&f).exists() { let _ = std::fs::copy(from.join(&f), to.join(&f)); } }
    for d in subdirs(from) { copy_missing(&from.join(&d), &to.join(&d)); }
}

/// Eski sürümlerin zaman damgalı adlarını (123456789_ad.png) sadeleştirir.
fn strip_stamp(dir: &Path) {
    for f in files_in(dir) {
        if let Some((pre, rest)) = f.split_once('_') {
            if pre.len() >= 9 && pre.chars().all(|c| c.is_ascii_digit()) && !rest.is_empty() {
                let n = uniq(dir, rest);
                let _ = std::fs::rename(dir.join(&f), dir.join(n));
            }
        }
    }
}

/// Ana klasör boşsa yedekten geri yükler; ana klasördekileri yedeğe yansıtır.
fn wm_sync() {
    let (a, b) = (wm_dir(), wm_backup());
    for r in roots() { strip_stamp(&r); for d in subdirs(&r) { strip_stamp(&r.join(d)); } }
    if a == b { return; }
    if count_all(&a) == 0 { copy_missing(&b, &a); }
    copy_missing(&a, &b);
}

#[tauri::command]
pub fn wm_list() -> Value {
    wm_sync();
    let r = wm_dir();
    let mut items: Vec<Value> = vec![];
    let mut push = |folder: &str, f: &str| {
        let id = if folder.is_empty() { f.to_string() } else { format!("{folder}/{f}") };
        items.push(json!({ "id": id, "name": f.trim_end_matches(".png").trim_end_matches(".PNG"), "folder": folder }));
    };
    let mut root_files = files_in(&r); root_files.sort_by_key(|x| x.to_lowercase());
    for f in &root_files { push("", f); }
    let mut folders = subdirs(&r); folders.sort_by_key(|x| x.to_lowercase());
    for d in &folders {
        let mut fs = files_in(&r.join(d)); fs.sort_by_key(|x| x.to_lowercase());
        for f in &fs { push(d, f); }
    }
    json!({ "items": items, "folders": folders })
}

/// Cihazdan bir ya da birden çok şeffaf PNG seçtirir; `folder` klasörüne (boşsa ana klasöre) kopyalar.
#[tauri::command]
pub async fn wm_pick_many(folder: String) -> Result<Value, String> {
    let fol = if folder.is_empty() { String::new() } else { safe_name(&folder)? };
    tauri::async_runtime::spawn_blocking(move || {
        let out = ps_out("[Console]::OutputEncoding=[Text.Encoding]::UTF8; Add-Type -AssemblyName System.Windows.Forms; $f=New-Object System.Windows.Forms.Form -Property @{TopMost=$true}; $d=New-Object System.Windows.Forms.OpenFileDialog; $d.Filter='PNG (şeffaf arka plan)|*.png'; $d.Multiselect=$true; $d.Title='Filigran olarak kullanılacak PNG dosyalarını seç'; if($d.ShowDialog($f) -eq 'OK'){ $d.FileNames -join '|' }");
        if out.is_empty() { return Ok(json!([])); }
        let mut added = vec![];
        for p in out.split('|') {
            let src = PathBuf::from(p);
            let Some(fname) = src.file_name().map(|n| clean_name(&n.to_string_lossy())) else { continue };
            let dst_dir = if fol.is_empty() { wm_dir() } else { wm_dir().join(&fol) };
            let _ = std::fs::create_dir_all(&dst_dir);
            let name = uniq(&dst_dir, &fname);
            if std::fs::copy(&src, dst_dir.join(&name)).is_ok() {
                let bd = if fol.is_empty() { wm_backup() } else { wm_backup().join(&fol) };
                let _ = std::fs::create_dir_all(&bd);
                let _ = std::fs::copy(&src, bd.join(&name));
                added.push(if fol.is_empty() { name } else { format!("{fol}/{name}") });
            }
        }
        Ok(json!(added))
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn wm_rename(id: String, name: String) -> Result<String, String> {
    let rel = safe_rel(&id)?;
    let mut nn = safe_name(&name)?;
    if !is_png(&nn) { nn.push_str(".png"); }
    let folder = rel.parent().map(|p| p.to_string_lossy().into_owned()).unwrap_or_default();
    let primary = wm_dir().join(&folder);
    let nn = if primary.join(&nn).exists() && !primary.join(&nn).eq(&wm_dir().join(&rel)) { uniq(&primary, &nn) } else { nn };
    for r in roots() { let _ = std::fs::rename(r.join(&rel), r.join(&folder).join(&nn)); }
    Ok(if folder.is_empty() { nn } else { format!("{folder}/{nn}") })
}

#[tauri::command]
pub fn wm_move(ids: Vec<String>, folder: String) -> Result<(), String> {
    let fol = if folder.is_empty() { String::new() } else { safe_name(&folder)? };
    for id in ids {
        let rel = safe_rel(&id)?;
        let fname = rel.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
        let target = if fol.is_empty() { wm_dir() } else { wm_dir().join(&fol) };
        let _ = std::fs::create_dir_all(&target);
        let nn = uniq(&target, &fname);
        for r in roots() {
            let td = if fol.is_empty() { r.clone() } else { r.join(&fol) };
            let _ = std::fs::create_dir_all(&td);
            let _ = std::fs::rename(r.join(&rel), td.join(&nn));
        }
    }
    Ok(())
}

#[tauri::command]
pub fn wm_delete(ids: Vec<String>) -> Result<(), String> {
    for id in ids {
        let rel = safe_rel(&id)?;
        for r in roots() { let _ = std::fs::remove_file(r.join(&rel)); }
    }
    Ok(())
}

#[tauri::command]
pub fn wm_folder_new(name: String) -> Result<String, String> {
    let n = safe_name(&name)?;
    for r in roots() { std::fs::create_dir_all(r.join(&n)).map_err(|e| e.to_string())?; }
    Ok(n)
}

#[tauri::command]
pub fn wm_folder_rename(old: String, name: String) -> Result<String, String> {
    let (o, n) = (safe_name(&old)?, safe_name(&name)?);
    if wm_dir().join(&n).exists() { return Err("Bu adda bir klasör zaten var".into()); }
    for r in roots() { let _ = std::fs::rename(r.join(&o), r.join(&n)); }
    Ok(n)
}

/// Klasörü siler; içindeki imzalar ana klasöre taşınır (imza silinmez).
#[tauri::command]
pub fn wm_folder_delete(name: String) -> Result<(), String> {
    let n = safe_name(&name)?;
    let prim = wm_dir();
    for f in files_in(&prim.join(&n)) {
        let nn = uniq(&prim, &f);
        for r in roots() { let _ = std::fs::rename(r.join(&n).join(&f), r.join(&nn)); }
    }
    for r in roots() { let _ = std::fs::remove_dir_all(r.join(&n)); }
    Ok(())
}

/// Filigran klasörünü Gezgin'de açar.
#[tauri::command]
pub fn wm_open_dir() -> Result<(), String> {
    std::process::Command::new("explorer.exe").arg(wm_dir()).spawn().map(|_| ()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn wm_data(id: String) -> Result<String, String> {
    let rel = safe_rel(&id)?;
    let b = std::fs::read(wm_dir().join(rel)).map_err(|e| e.to_string())?;
    Ok(format!("data:image/png;base64,{}", base64::engine::general_purpose::STANDARD.encode(b)))
}

/// Önizleme için Drive görselini indirip küçültür; veri adresi olarak döndürür.
#[tauri::command]
pub async fn wm_preview(email: String, id: String) -> Result<String, String> {
    let d = drv(&email).await?;
    let dir = std::env::temp_dir().join("FramioOpen");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let ms = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_millis()).unwrap_or(0);
    let src = dir.join(format!("wp_{ms}.src"));
    let dst = dir.join(format!("wp_{ms}.jpg"));
    d.download(&id, &src).await.map_err(de)?;
    let (s2, d2) = (src.clone(), dst.clone());
    let ok = tauri::async_runtime::spawn_blocking(move || shrink_to(&s2, &d2, 1100, 85)).await.map_err(|e| e.to_string())?;
    let _ = std::fs::remove_file(&src);
    if !ok { return Err("Görsel okunamadı (desteklenmeyen biçim olabilir)".into()); }
    let b = std::fs::read(&dst).map_err(|e| e.to_string())?;
    let _ = std::fs::remove_file(&dst);
    Ok(format!("data:image/jpeg;base64,{}", base64::engine::general_purpose::STANDARD.encode(b)))
}

const WM_PS: &str = r#"Add-Type -AssemblyName System.Drawing
$i=[System.Drawing.Image]::FromFile('@SRC@')
foreach($p in $i.PropertyItems){ if($p.Id -eq 274){ switch($p.Value[0]){ 3 {$i.RotateFlip('Rotate180FlipNone')} 6 {$i.RotateFlip('Rotate90FlipNone')} 8 {$i.RotateFlip('Rotate270FlipNone')} } } }
$w=[System.Drawing.Image]::FromFile('@WM@')
$bw=$i.Width; $bh=$i.Height
$tw=[int]($bw*@SCALE@); if($tw -lt 8){$tw=8}; $th=[int]($w.Height*$tw/$w.Width)
$px=$bw*@CX@; $py=$bh*@CY@; $rx=[int](-$tw/2); $ry=[int](-$th/2)
$b=New-Object System.Drawing.Bitmap $bw,$bh
$g=[System.Drawing.Graphics]::FromImage($b); $g.InterpolationMode='HighQualityBicubic'; $g.SmoothingMode='HighQuality'
$g.DrawImage($i,0,0,$bw,$bh)
$cm=New-Object System.Drawing.Imaging.ColorMatrix; $cm.Matrix33=[single]@OP@
$ia=New-Object System.Drawing.Imaging.ImageAttributes; $ia.SetColorMatrix($cm)
$g.TranslateTransform([single]$px,[single]$py); $g.RotateTransform([single]@ROT@)
$dr=New-Object System.Drawing.Rectangle $rx,$ry,$tw,$th
$g.DrawImage($w,$dr,0,0,$w.Width,$w.Height,[System.Drawing.GraphicsUnit]::Pixel,$ia)
if('@FMT@' -eq 'png'){ $b.Save('@DST@',[System.Drawing.Imaging.ImageFormat]::Png) } else {
 $enc=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
 $ep=New-Object System.Drawing.Imaging.EncoderParameters 1
 $ep.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 95L)
 $b.Save('@DST@',$enc,$ep) }
$g.Dispose(); $b.Dispose(); $i.Dispose(); $w.Dispose()"#;

/// Cihaza kaydetmek için klasör seçtirir (boş dönerse iptal).
#[tauri::command]
pub async fn wm_pick_dir() -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(|| {
        Ok(ps_out("[Console]::OutputEncoding=[Text.Encoding]::UTF8; Add-Type -AssemblyName System.Windows.Forms; $f=New-Object System.Windows.Forms.Form -Property @{TopMost=$true}; $d=New-Object System.Windows.Forms.FolderBrowserDialog; $d.Description='Filigranlı görsellerin kaydedileceği klasörü seç'; if($d.ShowDialog($f) -eq 'OK'){ $d.SelectedPath }"))
    }).await.map_err(|e| e.to_string())?
}

/// Seçili Drive görsellerine filigran ekler. `items` her görsel için ayrı yerleşim taşır
/// ({id,cx,cy,scale,angle,opacity}). Sonuç Drive'a (aynı klasöre) ve/veya cihaza kaydedilir.
#[tauri::command]
pub async fn wm_apply(email: String, items: Vec<Value>, wm: String, suffix: String, to_drive: bool, to_device: bool, dest: String) -> Result<Value, String> {
    let wmp = wm_dir().join(safe_rel(&wm)?);
    if !wmp.exists() { return Err("Filigran dosyası bulunamadı".into()); }
    if !to_drive && !to_device { return Err("Kaydedilecek yer seçilmedi (Drive ya da cihaz)".into()); }
    let d = drv(&email).await?;
    let dir = std::env::temp_dir().join("FramioOpen");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let dev_dir = if !to_device { None } else {
        let p = if dest.trim().is_empty() {
            PathBuf::from(std::env::var("USERPROFILE").unwrap_or_default()).join("Downloads").join("Filigranlı")
        } else { PathBuf::from(dest.trim()) };
        std::fs::create_dir_all(&p).map_err(|e| format!("Cihaz klasörü oluşturulamadı: {e}"))?;
        Some(p)
    };
    let suffix = clean_name(if suffix.trim().is_empty() { "-filigran" } else { suffix.trim() });
    let (mut done, mut failed) = (0u32, vec![]);
    for it in items {
        let id = it["id"].as_str().unwrap_or_default().to_string();
        let g = |k: &str, df: f64| it[k].as_f64().unwrap_or(df);
        let (scale, opacity, cx, cy, angle) = (g("scale", 0.22).clamp(0.01, 20.0), g("opacity", 0.85).clamp(0.05, 1.0), g("cx", 0.8).clamp(0.0, 1.0), g("cy", 0.9).clamp(0.0, 1.0), g("angle", 0.0).clamp(-360.0, 360.0));
        let meta = match d.file_meta(&id).await { Ok(m) => m, Err(e) => { failed.push(format!("{id}: {}", de(e))); continue } };
        let name = meta.name.clone();
        let parent = meta.parents.first().cloned().unwrap_or_else(|| "root".into());
        let (stem, ext) = name.rsplit_once('.').map(|(a, b)| (a.to_string(), b.to_lowercase())).unwrap_or((name.clone(), String::new()));
        let fmt = if ext == "png" { "png" } else { "jpg" };
        let out_name = format!("{stem}{suffix}.{fmt}");
        let ms = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_millis()).unwrap_or(0);
        let src = dir.join(format!("wa_{ms}.src"));
        let dst = dir.join(format!("wa_{ms}.{fmt}"));
        if let Err(e) = d.download(&id, &src).await { failed.push(format!("{name}: {}", de(e))); continue; }
        let script = WM_PS.replace("@SRC@", &q(&src.display().to_string())).replace("@WM@", &q(&wmp.display().to_string()))
            .replace("@DST@", &q(&dst.display().to_string())).replace("@FMT@", fmt).replace("@CX@", &format!("{cx:.5}")).replace("@CY@", &format!("{cy:.5}")).replace("@ROT@", &format!("{angle:.2}"))
            .replace("@SCALE@", &format!("{scale:.5}")).replace("@OP@", &format!("{opacity:.3}"));
        let _ = tauri::async_runtime::spawn_blocking(move || ps(&script)).await;
        let _ = std::fs::remove_file(&src);
        if !dst.exists() { failed.push(format!("{name}: görsel işlenemedi")); continue; }
        let mut ok = true;
        if let Some(dd) = &dev_dir {
            let nm = uniq(dd, &out_name);
            if let Err(e) = std::fs::copy(&dst, dd.join(&nm)) { failed.push(format!("{name}: cihaza kaydedilemedi ({e})")); ok = false; }
        }
        if ok && to_drive {
            match put_file(&d, &dst, &out_name, &parent).await { Ok(()) => drivefs::note_ok(&out_name), Err(e) => { failed.push(format!("{name}: {e}")); ok = false } }
        }
        if ok { done += 1 }
        let _ = std::fs::remove_file(&dst);
    }
    if let Some(dd) = &dev_dir { if done > 0 { let _ = std::process::Command::new("explorer.exe").arg(dd).spawn(); } }
    Ok(json!({ "done": done, "failed": failed, "device": dev_dir.map(|p| p.display().to_string()) }))
}

#[tauri::command]
pub async fn pick_upload_files() -> Result<Vec<String>, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let out = ps_out("[Console]::OutputEncoding=[Text.Encoding]::UTF8; Add-Type -AssemblyName System.Windows.Forms; $f=New-Object System.Windows.Forms.Form -Property @{TopMost=$true}; $d=New-Object System.Windows.Forms.OpenFileDialog; $d.Multiselect=$true; $d.Title='Drive’a yüklenecek dosyaları seç'; if($d.ShowDialog($f) -eq 'OK'){ $d.FileNames -join '|' }");
        Ok(if out.is_empty() { vec![] } else { out.split('|').map(|x| x.to_string()).collect() })
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn pick_upload_folder() -> Result<Vec<String>, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let out = ps_out("[Console]::OutputEncoding=[Text.Encoding]::UTF8; Add-Type -AssemblyName System.Windows.Forms; $f=New-Object System.Windows.Forms.Form -Property @{TopMost=$true}; $d=New-Object System.Windows.Forms.FolderBrowserDialog; $d.Description='Drive’a yüklenecek klasörü seç'; if($d.ShowDialog($f) -eq 'OK'){ $d.SelectedPath }");
        Ok(if out.is_empty() { vec![] } else { vec![out] })
    }).await.map_err(|e| e.to_string())?
}
