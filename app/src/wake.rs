//! Uyandırma kelimesi: kullanıcı kendi kelimesini 3-5 kez kaydeder (Rustpotter referansı); mikrofon Rust'ta
//! dinlenir, ses cihazdan çıkmaz. Kelime duyulunca pencere öne gelir ve arayüze "assistant-wake" gider.
use super::*;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use rustpotter::{Rustpotter, RustpotterConfig, WakewordRef, WakewordRefBuildFromBuffers, WakewordSave};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{mpsc, Arc};
use std::time::{Duration, Instant};

static RUN: Mutex<Option<Arc<AtomicBool>>> = Mutex::new(None);
static ENROLL: Mutex<Vec<Vec<i16>>> = Mutex::new(Vec::new());
static ENROLLING: AtomicBool = AtomicBool::new(false);
static PAUSED: AtomicBool = AtomicBool::new(false);

fn wake_dir() -> PathBuf { data_dir().join("wake") }
fn word_path() -> PathBuf { wake_dir().join("word.rpw") }

/// Varsayılan mikrofonu açar; ses 16 kHz mono f32 parçalar hâlinde `sink`e akar.
static DEV: std::sync::Mutex<Option<String>> = std::sync::Mutex::new(None);

/// Uyandırma dinlemesi için kullanılabilir mikrofonlar.
#[tauri::command]
pub fn wake_devices() -> Value {
    let host = cpal::default_host();
    let def = host.default_input_device().and_then(|d| d.name().ok());
    let names: Vec<String> = host.input_devices().map(|it| it.filter_map(|d| d.name().ok()).collect()).unwrap_or_default();
    json!({ "devices": names, "default": def })
}

/// Dinleme/kayıt için mikrofonu seçer (boş = varsayılan). Çalışan dinleme yeniden başlatılınca geçerli olur.
#[tauri::command]
pub fn wake_set_device(name: Option<String>) { *DEV.lock().unwrap() = name.filter(|n| !n.is_empty()); }

fn open_stream(mut sink: impl FnMut(Vec<f32>) + Send + 'static) -> Result<cpal::Stream, String> {
    let host = cpal::default_host();
    let want = DEV.lock().unwrap().clone();
    let dev = want.and_then(|w| host.input_devices().ok().and_then(|mut it| it.find(|d| d.name().ok().as_deref() == Some(w.as_str()))))
        .or_else(|| host.default_input_device()).ok_or("Mikrofon bulunamadı")?;
    let cfg = dev.default_input_config().map_err(|e| format!("Mikrofon ayarı okunamadı: {e}"))?;
    let ch = cfg.channels() as usize;
    let ratio = cfg.sample_rate().0 as f32 / 16000.0;
    let fmt = cfg.sample_format();
    let conf: cpal::StreamConfig = cfg.into();
    let (mut acc, mut cnt, mut phase) = (0f32, 0f32, 0f32);
    let mut feed = move |mono: &mut dyn Iterator<Item = f32>| {
        let mut out = Vec::new();
        for s in mono { acc += s; cnt += 1.0; phase += 1.0; if phase >= ratio { out.push(acc / cnt); acc = 0.0; cnt = 0.0; phase -= ratio; } }
        if !out.is_empty() { sink(out); }
    };
    let err = |e: cpal::StreamError| eprintln!("mikrofon hatası: {e}");
    let stream = match fmt {
        cpal::SampleFormat::F32 => dev.build_input_stream(&conf, move |d: &[f32], _| feed(&mut d.chunks(ch).map(|f| f.iter().sum::<f32>() / ch as f32)), err, None),
        cpal::SampleFormat::I16 => dev.build_input_stream(&conf, move |d: &[i16], _| feed(&mut d.chunks(ch).map(|f| f.iter().map(|x| *x as f32 / 32768.0).sum::<f32>() / ch as f32)), err, None),
        cpal::SampleFormat::U16 => dev.build_input_stream(&conf, move |d: &[u16], _| feed(&mut d.chunks(ch).map(|f| f.iter().map(|x| (*x as f32 - 32768.0) / 32768.0).sum::<f32>() / ch as f32)), err, None),
        f => return Err(format!("Desteklenmeyen mikrofon biçimi: {f:?}")),
    }.map_err(|e| format!("Mikrofon açılamadı (Windows Gizlilik > Mikrofon iznini kontrol et): {e}"))?;
    stream.play().map_err(|e| e.to_string())?;
    Ok(stream)
}

