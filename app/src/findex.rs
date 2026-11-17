//! Yerel Drive indeksi: tüm adlar bellekte; Türkçe duyarlı bulanık arama, yol çözme, Gezgin'de gösterme.
use super::*;
use std::collections::HashMap;
use std::sync::Arc;

#[derive(Clone)]
struct Ent { id: String, name: String, folder: bool, mime: String, parents: Vec<String>, modified: String, stem: String, compact: String, toks: Vec<String> }
struct Index { at: std::time::Instant, root: String, token: String, ents: Vec<Ent>, pos: HashMap<String, usize> }

static IDX: std::sync::Mutex<Option<HashMap<String, Arc<Index>>>> = std::sync::Mutex::new(None);
static BUILD: tokio::sync::Mutex<()> = tokio::sync::Mutex::const_new(());
/// Bu süreden yeni indeks doğrudan kullanılır; eskiyse değişiklik akışıyla (ucuz) güncellenir.
const FRESH_SECS: u64 = 45;

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

fn mk_ent(id: String, name: String, mime: String, parents: Vec<String>, modified: String) -> Ent {
    let stem = fold(stem_of(&name));
    let toks: Vec<String> = stem.split(' ').map(|s| s.to_string()).collect();
    Ent { folder: mime == "application/vnd.google-apps.folder", compact: stem.replace(' ', ""), stem, toks, id, name, mime, parents, modified }
}
fn assemble(root: String, token: String, ents: Vec<Ent>) -> Index {
    let pos = ents.iter().enumerate().map(|(i, e)| (e.id.clone(), i)).collect();
    Index { at: std::time::Instant::now(), root, token, ents, pos }
}
fn disk_path(email: &str) -> PathBuf {
    let safe: String = email.chars().map(|c| if c.is_alphanumeric() { c } else { '_' }).collect();
    data_dir().join(format!("findex_{safe}.json"))
}
fn save_disk(email: &str, ix: &Index) {
    let files: Vec<Value> = ix.ents.iter().map(|e| json!([e.id, e.name, e.mime, e.parents, e.modified])).collect();
    let _ = std::fs::create_dir_all(data_dir());
    let _ = std::fs::write(disk_path(email), json!({ "root": ix.root, "token": ix.token, "files": files }).to_string());
}
fn load_disk(email: &str) -> Option<Index> {
    let v: Value = serde_json::from_str(&std::fs::read_to_string(disk_path(email)).ok()?).ok()?;
    let ents = v["files"].as_array()?.iter().filter_map(|f| {
        let a = f.as_array()?;
        Some(mk_ent(a.get(0)?.as_str()?.into(), a.get(1)?.as_str()?.into(), a.get(2)?.as_str()?.into(),
            a.get(3)?.as_array()?.iter().filter_map(|x| x.as_str().map(String::from)).collect(), a.get(4).and_then(|x| x.as_str()).unwrap_or("").into()))
    }).collect();
    let mut ix = assemble(v["root"].as_str()?.into(), v["token"].as_str()?.into(), ents);
    ix.at = std::time::Instant::now() - std::time::Duration::from_secs(FRESH_SECS + 1); // hemen güncellensin
    Some(ix)
}

async fn build_full(email: &str) -> Result<Arc<Index>, String> {
    let d = drv(email).await?;
    let token = d.changes_start_token().await.map_err(de)?; // taramadan önce al: arada olan değişiklik kaçmaz
    let root = d.root_id().await.map_err(de)?;
    let all = d.list_all_light().await.map_err(de)?;
    let ents = all.into_iter().map(|f| mk_ent(f.id, f.name, f.mime_type, f.parents, f.modified_time.unwrap_or_default())).collect();
    Ok(Arc::new(assemble(root, token, ents)))
}

async fn build_incremental(email: &str, old: &Index) -> Result<Arc<Index>, String> {
    let d = drv(email).await?;
    let (changes, next) = d.changes_since(&old.token).await.map_err(de)?;
    let mut m: HashMap<String, Ent> = old.ents.iter().map(|e| (e.id.clone(), e.clone())).collect();
    for c in changes {
        match c.file {
            Some(f) if !c.removed && !f.trashed => { m.insert(f.id.clone(), mk_ent(f.id, f.name, f.mime_type, f.parents, f.modified_time.unwrap_or_default())); }
            _ => { m.remove(&c.file_id); }
        }
    }
    Ok(Arc::new(assemble(old.root.clone(), next, m.into_values().collect())))
}

