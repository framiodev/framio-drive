//! Yerel Drive indeksi: tüm adlar bellekte; Türkçe duyarlı bulanık arama, yol çözme, Gezgin'de gösterme.
use super::*;
use std::collections::HashMap;
use std::sync::Arc;

struct Ent { id: String, name: String, folder: bool, mime: String, parents: Vec<String>, stem: String, compact: String, toks: Vec<String> }
struct Index { at: std::time::Instant, root: String, ents: Vec<Ent>, pos: HashMap<String, usize> }

static IDX: std::sync::Mutex<Option<HashMap<String, Arc<Index>>>> = std::sync::Mutex::new(None);
static BUILD: tokio::sync::Mutex<()> = tokio::sync::Mutex::const_new(());
const TTL_SECS: u64 = 600;

fn fold(s: &str) -> String {
    let mut o = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            'İ' | 'I' | 'ı' | 'i' => o.push('i'),
            'Ş' | 'ş' => o.push('s'), 'Ğ' | 'ğ' => o.push('g'), 'Ü' | 'ü' => o.push('u'),
            'Ö' | 'ö' => o.push('o'), 'Ç' | 'ç' => o.push('c'),
            c if c.is_alphanumeric() => o.extend(c.to_lowercase()),
            _ => o.push(' '),
        }
    }
    o.split_whitespace().collect::<Vec<_>>().join(" ")
}
fn stem_of(name: &str) -> &str {
    match name.rfind('.') { Some(i) if i > 0 && name.len() - i <= 6 => &name[..i], _ => name }
}
fn lev(a: &[char], b: &[char]) -> usize {
    let mut prev: Vec<usize> = (0..=b.len()).collect();
    for i in 1..=a.len() {
        let mut cur = vec![i; b.len() + 1];
        for j in 1..=b.len() {
            let c = if a[i - 1] == b[j - 1] { 0 } else { 1 };
            cur[j] = (prev[j] + 1).min(cur[j - 1] + 1).min(prev[j - 1] + c);
        }
        prev = cur;
    }
    prev[b.len()]
}
const FILLER: &[&str] = &["dosya", "dosyasi", "dosyasini", "klasor", "klasoru", "dizin", "dizini", "adli", "isimli", "olan", "bul", "ac", "bana", "su", "bu", "o", "jpg", "jpeg", "png", "pdf"];

fn score(q: &str, qc: &str, qt: &[String], e: &Ent) -> f32 {
    if e.stem == q { return 100.0; }
    if !qc.is_empty() && e.compact == qc { return 98.0; }
    let mut best = 0f32;
    if !qc.is_empty() {
        if e.compact.starts_with(qc) { best = best.max(86.0 - ((e.compact.len() - qc.len()) as f32).min(12.0) * 0.5); }
        else if e.compact.contains(qc) { best = best.max(72.0 - ((e.compact.len() - qc.len()) as f32).min(20.0) * 0.3); }
    }
    if !qt.is_empty() {
        let hit = qt.iter().filter(|t| e.toks.iter().any(|x| x == *t || (t.len() >= 3 && x.starts_with(t.as_str())))).count();
        if hit > 0 { best = best.max(60.0 * hit as f32 / qt.len() as f32 + if hit == qt.len() { 8.0 } else { 0.0 }); }
    }
    if best < 60.0 && qc.len() >= 4 && e.compact.len() <= qc.len() * 2 + 4 {
        let a: Vec<char> = qc.chars().collect();
        let b: Vec<char> = e.compact.chars().collect();
        let d = lev(&a, &b);
        let r = 1.0 - d as f32 / a.len().max(1) as f32;
        if r >= 0.75 { best = best.max(r * 66.0); }
    }
    best
}

async fn build(email: &str) -> Result<Arc<Index>, String> {
    let d = drv(email).await?;
    let root = d.root_id().await.map_err(de)?;
    let all = d.list_all_light().await.map_err(de)?;
    let mut ents = Vec::with_capacity(all.len());
    let mut pos = HashMap::with_capacity(all.len());
    for f in all {
        let stem = fold(stem_of(&f.name));
        let toks: Vec<String> = stem.split(' ').map(|s| s.to_string()).collect();
        pos.insert(f.id.clone(), ents.len());
        ents.push(Ent { folder: f.mime_type == "application/vnd.google-apps.folder", compact: stem.replace(' ', ""), stem, toks, id: f.id, name: f.name, mime: f.mime_type, parents: f.parents });
    }
    let ix = Arc::new(Index { at: std::time::Instant::now(), root, ents, pos });
    IDX.lock().unwrap().get_or_insert_with(HashMap::new).insert(email.to_string(), ix.clone());
    Ok(ix)
}

async fn ensure(email: &str, force: bool) -> Result<Arc<Index>, String> {
    let email = email.to_lowercase();
    let cur = IDX.lock().unwrap().as_ref().and_then(|m| m.get(&email).cloned());
    if let Some(ix) = &cur { if !force && ix.at.elapsed().as_secs() < TTL_SECS { return Ok(ix.clone()); } }
    let _g = BUILD.lock().await;
    // sıra beklerken başkası kurmuş olabilir
    let cur2 = IDX.lock().unwrap().as_ref().and_then(|m| m.get(&email).cloned());
    if let Some(ix) = cur2 { if !force && ix.at.elapsed().as_secs() < TTL_SECS { return Ok(ix); } }
    build(&email).await
}

