// Künye'den önce açılan "Başlık seç" penceresi. Forumdaki pencerelerle aynı Modal/Button bileşenlerini kullanır.
import Modal from '../vendor/flarum-core/js/src/common/components/Modal';
import Button from '../vendor/flarum-core/js/src/common/components/Button';
import LoadingIndicator from '../vendor/flarum-core/js/src/common/components/LoadingIndicator';

export default class TopicModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);
    this.hooks = this.attrs.hooks;
    this.items = [];
    this.sel = null;
    this.q = '';
    this.loading = true;
    this.busy = false;
    this.done = false;
    this.err = '';
    Promise.resolve(this.hooks.suggest(this.attrs.files))
      .then((l) => { this.items = l || []; if (this.items.length && !this.sel) this.sel = this.items[0]; })
      .catch(() => {})
      .finally(() => { this.loading = false; m.redraw(); });
  }
  className() { return 'TopicModal Modal--medium'; }
  title() { return 'Başlık Seç'; }
  onremove(vnode) { super.onremove(vnode); if (!this.done) this.attrs.oncancel && this.attrs.oncancel(); }
  search() {
    const q = this.q.trim(); if (!q) return;
    this.loading = true; m.redraw();
    Promise.resolve(this.hooks.search(q)).then((l) => { this.items = l || []; this.sel = this.items[0] || null; })
      .catch((e) => { this.err = String((e && e.message) || e); })
      .finally(() => { this.loading = false; m.redraw(); });
  }
  confirm() {
    if (!this.sel || this.busy) return;
    this.busy = true; m.redraw();
    Promise.resolve(this.hooks.pick(this.sel)).then((d) => { this.done = true; this.attrs.onpick(d); this.hide(); })
      .catch((e) => { this.busy = false; this.err = String((e && e.message) || e); m.redraw(); });
  }
  content() {
    return m('div', { className: 'Modal-body' }, [
      m('p', { className: 'helpText' }, 'Fotoğraf yapay zekâyla okundu; uygun başlıklar önerildi. İstersen değiştirebilir ya da arayabilirsin. Künye alanları başlığın türüne göre gelir.'),
      m('div', { className: 'Form-group', style: 'display:flex;gap:8px' }, [
        m('input', { className: 'FormControl', placeholder: 'Başlık ara ya da forum bağlantısını yapıştır', value: this.q, oninput: (e) => { this.q = e.target.value; }, onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); this.search(); } } }),
        m(Button, { className: 'Button', onclick: () => this.search() }, 'Ara'),
      ]),
      this.err ? m('div', { className: 'Alert Alert--error', style: 'margin-bottom:10px' }, this.err) : null,
      this.loading ? m('div', { style: 'padding:14px;text-align:center' }, [m(LoadingIndicator, { display: 'inline' }), m('div', { className: 'helpText' }, 'Başlıklar aranıyor…')])
        : this.items.length ? m('div', { className: 'Form-group' }, this.items.map((it) => m('button', {
          type: 'button', className: 'Button Button--block' + (this.sel === it ? ' Button--primary' : ''), style: 'display:block;width:100%;text-align:left;margin-bottom:6px;white-space:normal',
          onclick: () => { this.sel = it; },
        }, it.title)))
        : m('div', { className: 'helpText', style: 'padding:10px 0' }, 'Öneri bulunamadı; yukarıdan arayabilirsin.'),
      m('div', { className: 'Form-group' }, m(Button, { className: 'Button Button--primary Button--block', disabled: !this.sel || this.busy, loading: this.busy, onclick: () => this.confirm() }, 'Bu başlığa devam et')),
    ]);
  }
}