async fn ensure(email: &str, force: bool) -> Result<Arc<Index>, String> {
    let email = email.to_lowercase();
    let get = |e: &str| IDX.lock().unwrap().as_ref().and_then(|m| m.get(e).cloned());
    if let Some(ix) = get(&email) { if !force && ix.at.elapsed().as_secs() < FRESH_SECS { return Ok(ix); } }
    let _g = BUILD.lock().await;
    let mut cur = get(&email);
    if let Some(ix) = &cur { if !force && ix.at.elapsed().as_secs() < FRESH_SECS { return Ok(ix.clone()); } }
    if cur.is_none() { cur = load_disk(&email).map(Arc::new); }
    let ix = match (&cur, force) {
        (Some(old), false) => match build_incremental(&email, old).await { Ok(n) => n, Err(_) => build_full(&email).await? },
        _ => build_full(&email).await?,
    };
    save_disk(&email, &ix);
    IDX.lock().unwrap().get_or_insert_with(HashMap::new).insert(email, ix.clone());
    Ok(ix)
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
    json!({ "id": e.id, "name": e.name, "folder": e.folder, "mime": e.mime, "score": (sc * 10.0).round() / 10.0, "modified": e.modified,
            "dir": if rp.is_some() { json!(folder) } else { Value::Null }, "path": rp.map(|p| p.join("\\")), "parent": e.parents.first() })
}

fn now_secs() -> u64 { std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0) }
/// Unix saniyesi → "YYYY-MM-DDTHH:MM:SS" (UTC); Drive'ın modifiedTime'ı ile sözlük sırasında karşılaştırılır.
fn iso_of(secs: u64) -> String {
    let days = (secs / 86400) as i64; let rem = secs % 86400;
    let z = days + 719468; let era = z.div_euclid(146097); let doe = z.rem_euclid(146097);
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400; let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153; let d = doy - (153 * mp + 2) / 5 + 1; let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };
    format!("{y:04}-{m:02}-{d:02}T{:02}:{:02}:{:02}", rem / 3600, rem % 3600 / 60, rem % 60)
}
fn digit_of(t: &str) -> Option<char> {
    Some(match t { "sifir" => '0', "bir" => '1', "iki" => '2', "uc" => '3', "dort" => '4', "bes" => '5', "alti" => '6', "yedi" => '7', "sekiz" => '8', "dokuz" => '9', _ => return None })
}
/// "img sifir sifir bir" → "img 001" (tek başına "bir" gibi sıradan sözcükler değişmez).
fn numwords(toks: Vec<String>) -> Vec<String> {
    let mut out: Vec<String> = vec![]; let mut run = String::new(); let mut zero = false;
    let flush = |out: &mut Vec<String>, run: &mut String, zero: &mut bool| {
        if run.chars().count() >= 2 || *zero { out.push(run.clone()); } else if !run.is_empty() { out.push(match run.as_str() { "1" => "bir".into(), x => x.to_string() }); }
        run.clear(); *zero = false;
    };
    for t in toks {
        if let Some(c) = digit_of(&t) { if c == '0' { zero = true; } run.push(c); } else { flush(&mut out, &mut run, &mut zero); out.push(t); }
    }
    flush(&mut out, &mut run, &mut zero);
    out
}

fn usage_map(email: &str) -> HashMap<String, (u32, u64)> {
    load_settings()["assistant"]["usage"][email].as_object().map(|o| o.iter().filter_map(|(k, v)| Some((k.clone(), (v[0].as_u64()? as u32, v[1].as_u64()?)))).collect()).unwrap_or_default()
}
fn usage_boost(u: Option<&(u32, u64)>, now: u64) -> f32 {
    match u { Some((n, last)) => ((1.0 + *n as f32).ln() * 3.0).min(9.0) + if now.saturating_sub(*last) < 7 * 86400 { 3.0 } else { 0.0 }, None => 0.0 }
}

/// Bir dosyanın asistanla açıldığını/gösterildiğini kaydeder (sıralamada öne çıkar).
#[tauri::command]
pub fn fs_mark_used(email: String, id: String) {
    let em = email.to_lowercase();
    let mut s = load_settings();
    let (n, _) = usage_map(&em).get(&id).copied().unwrap_or((0, 0));
    s["assistant"]["usage"][&em][&id] = json!([n + 1, now_secs()]);
    save_settings(&s);
}