fn rel_path(ix: &Index, e: &Ent) -> Option<Vec<String>> {
    let mut parts = vec![e.name.clone()];
    let mut cur = e;
    for _ in 0..64 {
        let p = match cur.parents.first() { Some(p) => p, None => return None };
        if *p == ix.root { parts.reverse(); return Some(parts); }
        let i = *ix.pos.get(p)?;
        cur = &ix.ents[i];
        parts.push(cur.name.clone());
    }
    None
}
fn row(ix: &Index, e: &Ent, sc: f32) -> Value {
    let rp = rel_path(ix, e);
    let folder = rp.as_ref().map(|p| p[..p.len() - 1].join("\\")).unwrap_or_default();
    json!({ "id": e.id, "name": e.name, "folder": e.folder, "mime": e.mime, "score": (sc * 10.0).round() / 10.0,
            "dir": if rp.is_some() { json!(folder) } else { Value::Null }, "path": rp.map(|p| p.join("\\")), "parent": e.parents.first() })
}

/// İndeksi arka planda hazırlar (asistan açılırken).
#[tauri::command]
pub async fn fs_index_warm(email: String, force: Option<bool>) -> Result<Value, String> {
    let ix = ensure(&email, force.unwrap_or(false)).await?;
    Ok(json!({ "count": ix.ents.len() }))
}

/// Bulanık ad arama: IMG_001 / img 001 / "ımg sıfır..." gibi varyantları yakalar; yolu ile döner.
#[tauri::command]
pub async fn fs_find(email: String, q: String, limit: Option<usize>, kind: Option<String>) -> Result<Value, String> {
    let ix = ensure(&email, false).await?;
    let qf = fold(&q);
    let qt: Vec<String> = qf.split(' ').filter(|t| !t.is_empty() && !FILLER.contains(t)).map(|s| s.to_string()).collect();
    let qs = qt.join(" ");
    let qc = qs.replace(' ', "");
    if qc.is_empty() { return Err("Aranacak ad boş".into()); }
    let kind = kind.unwrap_or_default();
    let mut v: Vec<(f32, usize)> = ix.ents.iter().enumerate().filter(|(_, e)| match kind.as_str() { "dosya" => !e.folder, "klasor" => e.folder, _ => true })
        .map(|(i, e)| (score(&qs, &qc, &qt, e), i)).filter(|(s, _)| *s >= 45.0).collect();
    v.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap_or(std::cmp::Ordering::Equal).then(ix.ents[a.1].name.len().cmp(&ix.ents[b.1].name.len())));
    let n = limit.unwrap_or(8).clamp(1, 30);
    Ok(json!({ "indexed": ix.ents.len(), "results": v.iter().take(n).map(|(s, i)| row(&ix, &ix.ents[*i], *s)).collect::<Vec<_>>() }))
}

/// Gezgin eylemleri (sanal sürücü bağlıysa): "reveal" dosyayı klasöründe seçili gösterir,
/// "folder" bulunduğu dizini açar, "open" dosyayı Gezgin yolu üzerinden varsayılan uygulamayla açar.
#[tauri::command]
pub async fn fs_explorer(app: State<'_, App>, email: String, id: String, mode: String) -> Result<Value, String> {
    let em = email.to_lowercase();
    if !app.mounts.lock().unwrap().contains_key(&em) { return Err("Sanal sürücü bağlı değil; Ayarlar'dan sürücüyü bağlamalısın".into()); }
    let ix = ensure(&em, false).await?;
    let e = ix.pos.get(&id).map(|i| &ix.ents[*i]).ok_or("Öğe indekste yok")?;
    let rp = rel_path(&ix, e).ok_or("Bu öğe 'Drive'ım' altında değil (paylaşılan olabilir), Gezgin yolu yok")?;
    let (_, letter, _) = vcfg(&em);
    let root = format!("{}:\\", letter.trim_end_matches(':'));
    let full = format!("{}{}", root, rp.join("\\"));
    let dir = format!("{}{}", root, rp[..rp.len() - 1].join("\\"));
    let dir = dir.trim_end_matches('\\').to_string() + if rp.len() == 1 { "\\" } else { "" };
    let spawn = |a: Vec<String>| std::process::Command::new("explorer.exe").args(a).spawn().map(|_| ()).map_err(|e| e.to_string());
    match mode.as_str() {
        "reveal" if !e.folder => spawn(vec![format!("/select,{}", full)])?,
        "reveal" | "folder" => spawn(vec![if e.folder && mode == "reveal" { full.clone() } else { dir.clone() }])?,
        "open" => spawn(vec![full.clone()])?,
        _ => return Err("Bilinmeyen mod".into()),
    }
    Ok(json!({ "path": full, "dir": dir }))
}
