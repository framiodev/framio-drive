fn main() {
    tauri_build::build();
    // WinFsp DLL'i yalnizca kullanilirken yuklensin (yuklu olmasa da uygulama acilir)
    winfsp::build::winfsp_link_delayload();
}
