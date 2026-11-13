//! Komut satiri: drivefs [hesap@gmail.com] [X:] ["Surucu adi"]
//! NOT: Normal (yonetici OLMAYAN) bir terminalden calistir; yoksa Gezgin gormez.
use drivenet::auth;

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let email = args
        .get(0)
        .cloned()
        .or_else(|| auth::accounts().into_iter().next())
        .expect("Kayitli hesap yok. Once uygulamadan Google ile giris yap.");
    let letter = args.get(1).cloned().unwrap_or_else(|| "X:".to_string());
    let share = args.get(2).cloned().unwrap_or_else(|| email.split('@').next().unwrap_or("Drive").to_string());
    let client = auth::Client::load().expect("Client ID/secret bulunamadi");
    let m = drivefs::start(&email, &letter, &share, client).expect("baglanamadi");
    println!("Baglandi: {}  hesap: {email}  (okuma + yazma)", m.letter);
    println!("Cikmak icin Enter'a bas...");
    let mut s = String::new();
    let _ = std::io::stdin().read_line(&mut s);
    println!("Yuklemeler bitiyor...");
    m.wait_uploads(3600);
}
