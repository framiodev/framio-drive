// Forum eklentisi kaynaklarını (yükleme + ortak paylaşım) forum depolarından eşitler.
// Kaynak: framiodev/forum-ulasimarsiv. framiodev/forum-spottersturkey ile fark varsa raporlanır.
// Kullanım: FORUM_REPOS_TOKEN=... node sync.mjs   (değişiklik varsa vendor/ dosyalarını yazar, rapor: /tmp/forum-sync-report.md)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const token = process.env.FORUM_REPOS_TOKEN || '';
if (!token) { console.log('FORUM_REPOS_TOKEN yok; eşitleme atlandı.'); process.exit(0); }

const MAP = [
  ['packages/upload-exif/js/src/forum/components/UploadButton.js', 'vendor/upload-exif/forum/components/UploadButton.js'],
  ['packages/upload-exif/js/src/forum/components/WatermarkModal.js', 'vendor/upload-exif/forum/components/WatermarkModal.js'],
  ['packages/upload-exif/js/src/forum/components/AttributeModal.js', 'vendor/upload-exif/forum/components/AttributeModal.js'],
  ['packages/upload-exif/js/src/forum/components/InfoModal.js', 'vendor/upload-exif/forum/components/InfoModal.js'],
  ['packages/upload-exif/js/src/forum/components/CustomizePostModal.js', 'vendor/upload-exif/forum/components/CustomizePostModal.js'],
  ['packages/upload-exif/js/src/forum/utils/previewCache.js', 'vendor/upload-exif/forum/utils/previewCache.js'],
  ['packages/upload-exif/js/src/forum/crosspostOnPublish.js', 'vendor/upload-exif/forum/crosspostOnPublish.js'],
  ['packages/crosspost/js/src/forum/components/CrosspostModal.tsx', 'vendor/crosspost/forum/components/CrosspostModal.tsx'],
];
const norm = (s) => s.replace(/\r\n/g, '\n');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'forum-sync-'));
const clone = (name) => {
  const dir = path.join(tmp, name);
  execFileSync('git', ['clone', '--depth', '1', '-q', `https://x-access-token:${token}@github.com/framiodev/${name}.git`, dir], { stdio: ['ignore', 'ignore', 'inherit'] });
  return dir;
};
const read = (dir, rel) => { const f = path.join(dir, rel); return fs.existsSync(f) ? norm(fs.readFileSync(f, 'utf8')) : null; };

const main = clone('forum-ulasimarsiv');
let other = null; try { other = clone('forum-spottersturkey'); } catch (e) { console.log('spottersturkey okunamadı:', String(e.message || e)); }

const changed = [], missing = [], drift = [];
for (const [src, dst] of MAP) {
  const a = read(main, src);
  if (a == null) { missing.push(src); continue; }
  const target = path.join(here, dst);
  const cur = fs.existsSync(target) ? norm(fs.readFileSync(target, 'utf8')) : null;
  if (cur !== a) { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, a); changed.push(dst); }
  if (other) { const b = read(other, src); if (b != null && b !== a) drift.push(src); }
}
const rep = ['# Forum eklentisi eşitleme raporu', ''];
rep.push(changed.length ? '## Güncellenen dosyalar\n' + changed.map((x) => '- ' + x).join('\n') : 'Uygulamadaki kopya Ulaşım Arşiv ile aynı.');
if (missing.length) rep.push('', '## Kaynakta bulunamayan (yol değişmiş olabilir)', ...missing.map((x) => '- ' + x));
if (drift.length) rep.push('', '## Spotters Türkiye, Ulaşım Arşiv\'ten farklı (uygulama Ulaşım Arşiv sürümünü kullanır)', ...drift.map((x) => '- ' + x));
fs.writeFileSync('/tmp/forum-sync-report.md', rep.join('\n') + '\n');
console.log(rep.join('\n'));
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed.length ? 'true' : 'false'}\ndrift=${drift.length ? 'true' : 'false'}\n`);
