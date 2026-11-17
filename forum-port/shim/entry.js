import app, { FDiscussion } from './app.js';
import './net.js';
import ModalManager from '../vendor/flarum-core/js/src/common/components/ModalManager';
import AlertManager from '../vendor/flarum-core/js/src/common/components/AlertManager';
import UploadButton from '../vendor/upload-exif/forum/components/UploadButton.js';
import CrosspostModal from '../vendor/crosspost/forum/components/CrosspostModal.tsx';

let root = null, btn = null;

function ensureRoot() {
  if (root) return;
  root = document.createElement('div');
  root.className = 'fl-scope App';
  root.id = 'fl-root';
  root.style.display = 'contents';
  const th = () => root.setAttribute('data-theme', document.documentElement.dataset.theme || 'dark');
  th(); new MutationObserver(th).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
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
export function mountUpload(el, hooks) {
  ensureRoot();
  app._onInsert = hooks.onInsert;
  m.mount(el, { view: () => m(UploadButton, { editor: app.composer.editor, oncreate: (v) => { btn = v.state; } }) });
}

export function addFiles(files) {
  if (!btn) throw new Error('Yükleme bileşeni hazır değil');
  btn.process({ target: { files: Array.from(files) } });
}

export const getPostAs = () => app.composer.body.attrs.framioPostAs || null;
export const clearPostAs = () => { delete app.composer.body.attrs.framioPostAs; };
export const getCrosspostIntent = () => window.__framioCrosspostIntent || null;
export const request = (o) => app.request(o);
export const apiUrl = () => app.forum.attribute('apiUrl');
export { FDiscussion };
