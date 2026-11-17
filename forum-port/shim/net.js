// Forum istekleri: webview'dan dogrudan degil, uygulamanin Rust katmani uzerinden (jetonla) gider.
const inv = (...a) => window.__TAURI__.core.invoke(...a);
export const ctx = { id: '', base: '' };

export function toPath(url) {
  const u = String(url);
  if (ctx.base && u.startsWith(ctx.base)) return u.slice(ctx.base.length) || '/';
  return u.startsWith('/') ? u : '/' + u;
}

export async function fwd(method, url, contentType, bytes) {
  const headers = { 'x-fid': ctx.id, 'x-method': method, 'x-path': encodeURIComponent(toPath(url)) };
  if (contentType) headers['x-ct'] = contentType;
  return inv('forum_fwd', bytes || new Uint8Array(0), { headers });
}

async function encodeBody(body, headers) {
  if (body == null) return { bytes: null, ct: '' };
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    const req = new Request('http://x.invalid/', { method: 'POST', body });
    return { bytes: new Uint8Array(await req.arrayBuffer()), ct: req.headers.get('content-type') || '' };
  }
  if (typeof body === 'string') return { bytes: new TextEncoder().encode(body), ct: (headers && (headers['Content-Type'] || headers['content-type'])) || 'text/plain' };
  return { bytes: new TextEncoder().encode(JSON.stringify(body)), ct: 'application/json' };
}

/** XMLHttpRequest yerine (build.mjs: define). Yukleme ilerlemesi uc noktalidir (basla/bitti). */
export class FramioXHR {
  constructor() { this.upload = {}; this.readyState = 0; this.status = 0; this.responseText = ''; this._h = {}; }
  open(method, url) { this._m = method; this._u = url; this.readyState = 1; }
  setRequestHeader(k, v) { this._h[k] = v; }
  getResponseHeader() { return null; }
  abort() { this._abort = true; if (this.onabort) this.onabort(); if (this.onloadend) this.onloadend(); }
  async send(body) {
    try {
      const { bytes, ct } = await encodeBody(body, this._h);
      this._prog(0.15);
      const r = await fwd(this._m, this._u, ct, bytes);
      if (this._abort) return;
      this._prog(1);
      this.status = r.status; this.responseText = r.body; this.readyState = 4;
      if (this.onload) this.onload();
    } catch (e) {
      if (this._abort) return;
      if (this.onerror) this.onerror(e);
    } finally {
      if (!this._abort && this.onloadend) this.onloadend();
    }
  }
  _prog(f) { if (this.upload.onprogress) this.upload.onprogress({ lengthComputable: true, loaded: Math.round(f * 100), total: 100 }); }
}
window.FramioXHR = FramioXHR;

/** Flarum'un app.request'i: JSON gonderir/alir, hatada Flarum gibi uyari gosterir. */
export function makeRequest(app) {
  return function request(opts) {
    let url = opts.url;
    if (opts.params && Object.keys(opts.params).length) url += (url.includes('?') ? '&' : '?') + m.buildQueryString(opts.params);
    return encodeBody(opts.body, opts.headers).then(({ bytes, ct }) => fwd((opts.method || 'GET').toUpperCase(), url, ct, bytes)).then((r) => {
      let data = null;
      try { data = r.body ? JSON.parse(r.body) : null; } catch (e) { data = null; }
      if (r.status >= 400) {
        const err = { status: r.status, response: data, responseText: r.body, options: opts, alert: null };
        const msg = (data && data.errors && data.errors[0] && (data.errors[0].detail || data.errors[0].title)) || (data && (data.error || data.message)) || `İstek başarısız (HTTP ${r.status})`;
        if (typeof opts.errorHandler === 'function') opts.errorHandler(err);
        else if (!opts.background && r.status !== 404) app.alerts.show({ type: 'error' }, String(msg));
        throw err;
      }
      return data;
    });
  };
}
