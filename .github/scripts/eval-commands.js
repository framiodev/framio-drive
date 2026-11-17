// Sesli asistan komut doğruluğu testi: yerel yönlendirici (asLocal) + araç/işleyici tutarlılığı.
// Çalıştırma: node .github/scripts/eval-commands.js   (CI'da arayuz kontrolünden sonra çalışır)
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../../app/ui/index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
let fails = 0, total = 0;
const ok = (c, msg) => { total++; if (!c) { fails++; console.log('  ✗ ' + msg); } };

// 1) Yerel yönlendirici
const a = script.indexOf('function asLocal('), b = script.indexOf('async function asstLocal(');
const asLocal = new Function(script.slice(a, b) + '; return asLocal;')();
const R = (t, tool, args) => { const r = asLocal(t); const same = tool === null ? r === null : (r && r[0] === tool && Object.entries(args || {}).every(([k, v]) => r[1][k] === v)); ok(same, `"${t}" → beklenen ${tool} ${JSON.stringify(args || '')}, gelen ${JSON.stringify(r)}`); };
// açma
R('IMG_001 dosyasını aç', 'dosya_ac', { sorgu: 'img_001', tur: 'dosya' });
R('Rapor 317 klasörünü aç', 'dosya_ac', { sorgu: 'rapor 317', tur: 'klasor' });
R('rapor 317 klasörünü açar mısın', 'dosya_ac', { sorgu: 'rapor 317', tur: 'klasor' });
R('Fatura klasörü aç', 'dosya_ac', { sorgu: 'fatura', tur: 'klasor' });
R('rapor.pdf dosyasını aç', 'dosya_ac', { sorgu: 'rapor.pdf' });
R('onu aç', 'dosya_ac', {});
R('bunu aç', 'dosya_ac', {});
R('tatil fotoğrafları aç', 'dosya_ac', { sorgu: 'tatil fotoğrafları' });
R('Sözleşme aç', 'dosya_ac', { sorgu: 'sözleşme' });
// bulma
R('06 vt 201 bul', 'dosya_bul', { sorgu: '06 vt 201' });
R('IMG_0042 bul', 'dosya_bul', { sorgu: 'img_0042' });
R('bana fatura bul', 'dosya_bul', { sorgu: 'fatura' });
R('lütfen rapor 317 bulur musun', 'dosya_bul', { sorgu: 'rapor 317' });
R('proje sunumu dosyasını bul', 'dosya_bul', { sorgu: 'proje sunumu' });
R('rapor 317 bul ve aç', 'dosya_ac', { sorgu: 'rapor 317' });
R('IMG_001 bulup aç', 'dosya_ac', { sorgu: 'img_001' });
// dizin / gezgin
R('bulunduğu dizini aç', 'gezginde_goster', { mod: 'dizin' });
R('dosyanın bulunduğu klasörü göster', 'gezginde_goster', { mod: 'dizin' });
R('img_001 bulunduğu dizini aç', 'gezginde_goster', { mod: 'dizin', sorgu: 'img_001' });
R('aynı dosyayı gezginde aç', 'gezginde_goster', { mod: 'dosyayi_ac' });
// sistem
R('çöp kutusunu aç', 'cop_kutusunu_goster');
R('çöp kutusunu göster', 'cop_kutusunu_goster');
R('geri al', 'geri_al');
R('son işlemi geri al', 'geri_al');
R('güncelleme var mı', 'guncelleme_ara');
R('son dosyalar', 'son_dosyalar');
R('son açılan dosyaları göster', 'son_dosyalar');
// Gemini'ye bırakılması gerekenler (birleşik / betimleyici / belirsiz)
R('2026 yılından Antalya’daki bütün tatil plaj 16 fotoğrafları açar mısın', null);
R('bul, dizinini aç ve dosyayı seç', null);
R('bu dosyayı sil', null);
R('dosyaları taşı', null);
R('merhaba nasılsın', null);
R('bugün hava nasıl', null);
R('fatura klasörünü aç ve içindekileri listele', null);
R('önce bul sonra aç', null);
R('2026 Antalya Tatil fotoğrafları bul', null);

// 2) Araç tanımları ↔ işleyiciler
const A = script.indexOf('const ASTOOLS=['), B = script.indexOf('function asstSys(');
const defs = script.slice(A, B);
const names = [...defs.matchAll(/\{name:'(\w+)'/g)].map(m => m[1]);
const E = script.indexOf('async function asstExec('), F = script.indexOf('/* --- arayüz bağlama --- */');
const handlers = new Set([...script.slice(E, F).matchAll(/case\s*'(\w+)'/g)].map(m => m[1]));
ok(names.length >= 30, `araç sayısı beklenenden az: ${names.length}`);
for (const n of names) ok(handlers.has(n), `araç "${n}" için asstExec işleyicisi yok`);
ok(new Set(names).size === names.length, 'araç adları tekrar ediyor');
for (const n of ['dosya_ac','dosya_bul','kapsamli_ara','tasi','kopyala','yeniden_adlandir','klasor_olustur','geri_al','secenek_sec','ekrani_oku','tikla','yaz','sonuc_filtrele','bilgisayarda_ara','cope_at'])
  ok(names.includes(n), `zorunlu araç eksik: ${n}`);
// 3) Sistem talimatları
const sys = script.slice(script.indexOf('function asstSys('), script.indexOf('const asTimeout')) + script.slice(script.indexOf('function liveSys('), script.indexOf('function liveSys(') + 4000);
for (const w of ['kapsamli_ara', 'geri_al', 'secenek_sec', 'ekrani_oku']) ok(sys.includes(w), `sistem talimatında "${w}" geçmiyor`);
ok(!/yapamam['"]? de(?!me)/i.test(sys) || /deme/.test(sys), '"yapamam" yasağı talimatta yok');
console.log(`Komut testi: ${total - fails}/${total} geçti`);
process.exit(fails ? 1 : 0);
