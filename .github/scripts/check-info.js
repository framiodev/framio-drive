// Her kullanıcıya dönük denetim (id'li button/select/input) bir ⓘ bilgisine sahip olmalı ya da bilinçli olarak HLP_SKIP'te olmalı.
const fs=require('fs');const s=fs.readFileSync('app/ui/index.html','utf8');
const html=s.slice(0,s.indexOf('<script>')),js=s.slice(s.indexOf('<script>'));
const ids=[...html.matchAll(/<(?:button|select|input|textarea|a)\b[^>]*\bid="([^"]+)"/g)].map(m=>m[1]);
const info=new Set([...(js.match(/const HLP=\{([\s\S]*?)\n\};/)||['',''])[1].matchAll(/^\s*([A-Za-z0-9_]+):\[/gm)].map(m=>m[1]));
const skip=new Set([...(js.match(/HLP_SKIP=new Set\(\[([^\]]*)\]/)||['',''])[1].matchAll(/'([^']+)'/g)].map(m=>m[1]));
const miss=ids.filter(i=>!info.has(i)&&!skip.has(i));
console.log(`denetim: ${ids.length} kontrol, ${info.size} bilgi, ${skip.size} muaf`);
if(miss.length){console.log('Bilgisi eksik: '+miss.join(', '));process.exit(1)}console.log('bilgi denetimi tamam');
