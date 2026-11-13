# Framio Drive

Google Drive hesaplari icin Windows istemcisi (ExpanDrive alternatifi). Rust cekirdek + Tauri v2 arayuz.

- `app/` Tauri masaustu uygulamasi (tepsi, hesaplar, kuyruk, ayarlar)
- `drivenet/` Drive API + OAuth
- `drivecore/` yukleme kuyrugu ve onbellek mantigi
- `drivesync/` Cloud Files tabanli esitleme klasoru modu
- `drivefs/` WinFsp tabanli sanal surucu modu (gercek ag surucusu gorunumu)

Derleme GitHub Actions ile yapilir; yerelde derlemek gerekmez.
