//! Uygulama logosu: vurgu renginde yuvarlak köşeli zemin + beyaz "disk halkası" ve orta nokta.
//! Eşitleme sırasında halkada bir yay döner (tepsi simgesi bu karelerle canlanır).
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum St { Idle, Sync, Err, Pause }

type Rgb = (f32, f32, f32);
fn mix(a: Rgb, b: Rgb, t: f32) -> Rgb { (a.0 + (b.0 - a.0) * t, a.1 + (b.1 - a.1) * t, a.2 + (b.2 - a.2) * t) }

fn sample(x: f32, y: f32, acc: Rgb, st: St, phase: f32) -> (Rgb, f32) {
    // zemin
    let (cx, cy) = (x - 0.5, y - 0.5);
    let (hx, hy, r) = (0.47f32 - 0.25, 0.47f32 - 0.25, 0.25f32);
    let (qx, qy) = ((cx.abs() - hx).max(0.0), (cy.abs() - hy).max(0.0));
    let sd = (qx * qx + qy * qy).sqrt() - r;
    if sd > 0.0 { return ((0.0, 0.0, 0.0), 0.0); }
    let light = mix(acc, (255.0, 255.0, 255.0), 0.30);
    let mut c = mix(acc, light, ((x + y) / 2.0).clamp(0.0, 1.0));
    let lum = 0.299 * acc.0 + 0.587 * acc.1 + 0.114 * acc.2;
    let fg: Rgb = if lum > 175.0 { (20.0, 20.0, 24.0) } else { (255.0, 255.0, 255.0) };
    let over = |c: Rgb, a: f32, col: Rgb| mix(c, col, a.clamp(0.0, 1.0));
    // halka
    let d = (cx * cx + cy * cy).sqrt();
    if (d - 0.27).abs() <= 0.05 {
        let a = match st {
            St::Idle | St::Err => 1.0,
            St::Pause => 0.5,
            St::Sync => {
                let ang = cy.atan2(cx);
                let delta = (ang - phase).rem_euclid(std::f32::consts::TAU);
                let len = 2.0f32;
                if delta < len { 0.35 + 0.65 * (1.0 - delta / len) } else { 0.35 }
            }
        };
        c = over(c, a, fg);
    }
    // orta: nokta ya da duraklatma çubukları
    if st == St::Pause {
        let bar = |bx: f32| (x - bx).abs() <= 0.028 && (y - 0.5).abs() <= 0.095;
        if bar(0.455) || bar(0.545) { c = over(c, 1.0, fg); }
    } else if d <= 0.075 { c = over(c, 1.0, fg); }
    // hata rozeti
    if st == St::Err {
        let (bx, by) = (x - 0.76, y - 0.76);
        let bd = (bx * bx + by * by).sqrt();
        if bd <= 0.20 { c = over(c, 1.0, acc); }
        if bd <= 0.15 { c = over(c, 1.0, (255.0, 154.0, 60.0)); }
    }
    (c, 1.0)
}

fn raster(size: u32, f: &dyn Fn(f32, f32) -> (Rgb, f32)) -> Vec<u8> {
    let ss = 4u32;
    let mut out = Vec::with_capacity((size * size * 4) as usize);
    for py in 0..size {
        for px in 0..size {
            let (mut r, mut g, mut b, mut a) = (0.0f32, 0.0f32, 0.0f32, 0.0f32);
            for sy in 0..ss {
                for sx in 0..ss {
                    let x = (px as f32 + (sx as f32 + 0.5) / ss as f32) / size as f32;
                    let y = (py as f32 + (sy as f32 + 0.5) / ss as f32) / size as f32;
                    let (c, cov) = f(x, y);
                    r += c.0 * cov; g += c.1 * cov; b += c.2 * cov; a += cov;
                }
            }
            let n = (ss * ss) as f32;
            if a > 0.0 { out.extend_from_slice(&[(r / a) as u8, (g / a) as u8, (b / a) as u8, (a / n * 255.0) as u8]); }
            else { out.extend_from_slice(&[0, 0, 0, 0]); }
        }
    }
    out
}

/// RGBA (düz, premultiply değil) piksel verisi üretir.
pub fn render(size: u32, acc: (u8, u8, u8), st: St, phase: f32) -> Vec<u8> {
    let acc = (acc.0 as f32, acc.1 as f32, acc.2 as f32);
    raster(size, &|x, y| sample(x, y, acc, st, phase))
}

