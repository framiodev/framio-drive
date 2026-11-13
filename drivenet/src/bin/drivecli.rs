use drivenet::{auth, Drive};

fn usage() -> ! {
    eprintln!("kullanım:\n  drivecli login\n  drivecli accounts\n  drivecli ls <e-posta> [klasorId]\n  drivecli up <e-posta> <dosya> [klasorId]\n  drivecli down <e-posta> <dosyaId> <hedef>");
    std::process::exit(2)
}

#[tokio::main]
async fn main() {
    if let Err(e) = run().await { eprintln!("HATA: {e}"); std::process::exit(1); }
}

async fn run() -> Result<(), String> {
    let a: Vec<String> = std::env::args().skip(1).collect();
    let client = auth::Client::from_env()?;
    match a.first().map(String::as_str) {
        Some("login") => { let e = auth::login(&client).await?; println!("Giriş kaydedildi: {e}"); }
        Some("accounts") => { for e in auth::accounts() { println!("{e}"); } }
        Some("ls") => {
            let d = Drive::new(auth::access_token(&client, a.get(1).ok_or("e-posta?")?).await?);
            let folder = a.get(2).map(String::as_str).unwrap_or("root");
            for f in d.list_children(folder).await.map_err(|e| format!("{e:?}"))? {
                println!("{:<34} {:>12}  {}", f.id, f.size.unwrap_or_else(|| "-".into()), f.name);
            }
        }
        Some("up") => {
            let d = Drive::new(auth::access_token(&client, a.get(1).ok_or("e-posta?")?).await?);
            let path = std::path::Path::new(a.get(2).ok_or("dosya?")?);
            let parent = a.get(3).map(String::as_str).unwrap_or("root");
            let total = std::fs::metadata(path).map_err(|e| e.to_string())?.len();
            let name = path.file_name().and_then(|n| n.to_str()).ok_or("dosya adı?")?;
            let session = d.start_upload(name, parent, total).await.map_err(|e| format!("{e:?}"))?;
            d.upload_file(&session, path, |c| println!("  {c}/{total} bayt")).await.map_err(|e| format!("{e:?}"))?;
            println!("Yüklendi: {name}");
        }
        Some("down") => {
            let d = Drive::new(auth::access_token(&client, a.get(1).ok_or("e-posta?")?).await?);
            d.download(a.get(2).ok_or("dosyaId?")?, std::path::Path::new(a.get(3).ok_or("hedef?")?)).await.map_err(|e| format!("{e:?}"))?;
            println!("İndirildi.");
        }
        _ => usage(),
    }
    Ok(())
}
