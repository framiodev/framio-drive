import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import app from 'flarum/forum/app';

/**
 * Info (Meraklısına Info / Trivia) penceresi.
 *
 * Birden fazla Info eklenebilir; her biri ya gönderinin tamamına ya da
 * seçilen fotoğraflara aittir. Sonuç dizi olarak döner:
 *   [{ scope: 'all' | 'photos', photos: [0, 2], text: '…', formatted: '…' }]
 * Gönderi geneli Info eski biçimdedir (T R I V I A başlığı); sosyal paylaşım
 * ve ana sayfa lightbox'ı onu bu başlıktan tanır. Fotoğrafa özel Info
 * "📷 Fotoğraf N, M · Meraklısına Info" başlığıyla eklenir; SEO eklentisi bu
 * başlıktan Info'yu ilgili görsellere bağlar.
 */
export default class InfoModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);
    this.loading = false;
    this.onsubmitCallback = this.attrs.onsubmit;
    this.onbackCallback = this.attrs.onback;

    this.files = this.attrs.files || [];
    this.previews = this.files.map((f) => {
      try {
        return URL.createObjectURL(f);
      } catch (e) {
        return null;
      }
    });

    const initial = Array.isArray(this.attrs.initial) ? this.attrs.initial : [];
    this.entries = initial.length ? initial.map((e) => ({ ...e, photos: [...(e.photos || [])] })) : [this.newEntry()];
    this.active = 0;
  }

  onremove(vnode) {
    super.onremove(vnode);
    this.previews.forEach((u) => u && URL.revokeObjectURL(u));
  }

  newEntry(scope = 'all') {
    return { scope, photos: [], text: '' };
  }

  className() {
    return 'InfoModal Modal--large';
  }

  title() {
    return 'Info Ekle';
  }

  entry() {
    return this.entries[this.active];
  }

  label(e, i) {
    if (e.scope === 'all') return `Info ${i + 1} · Tüm gönderi`;
    return `Info ${i + 1} · ${e.photos.length ? 'Fotoğraf ' + e.photos.map((p) => p + 1).join(', ') : 'fotoğraf seçilmedi'}`;
  }

  content() {
    const e = this.entry();
    const multiPhoto = this.files.length > 1;
    const chip = (active) => ({
      padding: '6px 12px', borderRadius: '999px', border: '1px solid ' + (active ? '#1e293b' : '#e2e8f0'),
      background: active ? '#1e293b' : '#fff', color: active ? '#fff' : '#475569', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
    });

    return (
      <div className="Modal-body">
        {/* Info listesi */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {this.entries.map((x, i) => (
            <button type="button" style={chip(i === this.active)} onclick={() => { this.active = i; }}>
              {this.label(x, i)}
              {this.entries.length > 1 ? (
                <i className="fas fa-times" style={{ marginLeft: '8px', opacity: 0.7 }} title="Bu Info'yu kaldır"
                  onclick={(ev) => { ev.stopPropagation(); this.entries.splice(i, 1); this.active = Math.max(0, Math.min(this.active, this.entries.length - 1)); }}></i>
              ) : null}
            </button>
          ))}
          <button type="button" style={{ ...chip(false), borderStyle: 'dashed' }}
            onclick={() => { this.entries.push(this.newEntry(multiPhoto ? 'photos' : 'all')); this.active = this.entries.length - 1; }}>
            <i className="fas fa-plus" style={{ marginRight: '6px' }}></i> Info ekle
          </button>
        </div>

        {/* Kapsam: tüm gönderi / seçilen fotoğraflar */}
        {multiPhoto ? (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Bu Info nereye ait?</span>
              <div style={{ display: 'inline-flex', gap: '2px', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '2px', borderRadius: '999px' }}>
                {[['all', 'fas fa-align-left', 'Tüm gönderi'], ['photos', 'fas fa-images', 'Seçilen fotoğraflar']].map(([s, ic, t]) => (
                  <button type="button" onclick={() => { e.scope = s; }} style={{
                    padding: '4px 11px', border: 'none', borderRadius: '999px', cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                    background: e.scope === s ? '#1e293b' : 'transparent', color: e.scope === s ? '#fff' : '#64748b',
                  }}>
                    <i className={ic} style={{ marginRight: '5px', fontSize: '10px' }}></i>{t}
                  </button>
                ))}
              </div>
            </div>

            {e.scope === 'photos' ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                {this.files.map((f, i) => {
                  const on = e.photos.includes(i);
                  return (
                    <div title={f.name} onclick={() => { on ? e.photos.splice(e.photos.indexOf(i), 1) : e.photos.push(i); e.photos.sort((a, b) => a - b); }}
                      style={{ position: 'relative', width: '72px', height: '54px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                        border: on ? '3px solid #3b82f6' : '1px solid #cbd5e1', opacity: on ? 1 : 0.65 }}>
                      {this.previews[i] ? <img src={this.previews[i]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                      <span style={{ position: 'absolute', left: '4px', top: '3px', background: 'rgba(0,0,0,.65)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '8px' }}>{i + 1}</span>
                      {on ? <i className="fas fa-check-circle" style={{ position: 'absolute', right: '4px', bottom: '4px', color: '#3b82f6', background: '#fff', borderRadius: '50%' }}></i> : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="Rich-Toolbar" style={{ display: 'flex', gap: '5px', padding: '5px', border: '1px solid #ddd', borderBottom: 'none', background: '#f9f9f9', borderRadius: '4px 4px 0 0', flexWrap: 'wrap' }}>
          {this.renderButton('bold', 'fa fa-bold', 'Kalın')}
          {this.renderButton('italic', 'fa fa-italic', 'İtalik')}
          {this.renderButton('strikethrough', 'fa fa-strikethrough', 'Üstü Çizili')}
          <div style={{ width: '1px', background: '#ccc', margin: '0 5px' }}></div>
          {this.renderButton('url', 'fa fa-link', 'Bağlantı')}
          {this.renderButton('quote', 'fa fa-quote-right', 'Alıntı')}
          {this.renderButton('code', 'fa fa-code', 'Kod')}
          <div style={{ width: '1px', background: '#ccc', margin: '0 5px' }}></div>
          {this.renderButton('list', 'fa fa-list-ul', 'Madde İşareti')}
          {this.renderButton('numlist', 'fa fa-list-ol', 'Numaralı Liste')}
          <div style={{ width: '1px', background: '#ccc', margin: '0 5px' }}></div>
          <div className="Toolbar-Item" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <label htmlFor="txtColor" style={{ margin: 0, cursor: 'pointer', padding: '5px' }} title="Metin Rengi">
              <i className="fa fa-palette"></i>
            </label>
            <input type="color" id="txtColor" onchange={(ev) => this.insertColor(ev.target.value)} style={{ width: '20px', height: '20px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} />
          </div>
        </div>

        <div className="Form-group">
          <textarea
            className="FormControl"
            rows="9"
            value={e.text}
            oninput={(ev) => { e.text = ev.target.value; }}
            id="infoTextArea"
            placeholder={e.scope === 'photos' ? 'Seçilen fotoğraflara özel bilgileri buraya girin…' : 'Gönderinin tamamı için detaylı bilgileri buraya girin…'}
            style={{ borderRadius: '0 0 4px 4px', fontFamily: 'monospace' }}
            disabled={this.loading}
          />
        </div>

        <div className="Form-group" style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
          <Button className="Button Button--text" icon="fas fa-arrow-left" onclick={this.back.bind(this)} disabled={this.loading}>
            Künye Ekranına Dön
          </Button>
          <Button className="Button Button--primary" onclick={this.submit.bind(this)} loading={this.loading}>
            Info'yu Tamamla ve Bitir
          </Button>
        </div>
      </div>
    );
  }

  renderButton(type, iconClass, title) {
    return (
      <button className="Button Button--icon Button--link" type="button" title={title} onclick={() => this.formatText(type)}>
        <i className={iconClass}></i>
      </button>
    );
  }

  wrapSelection(before, after) {
    const textarea = document.getElementById('infoTextArea');
    const e = this.entry();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    e.text = e.text.substring(0, start) + before + e.text.substring(start, end) + after + e.text.substring(end);
    m.redraw();
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 50);
  }

  formatText(type) {
    const map = {
      bold: ['[b]', '[/b]'], italic: ['[i]', '[/i]'], strikethrough: ['[s]', '[/s]'], url: ['[url]', '[/url]'],
      quote: ['[quote]', '[/quote]'], code: ['[code]', '[/code]'], list: ['[list]\n[*]', '\n[/list]'], numlist: ['[list=1]\n[*]', '\n[/list]'],
    };
    if (map[type]) this.wrapSelection(map[type][0], map[type][1]);
  }

  insertColor(colorHex) {
    this.wrapSelection(`[color=${colorHex}]`, '[/color]');
  }

  /** Dolu Info'lar, yerleştirmeye hazır biçimde */
  result() {
    return this.entries
      .filter((e) => e.text.trim() !== '' && (e.scope === 'all' || e.photos.length))
      .map((e) => {
        const quoted = e.text.split('\n').map((line) => '> ' + line).join('\n');
        const formatted = e.scope === 'all'
          // Eski biçim korunur (sosyal paylaşım ve lightbox bu başlığı tanır)
          ? `> [b][i]T R I V I A[/i][/b]\n> \n${quoted}`
          : `> **📷 Fotoğraf ${e.photos.map((p) => p + 1).join(', ')} · Meraklısına Info**\n>\n${quoted}`;
        return { scope: e.scope, photos: [...e.photos], text: e.text, formatted };
      });
  }

  finish(value) {
    const done = () => {
      this.loading = false;
      if (this.onsubmitCallback) this.onsubmitCallback(value);
      app.modal.close();
    };
    if (this.attrs.uploadPromise) {
      this.loading = true;
      m.redraw();
      this.attrs.uploadPromise.then(done).catch(() => {
        this.loading = false;
        m.redraw();
      });
    } else {
      done();
    }
  }

  submit(e) {
    e.preventDefault();
    const invalid = this.entries.find((x) => x.text.trim() !== '' && x.scope === 'photos' && !x.photos.length);
    if (invalid) {
      this.active = this.entries.indexOf(invalid);
      app.alerts.show({ type: 'error' }, 'Fotoğrafa özel Info için en az bir fotoğraf seçin.');
      return;
    }
    this.finish(this.result());
  }

  back(e) {
    e.preventDefault();
    if (this.onbackCallback) this.onbackCallback(this.entries);
  }

  // Çarpı (X) ile kapatılırsa Info'suz tamamlanır
  hide() {
    if (this.loading) return;
    this.finish([]);
  }
}
