//! Filigran: kullanıcının kendi şeffaf PNG'sini görsellerin üstüne ekler. Orijinal dosyaya dokunulmaz;
//! filigranlı kopya, Drive'da aynı klasöre ayrı bir dosya olarak kaydedilir.
use super::*;
use base64::Engine as _;

fn ps_out(script: &str) -> String {
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

fn pngs(d: &Path) -> Vec<String> {
    std::fs::read_dir(d).map(|rd| rd.flatten().map(|e| e.file_name().to_string_lossy().into_owned()).filter(|f| f.to_lowercase().ends_with(".png")).collect()).unwrap_or_default()
}

/// Ana klasör boşsa (yeni kurulum/yeniden kurulum) yedekten geri yükler; ana klasördekileri yedeğe kopyalar.
fn wm_sync() {
    let (a, b) = (wm_dir(), wm_backup());
    if a == b { return; }
    if pngs(&a).is_empty() {
        for f in pngs(&b) { let _ = std::fs::copy(b.join(&f), a.join(&f)); }
    }
    for f in pngs(&a) {
        if !b.join(&f).exists() { let _ = std::fs::copy(a.join(&f), b.join(&f)); }
    }
}

fn disp(file: &str) -> String { file.split_once('_').map(|x| x.1).unwrap_or(file).to_string() }

#[tauri::command]
pub fn wm_list() -> Value {
    wm_sync();
    let mut v: Vec<(String, String)> = vec![];
    if let Ok(rd) = std::fs::read_dir(wm_dir()) {
        for e in rd.flatten() {
            let f = e.file_name().to_string_lossy().into_owned();
            if f.to_lowercase().ends_with(".png") { v.push((f.clone(), disp(&f))); }
        }
    }
    v.sort();
    json!(v.iter().map(|(id, n)| json!({ "id": id, "name": n })).collect::<Vec<_>>())
}

/// Cihazdan şeffaf PNG seçtirir ve uygulamanın filigran kitaplığına kopyalar.
#[tauri::command]
pub async fn wm_pick() -> Result<Value, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let out = ps_out("[Console]::OutputEncoding=[Text.Encoding]::UTF8; Add-Type -AssemblyName System.Windows.Forms; $f=New-Object System.Windows.Forms.Form -Property @{TopMost=$true}; $d=New-Object System.Windows.Forms.OpenFileDialog; $d.Filter='PNG (şeffaf arka plan)|*.png'; $d.Title='Filigran olarak kullanılacak PNG dosyasını seç'; if($d.ShowDialog($f) -eq 'OK'){ $d.FileName }");
        if out.is_empty() { return Ok(Value::Null); }
        let src = PathBuf::from(&out);
        let name = src.file_name().map(|n| clean_name(&n.to_string_lossy())).ok_or("Dosya adı okunamadı")?;
        let ms = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_millis()).unwrap_or(0);
        let id = format!("{ms}_{name}");
        std::fs::copy(&src, wm_dir().join(&id)).map_err(|e| e.to_string())?;
        let _ = std::fs::copy(&src, wm_backup().join(&id));
        Ok(json!({ "id": id, "name": name }))
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn wm_remove(id: String) -> Result<(), String> {
    if id.contains('\\') || id.contains('/') || id.contains("..") { return Err("Geçersiz".into()); }
    let _ = std::fs::remove_file(wm_backup().join(&id));
    std::fs::remove_file(wm_dir().join(id)).map_err(|e| e.to_string())
}

/// Filigran klasörünü Gezgin'de açar.
#[tauri::command]
pub fn wm_open_dir() -> Result<(), String> {
    std::process::Command::new("explorer.exe").arg(wm_dir()).spawn().map(|_| ()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn wm_data(id: String) -> Result<String, String> {
    if id.contains('\\') || id.contains('/') || id.contains("..") { return Err("Geçersiz".into()); }
    let b = std::fs::read(wm_dir().join(id)).map_err(|e| e.to_string())?;
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
$mg=[int]($bw*@MARGIN@)
$col=@POS@ % 3; $row=[Math]::Floor(@POS@ / 3)
if($col -eq 0){$x=$mg}elseif($col -eq 1){$x=[int](($bw-$tw)/2)}else{$x=$bw-$tw-$mg}
if($row -eq 0){$y=$mg}elseif($row -eq 1){$y=[int](($bh-$th)/2)}else{$y=$bh-$th-$mg}
$b=New-Object System.Drawing.Bitmap $bw,$bh
$g=[System.Drawing.Graphics]::FromImage($b); $g.InterpolationMode='HighQualityBicubic'; $g.SmoothingMode='HighQuality'
$g.DrawImage($i,0,0,$bw,$bh)
$cm=New-Object System.Drawing.Imaging.ColorMatrix; $cm.Matrix33=[single]@OP@
$ia=New-Object System.Drawing.Imaging.ImageAttributes; $ia.SetColorMatrix($cm)
$g.DrawImage($w,(New-Object System.Drawing.Rectangle $x,$y,$tw,$th),0,0,$w.Width,$w.Height,[System.Drawing.GraphicsUnit]::Pixel,$ia)
if('@FMT@' -eq 'png'){ $b.Save('@DST@',[System.Drawing.Imaging.ImageFormat]::Png) } else {
 $enc=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
 $ep=New-Object System.Drawing.Imaging.EncoderParameters 1
 $ep.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 95L)
 $b.Save('@DST@',$enc,$ep) }
$g.Dispose(); $b.Dispose(); $i.Dispose(); $w.Dispose()"#;

/// Seçili Drive görsellerine filigran ekler; her biri için aynı klasöre `<ad><ek>.<uzantı>` kopyası yükler.
#[tauri::command]
pub async fn wm_apply(email: String, ids: Vec<String>, wm: String, pos: u32, scale: f64, opacity: f64, margin: f64, suffix: String) -> Result<Value, String> {
    if wm.contains('\\') || wm.contains('/') || wm.contains("..") { return Err("Geçersiz filigran".into()); }
    let wmp = wm_dir().join(&wm);
    if !wmp.exists() { return Err("Filigran dosyası bulunamadı".into()); }
    let d = drv(&email).await?;
    let dir = std::env::temp_dir().join("FramioOpen");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let (scale, opacity, margin, pos) = (scale.clamp(0.03, 0.9), opacity.clamp(0.05, 1.0), margin.clamp(0.0, 0.2), pos.min(8));
    let suffix = clean_name(if suffix.trim().is_empty() { "-filigran" } else { suffix.trim() });
    let (mut done, mut failed) = (0u32, vec![]);
    for id in ids {
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
            .replace("@DST@", &q(&dst.display().to_string())).replace("@FMT@", fmt).replace("@POS@", &pos.to_string())
            .replace("@SCALE@", &format!("{scale:.4}")).replace("@MARGIN@", &format!("{margin:.4}")).replace("@OP@", &format!("{opacity:.3}"));
        let _ = tauri::async_runtime::spawn_blocking(move || ps(&script)).await;
        let _ = std::fs::remove_file(&src);
        if !dst.exists() { failed.push(format!("{name}: görsel işlenemedi")); continue; }
        match put_file(&d, &dst, &out_name, &parent).await { Ok(()) => { done += 1; drivefs::note_ok(&out_name) } Err(e) => failed.push(format!("{name}: {e}")) }
        let _ = std::fs::remove_file(&dst);
    }
    Ok(json!({ "done": done, "failed": failed }))
}
