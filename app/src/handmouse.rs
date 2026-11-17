//! El hareketiyle fare: masaüstü imleci/tıklaması (SendInput) ve Ctrl+Alt+H aç/kapa kısayolu.
use super::*;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use windows_sys::Win32::UI::Input::KeyboardAndMouse::{SendInput, INPUT, INPUT_0, INPUT_MOUSE, MOUSEINPUT, MOUSEEVENTF_LEFTDOWN, MOUSEEVENTF_LEFTUP, MOUSEEVENTF_RIGHTDOWN, MOUSEEVENTF_RIGHTUP, MOUSEEVENTF_WHEEL};
use windows_sys::Win32::UI::WindowsAndMessaging::{GetSystemMetrics, SetCursorPos, SM_CXSCREEN, SM_CYSCREEN};

fn send(flags: u32, data: i32) {
    let inp = INPUT { r#type: INPUT_MOUSE, Anonymous: INPUT_0 { mi: MOUSEINPUT { dx: 0, dy: 0, mouseData: data as u32, dwFlags: flags, time: 0, dwExtraInfo: 0 } } };
    unsafe { SendInput(1, &inp, std::mem::size_of::<INPUT>() as i32); }
}

/// kind: move (x,y = 0..1 ana ekran oranı) | down | up | rdown | rup | wheel (d = tekerlek birimi, 120 = bir tık)
#[tauri::command]
pub fn hand_mouse(kind: String, x: f32, y: f32, d: i32) -> Result<(), String> {
    match kind.as_str() {
        "move" => unsafe {
            let (w, h) = (GetSystemMetrics(SM_CXSCREEN), GetSystemMetrics(SM_CYSCREEN));
            SetCursorPos((x.clamp(0.0, 1.0) * (w - 1) as f32) as i32, (y.clamp(0.0, 1.0) * (h - 1) as f32) as i32);
        },
        "down" => send(MOUSEEVENTF_LEFTDOWN, 0),
        "up" => send(MOUSEEVENTF_LEFTUP, 0),
        "rdown" => send(MOUSEEVENTF_RIGHTDOWN, 0),
        "rup" => send(MOUSEEVENTF_RIGHTUP, 0),
        "wheel" => send(MOUSEEVENTF_WHEEL, d.clamp(-1200, 1200)),
        _ => return Err("bilinmeyen eylem".into()),
    }
    Ok(())
}

static HK_LOCK: std::sync::Mutex<()> = std::sync::Mutex::new(());

/// Ctrl+Alt+H: el kontrolünü her yerden aç/kapat (pencere gizliyken de çalışır).
#[tauri::command]
pub fn hand_hotkey(app: AppHandle, on: bool) -> Result<(), String> {
    use tauri::Emitter;
    let _g = HK_LOCK.lock().unwrap_or_else(|e| e.into_inner());
    let sc = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyH);
    let gs = app.global_shortcut();
    let _ = gs.unregister(sc);
    if !on { return Ok(()); }
    gs.on_shortcut(sc, |app, _s, ev| { if ev.state() == ShortcutState::Pressed { let _ = app.emit("hand-toggle", ()); } })
        .map_err(|e| format!("Ctrl+Alt+H kısayolu kaydedilemedi: {e}"))
}
