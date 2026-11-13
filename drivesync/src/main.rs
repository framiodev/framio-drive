//! Komut satırı: drivesync <e-posta> [unregister]   (arayüz için Framio Drive uygulamasını kullan)
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let email = args.first().ok_or("kullanım: drivesync <e-posta> [unregister]")?.clone();
    if args.get(1).map(String::as_str) == Some("unregister") { drivesync::unregister(&email)?; println!("Kayıt silindi."); return Ok(()); }
    let client = drivenet::auth::Client::load()?;
    let _engine = drivesync::Engine::start(&email, client)?;
    println!("Bağlı. Durdurmak için Ctrl+C.");
    loop { std::thread::sleep(std::time::Duration::from_secs(3600)); }
}