fn rms(v: &[f32]) -> f32 { if v.is_empty() { 0.0 } else { (v.iter().map(|x| x * x).sum::<f32>() / v.len() as f32).sqrt() } }

fn wav_bytes(s: &[i16]) -> Vec<u8> {
    let data = (s.len() * 2) as u32;
    let mut o = Vec::with_capacity(44 + s.len() * 2);
    o.extend_from_slice(b"RIFF"); o.extend_from_slice(&(36 + data).to_le_bytes()); o.extend_from_slice(b"WAVEfmt ");
    o.extend_from_slice(&16u32.to_le_bytes()); o.extend_from_slice(&1u16.to_le_bytes()); o.extend_from_slice(&1u16.to_le_bytes());
    o.extend_from_slice(&16000u32.to_le_bytes()); o.extend_from_slice(&32000u32.to_le_bytes()); o.extend_from_slice(&2u16.to_le_bytes()); o.extend_from_slice(&16u16.to_le_bytes());
    o.extend_from_slice(b"data"); o.extend_from_slice(&data.to_le_bytes());
    for x in s { o.extend_from_slice(&x.to_le_bytes()); }
    o
}

/// Tek bir örnek kaydeder: konuşma başlayınca kaydeder, kısa sessizlikte bitirir.
fn record_one() -> Result<Value, String> {
    let (tx, rx) = mpsc::channel::<Vec<f32>>();
    let _stream = open_stream(move |v| { let _ = tx.send(v); })?;
    let t0 = Instant::now();
    let mut floor = 0f32; let mut floor_n = 0u32; let mut voiced = false; let mut buf: Vec<f32> = vec![]; let mut sil = 0usize; let mut peak = 0f32;
    while t0.elapsed() < Duration::from_secs(9) {
        let Ok(c) = rx.recv_timeout(Duration::from_millis(200)) else { continue };
        let r = rms(&c);
        if t0.elapsed() < Duration::from_millis(400) { floor += r; floor_n += 1; continue; }
        let thr = (floor / floor_n.max(1) as f32 * 3.0).max(0.012);
        if !voiced { if r > thr { voiced = true; buf.extend_from_slice(&c); peak = r; } continue; }
        buf.extend_from_slice(&c); peak = peak.max(r);
        if r < thr { sil += c.len(); } else { sil = 0; }
        if sil > 9600 || buf.len() > 16000 * 3 { break; }
    }
    if !voiced || buf.len() < 3200 { return Err("Ses algılanmadı; mikrofona biraz daha yakın ve net söyle".into()); }
    let keep = buf.len().saturating_sub(sil.saturating_sub(3200));
    let s: Vec<i16> = buf[..keep.max(3200).min(buf.len())].iter().map(|x| (x.clamp(-1.0, 1.0) * 32767.0) as i16).collect();
    let ms = s.len() * 1000 / 16000;
    let mut e = ENROLL.lock().unwrap(); e.push(s);
    Ok(json!({ "count": e.len(), "ms": ms, "peak": peak }))
}

#[tauri::command]
pub async fn wake_record_sample() -> Result<Value, String> {
    ENROLLING.store(true, Ordering::SeqCst);
    let r = tauri::async_runtime::spawn_blocking(record_one).await.map_err(|e| e.to_string())?;
    ENROLLING.store(false, Ordering::SeqCst);
    r
}

#[tauri::command]
pub fn wake_clear_samples() { ENROLL.lock().unwrap().clear(); }

/// Kaydedilen örneklerden kelime referansını üretip diske yazar.
#[tauri::command]
pub fn wake_build(name: String) -> Result<Value, String> {
    let name = name.trim().to_string();
    if name.is_empty() { return Err("Kelimeye bir ad ver".into()); }
    let samples = ENROLL.lock().unwrap().clone();
    if samples.len() < 3 { return Err("En az 3 örnek kaydetmelisin".into()); }
    let bufs: HashMap<String, Vec<u8>> = samples.iter().enumerate().map(|(i, s)| (format!("ornek{}", i + 1), wav_bytes(s))).collect();
    let w = WakewordRef::new_from_sample_buffers(name.clone(), None, None, bufs, 16).map_err(|e| format!("Kelime oluşturulamadı: {e}"))?;
    std::fs::create_dir_all(wake_dir()).map_err(|e| e.to_string())?;
    w.save_to_file(&word_path().display().to_string()).map_err(|e| format!("Kelime kaydedilemedi: {e}"))?;
    let mut s = load_settings();
    s["assistant"]["wake"] = json!({ "name": name, "samples": samples.len() });
    save_settings(&s);
    ENROLL.lock().unwrap().clear();
    Ok(json!({ "name": name, "samples": samples.len() }))
}