fn rrect(x: f32, y: f32, cx: f32, cy: f32, hx: f32, hy: f32, r: f32) -> f32 {
    let (qx, qy) = (((x - cx).abs() - (hx - r)).max(0.0), ((y - cy).abs() - (hy - r)).max(0.0));
    (qx * qx + qy * qy).sqrt() - r
}

/// "Sürücü" simgesi: gri disk gövdesi, vurgu renginde taban, yeşil ışık (ağ sürücüsü görünümü).
fn drive_sample(x: f32, y: f32, acc: Rgb) -> (Rgb, f32) {
    let sd = rrect(x, y, 0.5, 0.52, 0.45, 0.24, 0.09);
    if sd <= 0.0 {
        let t = ((y - 0.28) / 0.48).clamp(0.0, 1.0);
        let mut c = mix((244.0, 245.0, 248.0), (176.0, 180.0, 188.0), t);
        if y > 0.62 {
            let light = mix(acc, (255.0, 255.0, 255.0), 0.28);
            c = mix(light, acc, ((y - 0.62) / 0.14).clamp(0.0, 1.0));
        }
        if sd > -0.014 { c = mix(c, (70.0, 74.0, 84.0), 0.55); }
        if y > 0.295 && y < 0.31 && x > 0.12 && x < 0.88 { c = mix(c, (255.0, 255.0, 255.0), 0.7); }
        if y > 0.665 && y < 0.705 && x > 0.14 && x < 0.50 { c = mix(c, (30.0, 32.0, 38.0), 0.75); }
        let (lx, ly) = (x - 0.80, y - 0.685);
        if (lx * lx + ly * ly).sqrt() < 0.032 { c = (130.0, 255.0, 185.0); }
        return (c, 1.0);
    }
    let (sx, sy) = ((x - 0.5) / 0.38, (y - 0.84) / 0.045);
    if sx * sx + sy * sy <= 1.0 { return ((0.0, 0.0, 0.0), 0.22); }
    ((0.0, 0.0, 0.0), 0.0)
}

pub fn render_drive(size: u32, acc: (u8, u8, u8)) -> Vec<u8> {
    let acc = (acc.0 as f32, acc.1 as f32, acc.2 as f32);
    raster(size, &|x, y| drive_sample(x, y, acc))
}

fn dib(s: u32, rgba: &[u8]) -> Vec<u8> {
    let mut v = Vec::new();
    v.extend(40u32.to_le_bytes()); v.extend((s as i32).to_le_bytes()); v.extend((s as i32 * 2).to_le_bytes());
    v.extend(1u16.to_le_bytes()); v.extend(32u16.to_le_bytes());
    v.extend([0u8; 24]);
    for y in (0..s).rev() { for x in 0..s {
        let i = ((y * s + x) * 4) as usize;
        v.extend([rgba[i + 2], rgba[i + 1], rgba[i], rgba[i + 3]]);
    } }
    v.extend(vec![0u8; (((s + 31) / 32) * 4 * s) as usize]);
    v
}

fn build_ico(render: &dyn Fn(u32) -> Vec<u8>) -> Vec<u8> {
    let sizes = [16u32, 32, 48, 64, 128];
    let imgs: Vec<Vec<u8>> = sizes.iter().map(|&s| dib(s, &render(s))).collect();
    let mut out = Vec::new();
    out.extend([0u8, 0, 1, 0]); out.extend((sizes.len() as u16).to_le_bytes());
    let mut off = 6 + 16 * sizes.len() as u32;
    for (i, &s) in sizes.iter().enumerate() {
        out.extend([s as u8, s as u8, 0, 0]);
        out.extend(1u16.to_le_bytes()); out.extend(32u16.to_le_bytes());
        out.extend((imgs[i].len() as u32).to_le_bytes()); out.extend(off.to_le_bytes());
        off += imgs[i].len() as u32;
    }
    for im in imgs { out.extend(im); }
    out
}

/// Vurgu rengindeki uygulama logosundan çok boyutlu .ico.
pub fn ico(acc: (u8, u8, u8)) -> Vec<u8> { build_ico(&|s| render(s, acc, St::Idle, 0.0)) }
/// Sürücü simgesinden çok boyutlu .ico (Gezgin'deki sürücü/ağ konumu için).
pub fn drive_ico(acc: (u8, u8, u8)) -> Vec<u8> { build_ico(&|s| render_drive(s, acc)) }
