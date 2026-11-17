import app, { FDiscussion } from './app.js';
import './net.js';
import ModalManager from '../vendor/flarum-core/js/src/common/components/ModalManager';
import AlertManager from '../vendor/flarum-core/js/src/common/components/AlertManager';
import UploadButton from '../vendor/upload-exif/forum/components/UploadButton.js';
import AttributeModal, { prefetchAi } from '../vendor/upload-exif/forum/components/AttributeModal.js';
import WatermarkModal from '../vendor/upload-exif/forum/components/WatermarkModal.js';
import TopicModal from './TopicModal.js';
import CrosspostModal from '../vendor/crosspost/forum/components/CrosspostModal.tsx';

let root = null, btn = null, hooks = {};
let wrapped = false;
const themed = [];
const applyTheme = () => themed.forEach((e) => e.setAttribute('data-theme', document.documentElement.dataset.theme || 'dark'));

function ensureRoot() {
  if (root) return;
  root = document.createElement('div');
  root.className = 'fl-scope App';
  root.id = 'fl-root';
  root.style.display = 'contents';
  themed.push(root); applyTheme(); new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  document.body.appendChild(root);
  const mm = document.createElement('div'); mm.id = 'modal'; root.appendChild(mm);
  const al = document.createElement('div'); al.id = 'alerts'; root.appendChild(al);
  m.mount(mm, { view: () => m(ModalManager, { state: app.modal }) });
  m.mount(al, { view: () => m(AlertManager, { state: app.alerts }) });
}

/** Forumu hazirla: oturum kullanicisi, baslik, ag (crosspost) destegi */
export async function configure(f) {
  ensureRoot();
  app.configure(f);
  window.flarum = window.flarum || {};
  window.flarum.extensions = {};
  window.flarum.reg = { get: (ext, p) => (ext === 'framio-network-crosspost' && /CrosspostModal$/.test(p) ? { default: CrosspostModal } : null) };
  try {
    const r = await app.request({ method: 'GET', url: app.forum.attribute('apiUrl') + '/framio/crosspost/nodes', background: true });
    if (r && r.can_crosspost !== undefined) window.flarum.extensions['framio-network-crosspost'] = true;
  } catch (e) {}
  const c = (f.attrs && (f.attrs.themePrimaryColor)) || '';
  if (/^#[0-9a-f]{3,8}$/i.test(c)) root.style.setProperty('--primary-color', c);
}

/** Forumun kendi "Fotoğraf Yükle" bileşenini verilen elemana basar */
/** Ana uygulama: başlık seçimi için kancalar { suggest(files), search(q), pick(item), onTopic(d) } */
export function setHooks(h) { hooks = h || {}; }
function wrapModal() {
  if (wrapped) return; wrapped = true;
  const orig = app.modal.show.bind(app.modal);
  app.modal.show = (cls, attrs, stack) => {
    // Yeni yükleme akışı: başlık her seferinde İmza'dan sonra (Künye'den önce) sorulur
    if (cls === WatermarkModal) { app.setDiscussion(null); if (hooks.onTopic) hooks.onTopic(null); }
    if (cls === AttributeModal && !app._discussion && hooks.pick) {
      orig(TopicModal, {
        hooks, files: attrs.files,
        onpick: (d) => { app.setDiscussion(d); if (hooks.onTopic) hooks.onTopic(d); setTimeout(() => orig(cls, attrs, stack), 0); },
        oncancel: () => { if (attrs.oncancel) attrs.oncancel(); },
      });
      return;
    }
    return orig(cls, attrs, stack);
  };
}
export function mountUpload(el, h) {
  ensureRoot();
  el.classList.add('fl-scope'); themed.push(el); applyTheme();
  app._onInsert = h.onInsert;
  wrapModal();
  m.mount(el, { view: () => m(UploadButton, { editor: app.composer.editor, oncreate: (v) => { btn = v.state; } }) });
}

export function addFiles(files) {
  if (!btn) throw new Error('Yükleme bileşeni hazır değil');
  btn.process({ target: { files: Array.from(files) } });
}

export function openTopic() {
  wrapModal();
  app.modal.show(TopicModal, { hooks, files: [], onpick: (d) => { app.setDiscussion(d); if (hooks.onTopic) hooks.onTopic(d); }, oncancel: () => {} });
}
export const resolveAi = (file) => { const p = prefetchAi(file); return p ? p.then((r) => (r && r.data) || {}).catch(() => ({})) : Promise.resolve({}); };
export const getPostAs = () => app.composer.body.attrs.framioPostAs || null;
export const clearPostAs = () => { delete app.composer.body.attrs.framioPostAs; };
export const getCrosspostIntent = () => window.__framioCrosspostIntent || null;
export const request = (o) => app.request(o);
export const apiUrl = () => app.forum.attribute('apiUrl');
export { FDiscussion };

/** Yayimlanan yanita ortak paylasim niyetini uygular (forumdaki crosspostOnPublish.apply ile ayni mantik). */
export function applyCrosspost(res) {
  const d = res && res.data;
  const intent = window.__framioCrosspostIntent;
  if (!d || !intent || intent.mode !== 'payload' || !intent.payload || Date.now() - intent.at > 2 * 60 * 60 * 1000) return Promise.resolve(false);
  const html = (d.attributes && d.attributes.contentHtml) || '';
  if (intent.imageIds.length && !intent.imageIds.some((id) => html.includes(`data-id="${id}"`) || html.includes(`id=${id}`))) return Promise.resolve(false);
  window.__framioCrosspostIntent = null;
  const payload = { ...intent.payload };
  if (payload.excluded_image_indexes) {
    const byIndex = intent.imageIdsByIndex || [];
    payload.excluded_image_ids = payload.excluded_image_indexes.map((i) => byIndex[i]).filter(Boolean).map(Number);
    delete payload.excluded_image_indexes;
  }
  return app.request({ method: 'POST', url: app.forum.attribute('apiUrl') + '/framio/crosspost/outbound', body: { ...payload, post_id: d.id } }).then((r) => {
    const failed = ((r && r.results) || []).filter((x) => !x.success);
    if (failed.length) app.alerts.show({ type: 'error' }, 'Ortak paylaşım kısmen başarısız: ' + failed.map((x) => `${x.node}: ${x.error || 'hata'}`).join(' · '));
    else app.alerts.show({ type: 'success' }, 'Gönderi ortak paylaşımla diğer sitelere de aktarıldı.');
    return true;
  }).catch(() => { app.alerts.show({ type: 'error' }, 'Gönderi yayımlandı ama diğer sitelere aktarılamadı.'); return false; });
}