#[tauri::command]
pub fn wake_clear_word(app: AppHandle) {
    let _ = wake_set(app, false, 3);
    let _ = std::fs::remove_file(word_path());
    let mut s = load_settings();
    if let Some(a) = s["assistant"].as_object_mut() { a.remove("wake"); }
    save_settings(&s);
}

#[tauri::command]
pub fn wake_status() -> Value {
    let s = load_settings();
    let running = RUN.lock().unwrap().is_some();
    json!({ "has_word": word_path().exists(), "name": s["assistant"]["wake"]["name"], "samples": ENROLL.lock().unwrap().len(), "running": running })
}

/// Asistan konuşurken/dinlerken tetiklenmesin diye arayüz duraklatır.
#[tauri::command]
pub fn wake_pause(on: bool) { PAUSED.store(on, Ordering::SeqCst); }

/// Dinlemeyi açar/kapatır. sens: 1 (az hassas) … 5 (çok hassas).
#[tauri::command]
pub fn wake_set(app: AppHandle, on: bool, sens: u8) -> Result<(), String> {
    use tauri::Emitter;
    let mut g = RUN.lock().unwrap();
    if let Some(flag) = g.take() { flag.store(true, Ordering::SeqCst); }
    if !on { return Ok(()); }
    if !word_path().exists() { return Err("Önce kendi kelimeni kaydet".into()); }
    let th = [0.64f32, 0.58, 0.52, 0.46, 0.40][(sens.clamp(1, 5) - 1) as usize];
    let stop = Arc::new(AtomicBool::new(false));
    let st = stop.clone();
    let (ready_tx, ready_rx) = mpsc::channel::<Result<(), String>>();
    std::thread::spawn(move || {
        let init = || -> Result<(Rustpotter, usize), String> {
            let mut cfg = RustpotterConfig::default();
            cfg.detector.threshold = th;
            let mut rp = Rustpotter::new(&cfg).map_err(|e| format!("Rustpotter başlatılamadı: {e}"))?;
            rp.add_wakeword_from_file("kelime", &word_path().display().to_string()).map_err(|e| format!("Kelime yüklenemedi: {e}"))?;
            let n = rp.get_samples_per_frame();
            Ok((rp, n))
        };
        let (mut rp, frame) = match init() { Ok(x) => x, Err(e) => { let _ = ready_tx.send(Err(e)); return; } };
        let (tx, rx) = mpsc::channel::<Vec<f32>>();
        let _stream = match open_stream(move |v| { let _ = tx.send(v); }) { Ok(s) => s, Err(e) => { let _ = ready_tx.send(Err(e)); return; } };
        let _ = ready_tx.send(Ok(()));
        let mut buf: Vec<f32> = vec![]; let mut last = Instant::now() - Duration::from_secs(10);
        while !st.load(Ordering::SeqCst) {
            match rx.recv_timeout(Duration::from_millis(200)) { Ok(c) => buf.extend(c), Err(mpsc::RecvTimeoutError::Timeout) => continue, Err(_) => break }
            while buf.len() >= frame {
                let chunk: Vec<f32> = buf.drain(..frame).collect();
                if PAUSED.load(Ordering::SeqCst) || ENROLLING.load(Ordering::SeqCst) { continue; }
                if let Some(d) = rp.process_samples(chunk) {
                    if d.score >= th && last.elapsed() > Duration::from_secs(3) {
                        last = Instant::now();
                        show_window(&app);
                        let _ = app.emit("assistant-wake", d.score);
                    }
                }
            }
            if buf.len() > 16000 * 5 { buf.clear(); }
        }
    });
    match ready_rx.recv_timeout(Duration::from_secs(8)) {
        Ok(Ok(())) => { *g = Some(stop); Ok(()) }
        Ok(Err(e)) => { stop.store(true, Ordering::SeqCst); Err(e) }
        Err(_) => { stop.store(true, Ordering::SeqCst); Err("Dinleme başlatılamadı (zaman aşımı)".into()) }
    }
}
