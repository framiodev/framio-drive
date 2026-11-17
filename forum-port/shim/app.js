// Flarum "app" nesnesinin, forum eklentisi kaynaklarinin kullandigi kismi.
import ModalManagerState from '../vendor/flarum-core/js/src/common/states/ModalManagerState';
import AlertManagerState from '../vendor/flarum-core/js/src/common/states/AlertManagerState';
import { makeRequest, ctx } from './net.js';

class FUser {
  constructor(d) { this.d = d || { id: '', attributes: {} }; }
  id() { return String(this.d.id); }
  attribute(k) { return (this.d.attributes || {})[k]; }
  username() { return this.attribute('username') || ''; }
  displayName() { return this.attribute('displayName') || this.username(); }
  avatarUrl() { return this.attribute('avatarUrl') || null; }
  color() { return null; }
  isAdmin() { return !!this.d.isAdmin; }
  preferences() { return this.attribute('preferences') || {}; }
}
class FTag { constructor(s) { this.s = s; } slug() { return this.s; } name() { return this.s; } }
class FDiscussion {
  constructor(d) { this.d = d; }
  id() { return String(this.d.id); }
  title() { return this.d.title || ''; }
  tags() { return (this.d.tags || []).map((s) => new FTag(s)); }
  user() { return null; }
}

const app = {
  data: { resources: [] },
  translator: { trans: (k) => (k === 'core.lib.modal.close' ? 'Kapat' : String(k).split('.').pop()), transText: (k) => String(k).split('.').pop() },
  alerts: new AlertManagerState(),
  modal: new ModalManagerState(),
  session: { user: null, csrfToken: 'framio' },
  forum: { attribute: (k) => (app._attrs || {})[k] },
  current: { get: (k) => (k === 'discussion' ? app._discussion : null) },
  composer: { body: { attrs: {} }, editor: { insertAtCursor: (t) => app._onInsert && app._onInsert(t) } },
  store: {
    async find(type, params) {
      if (type !== 'users') return [];
      const q = (params && params.filter && params.filter.q) || '';
      const r = await app.request({ method: 'GET', url: app.forum.attribute('apiUrl') + '/users?filter[q]=' + encodeURIComponent(q) + '&page[limit]=' + ((params && params.page && params.page.limit) || 6), background: true });
      return ((r && r.data) || []).map((u) => new FUser({ id: u.id, attributes: u.attributes }));
    },
  },
  screen: () => (window.innerWidth >= 1200 ? 'desktop-hd' : window.innerWidth >= 992 ? 'desktop' : window.innerWidth >= 768 ? 'tablet' : 'phone'),
};
app.request = makeRequest(app);

/** Forum bilgisini yukler (uygulamanin forum_meta yanitindan). */
app.configure = function (f) {
  ctx.id = f.id; ctx.base = f.base.replace(/\/$/, '');
  app._attrs = Object.assign({}, f.attrs || {}, { apiUrl: ctx.base + '/api', baseUrl: ctx.base });
  app.session.user = f.user ? new FUser(f.user) : null;
  app._discussion = f.discussion ? new FDiscussion(f.discussion) : null;
  app.composer.body.attrs = {};
  if (app._discussion) app.composer.body.attrs.discussion = app._discussion;
};
export default app;
export { FUser, FDiscussion };
