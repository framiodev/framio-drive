// Arayuz betiginin sozdizimini ve $('id') ile erisilen her ogenin HTML'de var olmasini denetler.
// Eksik ogeye baglanan kod betigi sessizce durdurur (bos pencere); bu yuzden derlemeyi burada kirariz.
const fs = require('fs');
const s = fs.readFileSync('app/ui/index.html', 'utf8');
const m = s.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error('script bulunamadi'); process.exit(1); }
try { new Function(m[1]); } catch (e) { console.error('JS sozdizimi hatasi:', e.message); process.exit(1); }
const ids = new Set([...s.matchAll(/id="([^"]+)"/g)].map(x => x[1]));
const used = new Set([...m[1].matchAll(/\$\('([A-Za-z0-9_]+)'\)/g)].map(x => x[1]));
const missing = [...used].filter(x => !ids.has(x));
if (missing.length) { console.error('HTML\'de olmayan ogeler:', missing.join(', ')); process.exit(1); }
console.log('arayuz kontrolu tamam');