/// Takma ad: "fatura klasörüm" → belirli bir öğe. Aynı ad yeniden verilirse güncellenir.
#[tauri::command]
pub fn fs_alias_set(email: String, alias: String, id: String) -> Result<(), String> {
    let em = email.to_lowercase();
    let key = fold(&alias);
    if key.is_empty() { return Err("Takma ad boş".into()); }
    let mut s = load_settings();
    s["assistant"]["alias"][&em][&key] = json!(id);
    save_settings(&s);
    Ok(())
}
#[tauri::command]
pub fn fs_alias_list(email: String) -> Value { load_settings()["assistant"]["alias"][email.to_lowercase()].clone() }

/// İndeksi arka planda hazırlar (asistan açılırken).
#[tauri::command]
pub async fn fs_index_warm(email: String, force: Option<bool>) -> Result<Value, String> {
    let ix = ensure(&email, force.unwrap_or(false)).await?;
    Ok(json!({ "count": ix.ents.len() }))
}

/// Bulanık ad arama. Sorgu boş olabilir (yalnızca uzantı/tarih filtresiyle "son değişenler").
/// kind: dosya|klasor, ext: "pdf,jpg", gun: son N günde değişen. Takma adlar ve kullanım sıklığı sıralamayı etkiler.
#[tauri::command]
pub async fn fs_find(email: String, q: String, limit: Option<usize>, kind: Option<String>, ext: Option<String>, gun: Option<u32>) -> Result<Value, String> {
    let em = email.to_lowercase();
    let ix = ensure(&em, false).await?;
    let qf = fold(&q);
    let toks: Vec<String> = numwords(qf.split(' ').filter(|t| !t.is_empty()).map(|s| s.to_string()).collect());
    let alias_key = toks.iter().filter(|t| !FILLER.contains(&t.as_str())).cloned().collect::<Vec<_>>().join(" ");
    let qt: Vec<String> = toks.into_iter().filter(|t| !FILLER.contains(&t.as_str())).collect();
    let qs = qt.join(" ");
    let qc = qs.replace(' ', "");
    let exts: Vec<String> = ext.unwrap_or_default().split(',').map(|x| x.trim().trim_start_matches('.').to_lowercase()).filter(|x| !x.is_empty()).collect();
    let cutoff = gun.map(|g| iso_of(now_secs().saturating_sub(g as u64 * 86400)));
    if qc.is_empty() && exts.is_empty() && cutoff.is_none() { return Err("Aranacak ad ya da filtre gerekli".into()); }
    let kind = kind.unwrap_or_default();
    let now = now_secs();
    let usage = usage_map(&em);
    let mut v: Vec<(f32, usize)> = vec![];
    for (i, e) in ix.ents.iter().enumerate() {
        match kind.as_str() { "dosya" if e.folder => continue, "klasor" if !e.folder => continue, _ => {} }
        if !exts.is_empty() { let l = e.name.to_lowercase(); if !exts.iter().any(|x| l.ends_with(&format!(".{x}"))) { continue; } }
        if let Some(c) = &cutoff { if e.modified.as_str() < c.as_str() { continue; } }
        let base = if qc.is_empty() { 50.0 } else { score(&qs, &qc, &qt, e) };
        if base < 45.0 { continue; }
        v.push((base + usage_boost(usage.get(&e.id), now), i));
    }
    // takma ad: tam eşleşme en üstte
    let alias_hit = if alias_key.is_empty() { None } else { load_settings()["assistant"]["alias"][&em][&alias_key].as_str().and_then(|id| ix.pos.get(id).copied()) };
    if let Some(i) = alias_hit { v.retain(|(_, j)| *j != i); v.push((150.0, i)); }
    v.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap_or(std::cmp::Ordering::Equal)
        .then_with(|| if qc.is_empty() { ix.ents[b.1].modified.cmp(&ix.ents[a.1].modified) } else { ix.ents[a.1].name.len().cmp(&ix.ents[b.1].name.len()) }));
    let n = limit.unwrap_or(8).clamp(1, 30);
    Ok(json!({ "indexed": ix.ents.len(), "alias": alias_hit.is_some(), "results": v.iter().take(n).map(|(s, i)| row(&ix, &ix.ents[*i], *s)).collect::<Vec<_>>() }))
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
