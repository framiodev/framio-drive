// Forum eklentisi paketi: vendor/ altindaki ORIJINAL kaynaklar + shim/ (Flarum uyum katmani) -> ../app/ui/forum-port.js ve .css
// Kullanim: cd forum-port && npm i && node build.mjs     (CHECK_ONLY=1: yalnizca cozumleme denetimi, npm paketleri disarida)
import { build } from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const core = path.join(here, 'vendor/flarum-core/js/src/common');
const shim = path.join(here, 'shim');
const out = path.join(here, '../app/ui');
const checkOnly = !!process.env.CHECK_ONLY;

const appShim = {
  name: 'flarum-app-shim',
  setup(b) {
    // 'flarum/forum/app', 'flarum/common/app' ve cekirdek icindeki '../app' benzeri her yol -> uyum katmani
    b.onResolve({ filter: /^flarum\/(forum|common)\/app$/ }, () => ({ path: path.join(shim, 'app.js') }));
    b.onResolve({ filter: /(^|\/)app$/ }, (a) => (a.importer.includes('vendor/flarum-core') ? { path: path.join(shim, 'app.js') } : undefined));
    // 'flarum/common/<x>' -> cekirdek kaynagi
    b.onResolve({ filter: /^flarum\/common\// }, async (a) => b.resolve('./' + a.path.slice('flarum/common/'.length), { resolveDir: core, kind: a.kind }));
  },
};

const externals = checkOnly ? ['mithril', 'mithril/stream', 'jquery', 'body-scroll-lock', 'focus-trap', 'clsx', 'dayjs', 'dayjs/*', 'nanoid', 'throttle-debounce', 'textarea-caret', 'format-message', 'color-thief-browser', 'web-haptics'] : [];

const r = await build({
  entryPoints: [path.join(shim, 'entry.js')],
  bundle: true, format: 'iife', globalName: 'FramioForumPort', target: 'es2020',
  outfile: checkOnly ? '/tmp/forum-port-check.js' : path.join(out, 'forum-port.js'),
  jsx: 'transform', jsxFactory: 'm', jsxFragment: 'm.Fragment',
  inject: [path.join(shim, 'globals.js')],
  define: { XMLHttpRequest: 'window.FramioXHR' },
  plugins: [appShim], external: externals, logLevel: 'info', legalComments: 'none', minify: false,
  loader: { '.js': 'jsx' },
});
if (checkOnly) process.exit(0);

// Flarum cekirdek CSS'i (forumun kendi surumu): yalnizca .fl-scope icinde gecerli olacak sekilde derlenir
const less = (await import('less')).default;
const entry = `@import "common/variables.less";\n@import "common/mixins.less";\n.fl-scope { @import (multiple) "forum.less"; }`;
const fa = path.join(here, 'node_modules/@fortawesome/fontawesome-free');
const res = await less.render(entry, { paths: [path.join(here, 'vendor/flarum-core/less'), path.join(fa, 'css')], filename: 'fl.less', javascriptEnabled: true, globalVars: { 'fa-bundled-fonts': 'true' } });
let css = res.css
  .replace(/\.fl-scope\s+:root/g, '.fl-scope')
  .replace(/\.fl-scope\s+(html|body)\b/g, '.fl-scope')
  .replace(/\.fl-scope\s+\.fl-scope/g, '.fl-scope')
  .replace(/\.fl-scope\s+\[data-theme/g, '.fl-scope[data-theme');
// Simge yazi tipleri CSS icine gomulur (uygulama cevrimdisi da dogru gorunsun); ttf yedekleri atilir
css = css.replace(/,\s*url\((['"]?)\.\.\/webfonts\/[^)]*\.ttf\1\)\s*format\((['"]?)truetype\2\)/g, '');
css = css.replace(/url\((['"]?)\.\.\/webfonts\/([^)'"]*\.woff2)\1\)/g, (_, q, f) => 'url(data:font/woff2;base64,' + fs.readFileSync(path.join(fa, 'webfonts', f)).toString('base64') + ')');
// @font-face .fl-scope icinde gecersizdir: disari tasi
const faces = css.match(/@font-face\s*\{[^}]*\}/g) || [];
css = faces.join('\n') + '\n' + css.replace(/@font-face\s*\{[^}]*\}/g, '');
fs.writeFileSync(path.join(out, 'forum-port.css'), css);
console.log('forum-port.js ve forum-port.css hazir');
