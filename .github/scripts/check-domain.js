// Uygulama genel (global) kalmalı: şehir/araç/otobüs gibi alana özgü metinler yasak.
const fs=require('fs');
const files=['app/ui/index.html','app/src/main.rs','app/src/findex.rs','app/src/wake.rs','app/src/handmouse.rs'];
const ban=/otob[uü]s|ankara|istanbul|izmir|mercedes|turismo|conecto|\bEGO\b|\bVT 317\b|\bPRM\b|spotter|toplu ula[sş]ım|\bplaka\b(?!.*(künye|forum))/i;
let bad=0;
for(const f of files){if(!fs.existsSync(f))continue;fs.readFileSync(f,'utf8').split('\n').forEach((l,i)=>{
  if(/forum|shr|künye|plate|extens|EXT\./i.test(l))return; // isteğe bağlı forum eklentisi
  const m=l.match(ban);if(m){bad++;console.log(`${f}:${i+1}: yasak ifade "${m[0]}"`)}})}
if(bad){console.log(bad+' alana özgü ifade bulundu');process.exit(1)}console.log('alan denetimi tamam');
