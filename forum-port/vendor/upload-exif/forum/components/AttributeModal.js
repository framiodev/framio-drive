import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import Stream from 'flarum/common/utils/Stream';
import app from 'flarum/forum/app';
import CustomizePostModal from './CustomizePostModal';
import { fileUrl, warm, drawThumb, drawPreview } from '../utils/previewCache';

// Formdaki bütün eylem düğmeleri aynı ölçüde (sol ve sağ sütun alt hizası eşit kalsın)
const BTN = { height: '44px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: 0, lineHeight: 1 };

const CUSTOM_CSS = `
    .AttributeModal, .AttributeModal .Modal-dialog, .AttributeModal .Modal-content {
        transform: none !important;
        filter: none !important;
        will-change: auto !important;
    }
    .AttributeModal .Modal-content { border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); overflow: hidden; }
    .AttributeModal .Modal-header { padding: 16px 24px; border-bottom: 1px solid #f0f0f0; background: #fff; }
    .AttributeModal .Modal-title { font-size: 1.25em; font-weight: 700; color: #333; }
    
    .Attribute-Layout {
        display: flex;
        flex-direction: column;
        padding: 0 24px 24px 24px;
        gap: 30px;
        background: #fdfdfd;
    }
    @media (min-width: 900px) {
        .AttributeModal .Modal-dialog { max-width: 1400px !important; width: 90vw !important; }
        .Attribute-Layout { flex-direction: row; }
        .Attribute-Left { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; }
        .Attribute-Right { width: 380px; flex-shrink: 0; display: flex; flex-direction: column; }
        .Attribute-Right::-webkit-scrollbar { width: 6px; }
        .Attribute-Right::-webkit-scrollbar-track { background: transparent; }
        .Attribute-Right::-webkit-scrollbar-thumb { background: #dcdfe6; border-radius: 4px; }
    }
    
    .Attribute-preview-area {
        position: relative;
        width: 100%;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        background: #f4f6f8;
        border-radius: 12px;
        border: 1px solid #e1e4e8;
        padding: 0;
        box-shadow: inset 0 2px 10px rgba(0,0,0,0.02);
        overflow: hidden;
    }
    .Attribute-preview-area img, .Attribute-preview-area canvas.Attribute-previewImg {
        max-width: 100%;
        max-height: 650px;
        width: auto;
        height: auto;
        display: block;
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        cursor: zoom-in;
    }
    .Attribute-preview-area canvas.Attribute-previewImg:not(.is-ready) { min-width: 320px; min-height: 220px; background: #e9edf1; }
    
    .Form-group { margin-bottom: 15px; }
    .Form-group label { font-size: 13px; font-weight: 600; color: #5c6b77; margin-bottom: 6px; display: block; }
    .FormControl {
        background: #fff; border: 1px solid #dcdfe6; border-radius: 8px;
        padding: 10px 12px; font-size: 14px; color: #333; box-shadow: 0 2px 6px rgba(0,0,0,0.02);
        transition: all 0.2s ease; width: 100%; height: auto; min-height: 42px; line-height: 1.5; box-sizing: border-box;
    }
    .Attribute-strip { display: flex; gap: 8px; overflow-x: auto; padding: 10px 2px 6px; margin-top: 10px; width: 100%; scroll-behavior: smooth; touch-action: pan-x; }
    .Attribute-strip::-webkit-scrollbar { height: 6px; } .Attribute-strip::-webkit-scrollbar-thumb { background: #dcdfe6; border-radius: 4px; }
    .Attribute-thumb { position: relative; flex: 0 0 auto; width: 84px; height: 62px; border-radius: 8px; overflow: hidden; border: 2px solid transparent; cursor: grab; user-select: none; touch-action: none; background: #e9edf1; transition: transform .12s ease, border-color .12s ease, opacity .12s; }
    .Attribute-thumb canvas { width: 100%; height: 100%; display: block; pointer-events: none; }
    .Attribute-thumb b { position: absolute; left: 4px; top: 4px; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 9px; background: rgba(0,0,0,.65); color: #fff; font-size: 11px; line-height: 18px; text-align: center; }
    .Attribute-thumb.is-active { border-color: var(--primary-color, #1565c0); }
    .Attribute-thumb.is-dragging { opacity: .45; cursor: grabbing; }
    .Attribute-thumb.is-target { transform: scale(1.06); border-color: #f59e0b; }
    .Attribute-thumbPh { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; color: #94a3b8; }
    .FormControl:focus { border-color: var(--primary-color, #1565c0); box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.15); outline: none; }
    .AttributeModal .FormControl { transition: border-color .15s ease, box-shadow .15s ease; }
    .Attribute-Right.is-ai-checking .FormControl:placeholder-shown { border-color: color-mix(in srgb, var(--primary-color) 35%, transparent); }
    .Attribute-Right.is-ai-checking .FormControl::placeholder { color: var(--primary-color); font-style: italic; }
`;



function escapeRe(v) {
  return String(v || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Metni seçenekler arasında en iyi eşleşene bağlar (birebir → içerme → ortak kelime) */
function bestMatch(text, options) {
  const norm = (v) => String(v || '').toLocaleLowerCase('tr-TR').replace(/[^a-z0-9çğıöşü]+/g, ' ').trim();
  const t = norm(text);
  if (!t) return '';
  let found = options.find((o) => norm(o) === t);
  if (found) return found;
  found = options.filter((o) => norm(o).includes(t) || t.includes(norm(o))).sort((a, b) => Math.abs(norm(a).length - t.length) - Math.abs(norm(b).length - t.length))[0];
  if (found) return found;
  const words = t.split(' ');
  let best = '';
  let score = 0;
  options.forEach((o) => {
    const ow = norm(o).split(' ');
    const sc = ow.filter((w) => words.includes(w)).length / Math.max(ow.length, words.length);
    if (sc > score) {
      score = sc;
      best = o;
    }
  });
  return score >= 0.5 ? best : '';
}

/** Framio AI için görseli en fazla 768 px JPEG'e küçültür (başarısızsa özgün dosya) */
function shrinkForAi(file, max = 768) {
  if (!file || !window.createImageBitmap || !/^image\//.test(file.type || 'image/')) return Promise.resolve(file);
  return createImageBitmap(file)
    .then((bmp) => {
      const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bmp.width * scale);
      canvas.height = Math.round(bmp.height * scale);
      canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
      if (bmp.close) bmp.close();
      return new Promise((resolve) => canvas.toBlob((b) => resolve(b || file), 'image/jpeg', 0.82));
    })
    .catch(() => file);
}

/**
 * Framio AI isteği: dosya seçilince (imza ekranı açılırken) başlatılır, aynı dosya için tekrar istenirse
 * süren/biten istek paylaşılır. Böylece künye penceresi açıldığında sonuç çoğunlukla hazırdır.
 */
const aiRequests = new WeakMap();
const aiDeep = new WeakMap();
export function prefetchAi(file, deep = false) {
  const store = deep ? aiDeep : aiRequests;
  if (!file || app.forum.attribute('framio-upload-exif.ai_enabled') === '0') return null;
  if (store.has(file)) return store.get(file);
  const formData = new FormData();
  if (deep) formData.append('deep', '1');
  const discussion = app.current && typeof app.current.get === 'function' ? app.current.get('discussion') : null;
  if (discussion && discussion.id) {
    formData.append('discussion_id', discussion.id());
    const tags = discussion.tags && discussion.tags();
    const slug = Array.isArray(tags) && tags[0] && tags[0].slug ? tags[0].slug() : '';
    if (slug) formData.append('tag_slug', slug);
  }
  const p = shrinkForAi(file).then((small) => {
    formData.append('image', small, 'ai.jpg');
    // Küçültülen görselde EXIF kalmaz: GPS ve çekim zamanı için dosyanın başı ayrıca gider
    if (file.slice) formData.append('exif_head', file.slice(0, 256 * 1024), 'head.jpg');
    if (file.name) formData.append('file_name', file.name);
    return app.request({ method: 'POST', url: app.forum.attribute('apiUrl') + '/framio-media/analyze-ai', body: formData });
  });
  p.catch(() => store.delete(file));
  store.set(file, p);
  // Hızlı okuma ile birlikte doğruluk kipi de başlar (güçlü model marka/modeli doğrular)
  if (!deep) prefetchAi(file, true);
  return p;
}

/** Yazım standardı (admin): alan → (katlanmış varyant → doğru yazım); sunucudaki CanonRules ile aynı kurallar */
const FOLD_MAP = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'i̇': 'i' };
const foldName = (s) => String(s || '').toLocaleLowerCase('tr').replace(/i̇|[çğıöşü]/g, (c) => FOLD_MAP[c] || c).replace(/[^a-z0-9]+/g, ' ').trim();
let canonCache = null;
function canonRules() {
  const raw = app.forum.attribute('framio-upload-exif.canon_rules') || '';
  if (canonCache && canonCache.raw === raw) return canonCache.map;
  const fields = { firma: 'company', marka: 'brand', model: 'model', yer: 'location' };
  const map = {};
  raw.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*(firma|marka|model|yer)\s*:\s*(.+?)\s*=>\s*(.+?)\s*$/i);
    if (!m) return;
    const f = fields[m[1].toLowerCase()];
    m[2].split(',').forEach((v) => { const k = foldName(v); if (k && k !== foldName(m[3])) (map[f] = map[f] || {})[k] = m[3].trim(); });
  });
  canonCache = { raw, map };
  return map;
}
export function canonValue(field, value) {
  const v = String(value || '').trim();
  if (!v) return value;
  const r = canonRules()[field];
  return (r && r[foldName(v)]) || value;
}

export default class AttributeModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);

    this.injectStyles();

    const initial = this.attrs.initialValues || {};
    this.files = this.attrs.files || [];
    this.session = this.attrs.session || {};
    this.isConfirmed = false;
    
    this.previewUrl = Stream(null);
    this.isZoomed = Stream(false);

    // === TEK / BİRDEN ÇOK AÇIKLAMA (çoklu fotoğraf) ===
    // single: tek künye tüm fotoğraflar için (varsayılan, eski davranış)
    // multi : her fotoğrafın kendi künyesi; önizlemede kaydırınca bir
    //         künye formu boş gelir (çekim yeri/yılı korunur, plaka dosya adından).
    this.captionMode = Stream(initial.captionMode === 'multi' && this.files.length > 1 ? 'multi' : 'single');
    this.photoIndex = Math.min(initial.photoIndex || 0, Math.max(0, this.files.length - 1));
    this.photoData = Array.isArray(initial.photoData) ? initial.photoData.map(d => (d ? JSON.parse(JSON.stringify(d)) : null)) : [];
    this.previewUrls = [];

    if (this.files.length > 0) {
        this.showPhoto(this.photoIndex);
    }

    // Dosya adından plaka çekme
    const filename = (this.session.result && this.session.result.customFileNames) 
        ? this.session.result.customFileNames[0] 
        : (this.files[0] ? this.files[0].name : '');
    
    let initialPlate = initial.plate || '';
    if (!initialPlate && filename) {
        const match = filename.match(/([0-9]{2})\s*([A-Za-z]{1,3})\s*([0-9]{2,4})/);
        if (match) {
            initialPlate = match[1] + ' ' + match[2].toUpperCase() + ' ' + match[3];
        }
    }

    this.company = Stream(initial.company || '');
    this.plate = Stream(initialPlate);
    this.brand = Stream(initial.brand || '');
    this.model = Stream(initial.model || '');
    this.location = Stream(initial.location || '');
    this.year = Stream(initial.year || '');

    // Gönderi Özelleştirme (Müzik & Konum)
    this.customMusic = Stream(initial.customMusic || null);
    this.customGps = Stream(initial.customGps || null);
    // Birden Çok modunda müzik/konum: 'all' tüm gönderiye, 'photo' her fotoğrafa ayrı
    this.customScope = Stream(initial.customScope === 'photo' ? 'photo' : 'all');

    // ŞEHİRİÇİ ULAŞIM ALANLARI
    this.city = Stream(initial.city || '');
    this.route = Stream(initial.route || '');
    this.fleetCode = Stream(initial.fleetCode || '');
    this.cityList = [];
    this.cityRoutes = [];
    this.isLoadingCityRoutes = false;
    this.isCustomCity = false;
    this.isCustomRoute = false;
    this.isAnalyzingAi = false;

    // === DİNAMİK KATEGORİ ŞEMASI ===
    this.categorySchema = null;
    this.dynamicFields = {}; // Dinamik alanların değerlerini tutar
    this.isLoadingSchema = false;

    // Şehiriçi Modu Kontrolü
    const cityTagSlug = app.forum.attribute('framio-upload-exif.city_tag_slug') || 'sehirici-ulasim-araclari-fotograflari';
    this.isCityMode = false;
    this._currentTagSlugs = []; // Konunun tag slug'ları

    if (!this.attrs.globalContext && app.current && typeof app.current.get === 'function') {
        const discussion = app.current.get('discussion');
        if (discussion) {
            const tags = discussion.tags();
            if (Array.isArray(tags)) {
                this._currentTagSlugs = tags.map(t => (t && typeof t.slug === 'function') ? t.slug() : '').filter(Boolean);
                this.isCityMode = tags.some(t => {
                    const s = (t && typeof t.slug === 'function') ? t.slug() : '';
                    return s === cityTagSlug || s.includes('sehirici') || s.includes('sehir-ici');
                });
            }
        }
    }
    if (!this.isCityMode) {
        const path = window.location.pathname;
        if (path.includes(cityTagSlug) || path.includes('sehirici') || path.includes('sehir-ici')) {
            this.isCityMode = true;
        }
    }

    if (this.isCityMode) {
        this.loadCitiesAndRoutes();
    }

    // Dinamik kategori şeması yüklemeyi dene
    this.loadCategorySchema();

    // İlk görselden EXIF Yılı çekme
    if (!initial.year && this.files.length > 0) {
        this.readExifYear(this.files[0]);
    }

    this.taxonomy = [];
    this.availableModels = [];
    this.isLoadingTaxonomy = true;
    this.loadTaxonomy();

    // Otomatik Framio AI Analizi (Anlık Doldurma)
    // Framio AI durumu + yükleme çubuğu gibi ilerleyen yüzde (yanıt akışı olmadığından süreye göre; yanıt gelince %100)
    const aiState = Stream('idle'); // 'idle' | 'analyzing' | 'success' | 'error'
    this.aiPct = 0;
    this.aiBarVisible = false;
    this.aiStatus = (v) => {
        if (v === undefined) return aiState();
        const prev = aiState();
        aiState(v);
        if (v === 'analyzing') {
            clearInterval(this.aiTimer);
            clearTimeout(this.aiHide);
            this.aiPct = 0;
            this.aiBarVisible = true;
            const t0 = Date.now();
            this.aiTimer = setInterval(() => {
                this.aiPct = Math.min(95, Math.round(95 * (1 - Math.exp(-(Date.now() - t0) / 2200))));
                m.redraw();
            }, 120);
        } else if (prev === 'analyzing') {
            clearInterval(this.aiTimer);
            this.aiPct = 100;
            // Sonuç kısa süre çubukta kalır; doldurulan alan yoksa kendiliğinden kapanır
            this.aiHide = setTimeout(() => { if (aiState() !== 'analyzing') { this.aiBarVisible = v === 'success' || v === 'error'; m.redraw(); } }, v === 'idle' ? 1200 : 0);
        } else if (v === 'idle') {
            this.aiBarVisible = false;
        }
        return v;
    };
    this.aiMessage = Stream('');
    if (app.forum.attribute('framio-upload-exif.ai_enabled') !== '0' && this.files.length > 0) {
        this.autoAnalyzeWithAi();
    }

    this.onsubmitCallback = this.attrs.onsubmit;
    this.onskipCallback = this.attrs.onskip;
    this.onInfoCallback = this.attrs.onInfo;
    this.oncancelCallback = this.attrs.oncancel;
    this.ongobackCallback = this.attrs.ongoback;

    this.initCrosspost();
  }

  // === ORTAK PAYLAŞ (Framio Network Crosspost) ===
  // Aktarım penceresi yükleme sırasında açılır (ertelenmiş mod): hedef site, konu
  // ve imza burada seçilir, gönderi yayımlanınca crosspostOnPublish.js aktarır.
  initCrosspost() {
      this.crosspostNodes = null;
      this.crosspost = (this.attrs.session && this.attrs.session.crosspost) || { mode: 'off', payload: null };
      if (!window.flarum || !flarum.extensions || !flarum.extensions['framio-network-crosspost'] || !app.session.user) return;
      app.request({ method: 'GET', url: app.forum.attribute('apiUrl') + '/framio/crosspost/nodes' })
          .then((res) => {
              if (!res.can_crosspost || !(res.nodes || []).length) return;
              this.crosspostNodes = res.nodes;
              m.redraw();
          })
          .catch(() => {});
  }

  syncCrosspost() {
      if (this.attrs.session) this.attrs.session.crosspost = { ...this.crosspost };
  }

  crosspostActive() {
      return !!(this.crosspost && this.crosspost.mode === 'payload' && this.crosspost.payload);
  }

  openCrosspost() {
      let CrosspostModal = null;
      try {
          const mod = flarum.reg.get('framio-network-crosspost', 'forum/components/CrosspostModal');
          CrosspostModal = mod && (mod.default || mod);
      } catch (e) {}
      if (!CrosspostModal) return;

      // Yanıt yazılıyorsa bulunulan tartışma (eşleşme için); yeni konuda yok
      const body = app.composer && app.composer.body;
      const discussion = (body && body.attrs && body.attrs.discussion) || null;
      const previewImages = this.files.map((f, i) => fileUrl(f));

      app.modal.show(CrosspostModal, {
          deferred: true,
          discussion,
          isReply: !!discussion,
          previewImages,
          initialPayload: this.crosspostActive() ? this.crosspost.payload : null,
          onconfirm: (payload) => {
              this.crosspost = payload ? { mode: 'payload', payload } : { mode: 'off', payload: null };
              this.syncCrosspost();
              m.redraw();
          },
      }, true); // üst üste: künye formu açık kalır
  }

  clearCrosspost(e) {
      if (e) e.stopPropagation();
      this.crosspost = { mode: 'off', payload: null };
      this.syncCrosspost();
  }
  hide() {
      if (!this.isConfirmed) {
          if (confirm("Yükleme İşlemi İptal Edilecektir. Onaylıyor Musunuz?")) {
              if (this.oncancelCallback) this.oncancelCallback();
              super.hide();
          }
      } else {
          super.hide();
      }
  }

  readExifYear(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
          const view = new DataView(e.target.result);
          if (view.getUint16(0, false) !== 0xFFD8) return; // Not JPEG
          let offset = 2;
          while (offset < view.byteLength - 2) {
              if (view.getUint16(offset, false) === 0xFFE1) { // APP1 EXIF
                  const exifOffset = offset + 4;
                  const tiffOffset = exifOffset + 6; // Skip "Exif\0\0"
                  const isLittle = view.getUint16(tiffOffset, false) === 0x4949;
                  const idfOffset = view.getUint32(tiffOffset + 4, isLittle);
                  
                  const parseIfd = (startOffset) => {
                      const tags = view.getUint16(startOffset, isLittle);
                      for (let i = 0; i < tags; i++) {
                          const tagOffset = startOffset + 2 + (i * 12);
                          if (view.getUint16(tagOffset, isLittle) === 0x9003) { // DateTimeOriginal
                              const valOffset = view.getUint32(tagOffset + 8, isLittle);
                              let dateString = '';
                              for (let j = 0; j < 4; j++) dateString += String.fromCharCode(view.getUint8(tiffOffset + valOffset + j));
                              if (dateString && !isNaN(parseInt(dateString))) {
                                  this.year(dateString);
                                  m.redraw();
                              }
                              return true;
                          }
                      }
                      return false;
                  };

                  const ifd0 = tiffOffset + idfOffset;
                  const tags = view.getUint16(ifd0, isLittle);
                  for (let i = 0; i < tags; i++) {
                      const tagOffset = ifd0 + 2 + (i * 12);
                      if (view.getUint16(tagOffset, isLittle) === 0x8769) { // Exif Offset
                          parseIfd(tiffOffset + view.getUint32(tagOffset + 8, isLittle));
                          break;
                      }
                  }
                  break;
              }
              offset += 2 + view.getUint16(offset + 2, false);
          }
      };
      reader.readAsArrayBuffer(file.slice(0, 128 * 1024));
  }

  injectStyles() {
      if (!document.getElementById('attribute-modal-css')) {
          const style = document.createElement('style');
          style.id = 'attribute-modal-css';
          style.innerHTML = CUSTOM_CSS;
          document.head.appendChild(style);
      }
  }

  // Dinamik kategori şemasını API'den yükle
  loadCategorySchema() {
      if (!this._currentTagSlugs || this._currentTagSlugs.length === 0) return;

      // Her tag slug için kategori şeması ara, ilk eşleşeni kullan
      const trySlug = (index) => {
          if (index >= this._currentTagSlugs.length) return;
          const slug = this._currentTagSlugs[index];

          this.isLoadingSchema = true;
          const discussionId = this.discussion ? this.discussion.id() : null;
          app.request({
              method: 'GET',
              url: app.forum.attribute('apiUrl') + '/framio-media/category-schemas',
              params: { tag_slug: slug, discussion_id: discussionId }
          }).then(res => {
              this.isLoadingSchema = false;
              if (res.data && res.data.fields_config) {
                  this.categorySchema = res.data;
                  const fieldsConfig = typeof res.data.fields_config === 'string'
                      ? JSON.parse(res.data.fields_config)
                      : res.data.fields_config;

                  // Dinamik alan değerlerini başlat
                  if (Array.isArray(fieldsConfig)) {
                      fieldsConfig.forEach(f => {
                          if (!this.dynamicFields[f.key]) {
                              // Mevcut uyumlu alanlarla eşleştir
                              if (f.key === 'company' && this.company()) this.dynamicFields[f.key] = this.company();
                              else if (f.key === 'plate' && this.plate()) this.dynamicFields[f.key] = this.plate();
                              else if (f.key === 'brand' && this.brand()) this.dynamicFields[f.key] = this.brand();
                              else if (f.key === 'model' && this.model()) this.dynamicFields[f.key] = this.model();
                              else if (f.key === 'location' && this.location()) this.dynamicFields[f.key] = this.location();
                              else if (f.key === 'year' && this.year()) this.dynamicFields[f.key] = this.year();
                              else if (f.key === 'city' && this.city()) this.dynamicFields[f.key] = this.city();
                              else if (f.key === 'route' && this.route()) this.dynamicFields[f.key] = this.route();
                              else if (f.key === 'fleetCode' && this.fleetCode()) this.dynamicFields[f.key] = this.fleetCode();
                              else this.dynamicFields[f.key] = '';
                          }
                      });

                      // Şehir seçici varsa şehirleri yükle
                      if (fieldsConfig.some(f => f.type === 'city_select') && !this.isCityMode) {
                          this.loadCitiesAndRoutes();
                      }
                  }
                  m.redraw();
              } else {
                  // Bu slug'da bulunamadı, sonraki slug'ı dene
                  trySlug(index + 1);
              }
          }).catch(() => {
              this.isLoadingSchema = false;
              trySlug(index + 1);
          });
      };

      trySlug(0);
  }

  autoAnalyzeWithAi() {
      if (!this.files || this.files.length === 0) return;
      this.isAnalyzingAi = true;
      this.aiStatus('analyzing');
      this.aiMessage('Yapay zeka görseli analiz ediyor ve künye bilgilerini dolduruyor...');
      m.redraw();

      // Analiz genelde imza ekranında başlamış olur (prefetchAi); burada hazır sonuç alınır
      (prefetchAi(this.files[0]) || Promise.reject()).then(res => {
          this.isAnalyzingAi = false;
          if (res && res.success === false) {
              // Yapılandırılmamış / kapalı: kullanıcıya hiçbir şey gösterme
              this.aiStatus(res.error ? 'error' : 'idle');
              this.aiMessage(res.error ? 'Yapay zeka şu an yanıt veremedi; alanları elle doldurabilirsiniz.' : '');
              if (res.error && app.session.user && app.session.user.isAdmin()) this.aiMessage(res.error);
              m.redraw();
              return;
          }
          if (res && res.data) {
              const ai = res.data;
              // AI'nın ham marka/modeli: kullanıcı onayda değiştirirse yazım eşlemesi öğrenilir
              this.aiRaw = { brand: ai.brand || '', model: ai.model || '' };
              let filledCount = 0;
              const aiKeys = ['company', 'plate', 'brand', 'model', 'location', 'year', 'city', 'route', 'fleetCode'];
              const before = aiKeys.map((k) => String(this[k]() || ''));
              const dynBefore = Object.assign({}, this.dynamicFields);

              // 1. Standart alanları doldur
              if (ai.company && (!this.company() || (res.history || []).includes('plate'))) {
                  this.company(ai.company);
                  filledCount++;
              }
              if (ai.plate && (!this.plate() || (res.history || []).includes('plate'))) {
                  this.plate(ai.plate);
                  filledCount++;
              }
              // Marka/model listesi varsa yapay zekanın yazımı listedeki seçeneğe eşlenir
              // (aksi halde açılır liste boş görünür). Geçmişten gelen bilgi varsa önceliklidir.
              const fromHistory = (res.history || []).includes('plate');
              if (ai.brand && (!this.brand() || fromHistory || this.isDefaultBrand)) {
                  const brands = this.getSortedBrands ? this.getSortedBrands() : [];
                  const brand = brands.length ? bestMatch(ai.brand, brands) : ai.brand;
                  if (brand) {
                      this.brand(brand);
                      this.updateModels(brand);
                      filledCount++;
                  }
              }
              if (ai.model && (!this.model() || fromHistory)) {
                  const options = (this.availableModels || []).map((x) => x.model);
                  const model = options.length ? bestMatch(String(ai.model).replace(new RegExp('^' + escapeRe(this.brand()) + '\\s+', 'i'), ''), options) : ai.model;
                  if (model) {
                      this.model(model);
                      filledCount++;
                  }
              }

              if ((ai.location || ai.location_guess) && !this.location()) {
                  const loc = ai.location || ai.location_guess;
                  this.location(loc);
                  if (!this.city()) this.city(ai.city || loc);
                  filledCount++;
              }
              if ((ai.year || ai.year_guess) && !this.year()) {
                  this.year(ai.year || ai.year_guess);
                  filledCount++;
              }
              if (ai.city && !this.city()) {
                  this.city(ai.city);
                  filledCount++;
              }
              if (ai.route && !this.route()) {
                  this.route(ai.route);
                  filledCount++;
              }
              if (ai.fleetCode && !this.fleetCode()) {
                  this.fleetCode(ai.fleetCode);
                  filledCount++;
              }

              // 2. Dinamik şema alanlarını doldur (Kategoriye özel alanlar)
              Object.keys(ai).forEach(key => {
                  if (ai[key] && !this.dynamicFields[key]) {
                      this.dynamicFields[key] = String(ai[key]).trim();
                  }
              });

              // Yapay zekânın doldurduğu değerler: bu değeri taşıyan kutular kalın kenarlıkla işaretlenir
              this.aiFilledVals = new Set();
              aiKeys.forEach((k, i) => { const v = String(this[k]() || '').trim(); if (v && v !== before[i].trim()) this.aiFilledVals.add(v); });
              Object.keys(this.dynamicFields).forEach((k) => { const v = String(this.dynamicFields[k] || '').trim(); if (v && dynBefore[k] !== this.dynamicFields[k]) this.aiFilledVals.add(v); });

              this.aiStatus(filledCount ? 'success' : 'idle');
              this.refineWithDeep(this.files[0]);
              const hist = res.history || [];
              const locLabel = { gps: 'çekim yeri fotoğrafın GPS bilgisinden', session: 'çekim yeri aynı çekim oturumundaki fotoğraflarınızdan', similar: 'çekim yeri forumdaki %' + Math.round(((res.similar && res.similar.score) || 0) * 100) + ' benzeyen fotoğraftan', ai_guess: 'çekim yeri tahmin, lütfen kontrol edin' }[res.location_source];
              const source = (locLabel ? ' · ' + locLabel : '') + (hist.includes('plate') ? ' (plaka forumda kayıtlı, bilgiler o künyeden)' : '');
              this.aiMessage(filledCount ? `${filledCount} alan dolduruldu${source}, kontrol etmeyi unutmayın.` : '');
          } else {
              this.aiStatus('idle');
          }
          m.redraw();
      }).catch(err => {
          this.isAnalyzingAi = false;
          this.aiStatus('idle');
          this.aiMessage('');
          m.redraw();
      });
  }

  /**
   * Doğruluk kipindeki yanıt gelince marka/model (kullanıcı değiştirmediyse) düzeltilir; kutu yine
   * Framio AI işaretiyle kalır ve sonuç çubuğunda belirtilir.
   */
  refineWithDeep(file) {
      const p = prefetchAi(file, true);
      if (!p) return;
      const before = { brand: this.brand(), model: this.model() };
      p.then((res) => {
          const ai = res && res.data;
          if (!ai || !ai.model || this.files[0] !== file) return;
          this.aiRaw = { brand: ai.brand || '', model: ai.model };
          if (this.brand() !== before.brand || this.model() !== before.model) return; // kullanıcı elle değiştirdi
          const brands = this.getSortedBrands ? this.getSortedBrands() : [];
          const brand = ai.brand ? (brands.length ? bestMatch(ai.brand, brands) : ai.brand) : this.brand();
          if (brand && brand !== this.brand()) { this.brand(brand); this.updateModels(brand); }
          const options = (this.availableModels || []).map((x) => x.model);
          const model = options.length ? bestMatch(String(ai.model).replace(new RegExp('^' + escapeRe(this.brand()) + '\\s+', 'i'), ''), options) : ai.model;
          if (!model || (model === before.model && brand === before.brand)) return;
          this.model(model);
          (this.aiFilledVals = this.aiFilledVals || new Set()).add(String(model).trim());
          if (brand) this.aiFilledVals.add(String(brand).trim());
          this.aiMessage('Marka/model doğrulama modeliyle düzeltildi: ' + (brand ? brand + ' ' : '') + model + '. Kontrol etmeyi unutmayın.');
          this.aiBarVisible = true;
          m.redraw();
      }).catch(() => {});
  }

  // === ÇOKLU AÇIKLAMA YARDIMCILARI ===
  isMulti() {
      return this.files.length > 1 && this.captionMode() === 'multi';
  }

  showPhoto(i) {
      if (!this.files[i]) return;
      // Arka planda küçültülmüş önizleme (imza modalında hazırlandıysa anında gelir)
      // Dosyanın paylaşılan adresi (imza modalında açılan görsel tarayıcı önbelleğinden anında gelir)
      this.previewUrls[i] = fileUrl(this.files[i]);
      this.previewUrl(this.previewUrls[i]);
      warm(this.files[i + 1]);
  }

  /** Künye alanlarının anlık kopyası (müzik/konum gönderi geneli olduğu için dahil değil) */
  snapshot() {
      return {
          company: this.company(), plate: this.plate(), brand: this.brand(), model: this.model(),
          location: this.location(), year: this.year(),
          city: this.city(), route: this.route(), fleetCode: this.fleetCode(),
          dynamicFields: { ...(this.dynamicFields || {}) },
          customMusic: this.customMusic(), customGps: this.customGps(),
      };
  }

  restoreSnapshot(s, quiet = false) {
      if (!s) return;
      this.company(s.company || ''); this.plate(s.plate || ''); this.brand(s.brand || ''); this.model(s.model || '');
      this.location(s.location || ''); this.year(s.year || '');
      this.city(s.city || ''); this.route(s.route || ''); this.fleetCode(s.fleetCode || '');
      this.dynamicFields = { ...(s.dynamicFields || {}) };
      if (this.customScope && this.customScope() === 'photo') { this.customMusic(s.customMusic || null); this.customGps(s.customGps || null); }
      if (!quiet && this.taxonomy && this.taxonomy.length) this.updateModels(s.brand || this.dynamicFields.brand || '');
  }

  plateFromFileName(i) {
      const names = this.session.result && this.session.result.customFileNames;
      const name = (names && names[i]) || (this.files[i] ? this.files[i].name : '');
      const match = name && name.match(/([0-9]{2})\s*([A-Za-z]{1,3})\s*([0-9]{2,4})/);
      return match ? match[1] + ' ' + match[2].toUpperCase() + ' ' + match[3] : '';
  }

  setCaptionMode(mode) {
      if (mode === this.captionMode()) return;
      if (mode === 'multi') {
          // Şu anki bilgiler ilk fotoğrafın künyesi olur
          this.photoData = [];
          this.photoData[0] = this.snapshot();
          this.photoIndex = 0;
          this.showPhoto(0);
      } else {
          // Tek açıklamaya dönüşte ilk fotoğrafın künyesi ortak künye olur
          if (this.photoData[0]) this.restoreSnapshot(this.photoData[0]);
          this.photoIndex = 0;
          this.showPhoto(0);
          this.customScope('all');
      }
      this.captionMode(mode);
      m.redraw();
  }

  /** Önizlemede gezinme: Birden Çok'ta künyesiyle birlikte, Tek'te yalnızca görsel */
  navPhoto(i) {
      if (i < 0 || i >= this.files.length || i === this.photoIndex) return;
      if (this.isMulti()) return this.goToPhoto(i);
      this.photoIndex = i;
      this.showPhoto(i);
      m.redraw();
  }

  /**
   * Fotoğrafı from → to konumuna taşır. Fotoğrafa bağlı her dizi (dosya, önizleme, künye, imza seçimi,
   * dosya adı) birlikte taşınır; arka planda süren yüklemeler ilk sıraya göre kaydedildiği için
   * session.order eşlemesi tutulur ve gönderiye eklerken bu sıra uygulanır (UploadButton.finishProcess).
   */
  movePhoto(from, to) {
      const n = this.files.length;
      if (from === to || from < 0 || to < 0 || from >= n || to >= n) return;
      if (this.isMulti()) this.photoData[this.photoIndex] = this.snapshot();

      const move = (arr) => {
          if (!Array.isArray(arr)) return;
          while (arr.length < n) arr.push(undefined);
          const [item] = arr.splice(from, 1);
          arr.splice(to, 0, item);
      };
      const current = this.photoIndex;
      move(this.files); // session.fileList ile aynı dizi
      move(this.previewUrls);
      move(this.photoData);
      const res = this.session && this.session.result;
      if (res) { move(res.selections); move(res.customFileNames); move(res.watermarkUrls); }
      if (this.session) {
          if (!this.session.order) this.session.order = Array.from({ length: n }, (_, k) => k);
          move(this.session.order);
      }

      // Seçili fotoğraf yerinde kalır (yalnızca konumu değişir)
      const next = current === from ? to : (from < current && to >= current ? current - 1 : (from > current && to <= current ? current + 1 : current));
      this.photoIndex = next;
      this.showPhoto(next);
      m.redraw();
  }

  /** Önizleme altında kaydırılabilir, sürükle-bırak ile sıralanabilir küçük resim şeridi */
  renderPhotoStrip() {
      const drag = this._drag;
      return (
          <div className="Attribute-strip" oncreate={(v) => { this._stripEl = v.dom; }}>
              {this.files.map((file, i) => {
                  const isDragging = drag && drag.active && drag.from === i;
                  const isTarget = drag && drag.active && drag.over === i && drag.from !== i;
                  return (
                      <div key={file.name + ':' + file.size + ':' + file.lastModified}
                          className={'Attribute-thumb' + (i === this.photoIndex ? ' is-active' : '') + (isDragging ? ' is-dragging' : '') + (isTarget ? ' is-target' : '')}
                          data-index={i}
                          title={(i + 1) + '. fotoğraf — sürükleyerek sıralayın'}
                          onpointerdown={(e) => this.stripPointerDown(e, i)}>
                          <canvas oncreate={(v) => drawThumb(v.dom, file)} onupdate={(v) => drawThumb(v.dom, file)}></canvas>
                          <b>{i + 1}</b>
                      </div>
                  );
              })}
          </div>
      );
  }

  stripPointerDown(e, i) {
      if (e.button !== undefined && e.button !== 0) return;
      const startX = e.clientX;
      const startY = e.clientY;
      this._drag = { from: i, over: i, active: false };
      const el = e.currentTarget;
      const strip = this._stripEl;

      const onMove = (ev) => {
          const d = this._drag;
          if (!d) return;
          if (!d.active) {
              // Küçük hareket tıklamadır; yatay kaydırmayla karışmasın diye 8 px eşik
              if (Math.abs(ev.clientX - startX) < 8 && Math.abs(ev.clientY - startY) < 8) return;
              d.active = true;
              try { el.setPointerCapture(ev.pointerId); } catch (err) {}
          }
          ev.preventDefault();
          const under = document.elementFromPoint(ev.clientX, ev.clientY);
          const thumb = under && under.closest && under.closest('.Attribute-thumb');
          if (thumb && thumb.dataset.index !== undefined) d.over = parseInt(thumb.dataset.index, 10);
          // Kenarlara yaklaşınca şerit kendiliğinden kayar
          if (strip) {
              const rect = strip.getBoundingClientRect();
              if (ev.clientX < rect.left + 40) strip.scrollLeft -= 12;
              else if (ev.clientX > rect.right - 40) strip.scrollLeft += 12;
          }
          m.redraw();
      };
      const onUp = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('pointercancel', onUp);
          const d = this._drag;
          this._drag = null;
          if (!d) return;
          if (d.active) this.movePhoto(d.from, d.over);
          else this.navPhoto(i);
          m.redraw();
      };
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
  }

  goToPhoto(i) {
      if (!this.isMulti() || i < 0 || i >= this.files.length || i === this.photoIndex) return;
      this.photoData[this.photoIndex] = this.snapshot();
      if (!this.photoData[i]) {
          // Yeni fotoğraf: künye formu boş gelir (araç bilgileri yeniden girilir).
          // Yalnızca yıl korunur; dosya adında
          // plaka varsa plaka alanı ondan doldurulur.
          const copy = JSON.parse(JSON.stringify(this.photoData[this.photoIndex]));
          const vehicleKeys = ['company', 'plate', 'brand', 'model', 'route', 'fleetCode', 'city', 'location'];
          vehicleKeys.forEach((k) => {
              copy[k] = '';
              if (copy.dynamicFields && k in copy.dynamicFields) copy.dynamicFields[k] = '';
          });
          // Admin panelinde tanımlı ek künye alanları da (yıl dışında) boşalır
          Object.keys(copy.dynamicFields || {}).forEach((k) => {
              if (k !== 'year') copy.dynamicFields[k] = '';
          });
          if (this.customScope() === 'photo') { copy.customMusic = null; copy.customGps = null; }
          const plate = this.plateFromFileName(i);
          if (plate) {
              copy.plate = plate;
              if (copy.dynamicFields) copy.dynamicFields.plate = plate;
          }
          this.photoData[i] = copy;
      }
      this.photoIndex = i;
      this.restoreSnapshot(this.photoData[i]);
      this.showPhoto(i);
      m.redraw();
  }

  wrapKunye(text, withTheme = true) {
      if (!text) return null;
      const theme = app.forum.attribute('framio-upload-exif.kunye_theme') || 'classic';
      return withTheme ? `[framio-kunye theme="${theme}"]\n${text}\n[/framio-kunye]` : `[framio-kunye]\n${text}\n[/framio-kunye]`;
  }

  /** Her fotoğrafın künye metni (fotoğraf sırasıyla); görülmeyen fotoğraflar bir öncekini alır */
  buildPerPhotoTexts(withTheme = true) {
      this.photoData[this.photoIndex] = this.snapshot();
      const current = this.snapshot();
      let last = this.photoData[0] || current;
      const texts = this.files.map((f, i) => {
          const s = this.photoData[i] || last;
          last = s;
          this.restoreSnapshot(s, true);
          return this.wrapKunye(this.prepareData(), withTheme);
      });
      this.restoreSnapshot(current, true);
      return texts;
  }

  onremove(vnode) {
      // Önizlemeler paylaşılan önbellekte tutulur (gönderi yayımlanana kadar tekrar açılabilir)
      clearTimeout(this._idleRedraw);
      if (this._typingGuard && vnode.dom) vnode.dom.removeEventListener('input', this._typingGuard, true);
      const styleTag = document.getElementById('attribute-modal-css');
      if (styleTag) styleTag.remove();
      super.onremove(vnode);
  }

  applyMatchedCity() {
      if (!this.city()) {
          let matchedCity = null;
          if (this.taxonomy && this.taxonomy.length > 0) {
              const taxCity = this.taxonomy.find(t => t.city);
              if (taxCity) matchedCity = taxCity.city;
          }
          if (!matchedCity && app.current && typeof app.current.get === 'function') {
              const discussion = app.current.get('discussion');
              if (discussion) {
                  if (typeof discussion.tags === 'function') {
                      const tags = discussion.tags();
                      if (Array.isArray(tags)) {
                          tags.forEach(t => {
                              const slug = (t && typeof t.slug === 'function') ? t.slug().toLowerCase() : '';
                              const found = this.cityList.find(c => slug.includes(c.toLowerCase()) || c.toLowerCase().includes(slug.replace('-sehirici', '')));
                              if (found) matchedCity = found;
                          });
                      }
                  }
                  if (!matchedCity && typeof discussion.title === 'function') {
                      const title = discussion.title();
                      matchedCity = this.cityList.find(c => title.toLowerCase().includes(c.toLowerCase()));
                  }
              }
          }
          if (!matchedCity) {
              const path = window.location.pathname.toLowerCase();
              matchedCity = this.cityList.find(c => path.includes(c.toLowerCase()));
          }
          if (matchedCity) {
              this.city(matchedCity);
              if (!this.location()) this.location(matchedCity);
          }
      }

      if (this.city()) {
          this.loadRoutesForCity(this.city());
      }
      m.redraw();
  }

  loadCitiesAndRoutes() {
      if (window.framioCityListCache) {
          this.cityList = window.framioCityListCache;
          this.applyMatchedCity();
          return;
      }
      
      app.request({
          method: 'GET',
          url: app.forum.attribute('apiUrl') + '/framio-media/city-routes',
          params: { all_cities: 1 }
      }).then(res => {
          this.cityList = (res.cities || []).map(c => c.name);
          window.framioCityListCache = this.cityList;
          this.applyMatchedCity();
      }).catch(err => {
          console.error('[AttributeModal] Error loading cities:', err);
      });
  }

  loadRoutesForCity(cityName) {
      if (!cityName || cityName === 'Diğer') {
          this.cityRoutes = [];
          return;
      }
      
      window.framioCityRoutesCache = window.framioCityRoutesCache || {};
      if (window.framioCityRoutesCache[cityName]) {
          this.cityRoutes = window.framioCityRoutesCache[cityName];
          m.redraw();
          return;
      }
      
      this.isLoadingCityRoutes = true;
      app.request({
          method: 'GET',
          url: app.forum.attribute('apiUrl') + '/framio-media/city-routes',
          params: { city: cityName }
      }).then(res => {
          this.cityRoutes = res.data || [];
          window.framioCityRoutesCache[cityName] = this.cityRoutes;
          this.isLoadingCityRoutes = false;
          m.redraw();
      }).catch(err => {
          this.isLoadingCityRoutes = false;
          m.redraw();
      });
  }

  loadTaxonomy() {
      let discussionId = null;
      if (!this.attrs.globalContext && app.current && typeof app.current.get === 'function') {
          const discussion = app.current.get('discussion');
          if (discussion) discussionId = discussion.id();
      }
      
      if (!discussionId && !this.attrs.globalContext) {
          const match = window.location.pathname.match(/\/d\/(\d+)/);
          if (match) discussionId = match[1];
      }

      const cacheKey = discussionId ? String(discussionId) : 'global';
      window.__framioTaxonomyCache = window.__framioTaxonomyCache || {};

      // 1. Önbellekte varsa anında senkron yükle (0 ms gecikme)
      if (window.__framioTaxonomyCache[cacheKey]) {
          this.applyTaxonomy(window.__framioTaxonomyCache[cacheKey]);
          this.isLoadingTaxonomy = false;
          return;
      }

      // 2. Önbellekte yoksa arka planda çek
      const params = discussionId ? { discussion_id: discussionId } : {};
      this.isLoadingTaxonomy = true;

      app.request({ 
          method: 'GET', 
          url: app.forum.attribute('apiUrl') + '/framio-media/taxonomy',
          params
      }).then(result => {
          const data = result.data || [];
          window.__framioTaxonomyCache[cacheKey] = data;
          this.applyTaxonomy(data);
          this.isLoadingTaxonomy = false;
          m.redraw();
      }).catch(err => {
          this.isLoadingTaxonomy = false;
          console.error('[AttributeModal] Error loading taxonomy:', err);
          m.redraw();
      });
  }

  getSortedBrands() {
      if (this._brandsCache && this._brandsCache.src === this.taxonomy) return this._brandsCache.list;
      let brands = [...new Set(this.taxonomy.map(item => String(item.brand || '').trim()))].filter(Boolean);
      let brandOrderRaw = app.forum.attribute('framio-upload-exif.brand_order');
      let brandOrder = [];
      if (brandOrderRaw) {
          try { 
              brandOrder = typeof brandOrderRaw === 'string' ? JSON.parse(brandOrderRaw) : brandOrderRaw;
              if (!Array.isArray(brandOrder)) brandOrder = [];
          } catch (e) {}
      }
      const list = brands.sort((a, b) => {
          const idxA = brandOrder.indexOf(a);
          const idxB = brandOrder.indexOf(b);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.localeCompare(b, 'tr');
      });
      this._brandsCache = { src: this.taxonomy, list };

      return list;
  }

  applyTaxonomy(data) {
      this.taxonomy = data || [];
      const brands = this.getSortedBrands();
      
      if (brands.length > 0) {
          if (!this.brand() || !brands.includes(this.brand())) {
              this.brand(brands[0]);
              // Kendiliğinden seçildi: yapay zeka markayı değiştirebilir
              this.isDefaultBrand = true;
          }
          this.updateModels(this.brand());
      }
  }

  updateModels(brandName) {
      if (!brandName) {
          this.availableModels = [];
          return;
      }
      const targetBrand = String(brandName).trim();
      this.availableModels = this.taxonomy.filter(item => String(item.brand).trim() === targetBrand);
      m.redraw();
  }

  oncreate(vnode) {
      super.oncreate(vnode);
      this.syncAiPlaceholders(vnode.dom);

      // Yazarken her tuşta tüm sayfa (arkadaki konu ve gönderiler) yeniden çizilmesin: değer zaten kutuda,
      // Stream'e handler'da yazılıyor. Yazma durunca tek bir çizimle bağlı alanlar (model listesi vb.) eşitlenir.
      this._typingGuard = (e) => {
          const t = e.target;
          if (!t || !t.matches || !t.matches('input.FormControl:not([type=number]):not([list]), textarea.FormControl')) return;
          e.redraw = false;
          clearTimeout(this._idleRedraw);
          this._idleRedraw = setTimeout(() => m.redraw(), 300);
      };
      vnode.dom.addEventListener('input', this._typingGuard, true);
  }

  onupdate(vnode) {
      if (super.onupdate) super.onupdate(vnode);
      this.syncAiPlaceholders(vnode.dom);
  }

  /** Framio AI çalışırken boş metin alanlarının içinde durum yazısı gösterilir; bitince özgün yer tutucu geri gelir */
  syncAiPlaceholders(root) {
      const box = root && root.querySelector('.Attribute-Right');
      if (!box) return;
      const checking = this.aiStatus() === 'analyzing';
      const filled = this.aiFilledVals || new Set();
      box.querySelectorAll('input.FormControl:not([type=hidden]), textarea.FormControl, select.FormControl').forEach((el) => {
          // Kullanıcı değeri değiştirince işaret kendiliğinden kalkar
          el.classList.toggle('is-ai-filled', !checking && !!el.value && filled.has(String(el.value).trim()));
          el.classList.toggle('is-ai-pending', checking && !el.value);
          if (el.tagName === 'SELECT') return;
          if (checking) {
              if (!el.hasAttribute('data-ph')) el.setAttribute('data-ph', el.getAttribute('placeholder') || '');
              el.setAttribute('placeholder', 'Framio AI %' + this.aiPct + ' · dolduruluyor…');
          } else if (el.hasAttribute('data-ph')) {
              el.setAttribute('placeholder', el.getAttribute('data-ph'));
              el.removeAttribute('data-ph');
          }
      });
  }

  className() { return 'AttributeModal Modal--large'; }
  title() { return 'Araç Künye Bilgileri'; }

  content() {
    const brands = this.getSortedBrands();

    // Önizlenen fotoğrafın filigranı (çoklu açıklamada o anki fotoğraf)
    const previewIndex = this.photoIndex;
    const currentSelectionId = (this.session.result && this.session.result.selections) ? (this.session.result.selections[previewIndex] || 'none') : 'none';
    let baseUrl = app.forum.attribute('baseUrl').replace(/\/$/, '');
    if (window.location.protocol === 'https:' && baseUrl.startsWith('http:')) baseUrl = baseUrl.replace(/^http:/, 'https:');
    const username = app.session.user ? app.session.user.username() : '';
    const wmUrls = (this.session.result && this.session.result.watermarkUrls) || [];
    const watermarkUrl = currentSelectionId !== 'none' ? (wmUrls[previewIndex] || baseUrl + '/assets/watermarks/' + username + '/' + encodeURIComponent(currentSelectionId)) : '';

    return (
      <div className="Modal-body" style={{ padding: 0 }}>
        <div className="Attribute-Layout" style={{ paddingTop: '24px' }}>
            
            {/* SOL TARAF: ÖNİZLEME */}
            <div className="Attribute-Left" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                    <p className="helpText" style={{ margin: 0, fontSize: '13px', color: '#5c6b77', fontWeight: '500' }}>
                        <i className="fas fa-cloud-upload-alt" style={{marginRight: '6px', color: '#3498db'}}></i> Fotoğraflar arka planda yükleniyor. Lütfen araç bilgilerini giriniz.<br/>
                        <span style={{fontSize: '11px', color: '#999'}}>(Boş bırakılan alanlar şablonda gösterilmez)</span>
                    </p>
                </div>

                {this.files.length > 1 && this.renderCaptionModeSwitch()}

                <div className="Attribute-preview-area" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    {this.previewUrl() ? (
                        <div style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <div style={{position: 'relative', display: 'inline-block', maxWidth: '100%', touchAction: this.files.length > 1 ? 'pan-y' : 'auto'}}
                                // Birden Çok: önizleme parmakla sağa/sola kaydırılarak fotoğraflar arasında gezilir
                                ontouchstart={(e) => { this.swipeX = e.changedTouches[0].clientX; }}
                                ontouchend={(e) => {
                                    if (this.files.length < 2 || this.swipeX == null) return;
                                    const dx = e.changedTouches[0].clientX - this.swipeX;
                                    this.swipeX = null;
                                    if (Math.abs(dx) < 40) return;
                                    const target = this.photoIndex + (dx < 0 ? 1 : -1);
                                    this.navPhoto(target);
                                }}>
                                <canvas className="Attribute-previewImg" oncreate={(v) => drawPreview(v.dom, this.files[this.photoIndex])} onupdate={(v) => drawPreview(v.dom, this.files[this.photoIndex])} onclick={() => this.isZoomed(true)} title="Büyütmek için tıklayın"></canvas>
                                {currentSelectionId !== 'none' && (
                                    <img src={watermarkUrl} style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none'}} onerror={(e) => { e.target.style.display = 'none'; }} />
                                )}
                                {this.files.length > 1 && this.renderPhotoNav()}
                            </div>
                        </div>
                    ) : (
                        <div style={{color: '#666', padding:'20px'}}><i className="fas fa-image fa-2x"></i><br/>Önizleme Yok</div>
                    )}
                </div>

                {this.files.length > 1 && this.renderPhotoStrip()}

                {/* LIGHTBOX */}
                {this.isZoomed() && this.previewUrl() && (
                    <div 
                        style={{
                            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                            background: 'rgba(0,0,0,0.85)', zIndex: 999999,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out'
                        }}
                        onclick={(e) => { e.stopPropagation(); this.isZoomed(false); }}
                    >
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <div style={{position: 'relative', display: 'inline-block', maxWidth: '95vw', maxHeight: '95vh'}}>
                                <img src={this.previewUrl()} style={{maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', display: 'block', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'}} />
                                {currentSelectionId !== 'none' && (
                                    <img src={watermarkUrl} style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none'}} onerror={(e) => { e.target.style.display = 'none'; }} />
                                )}
                            </div>
                        </div>
                        <button style={{position: 'absolute', top: '20px', right: '30px', background: 'transparent', border: 'none', color: '#fff', fontSize: '30px', cursor: 'pointer', padding: '10px'}} onclick={(e) => { e.stopPropagation(); this.isZoomed(false); }}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                )}
                
                <div style={{ marginTop: 'auto', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {this.files.length > 1 && (
                        <p style={{ margin: 0, color: '#88929d', fontSize: '13px', textAlign: 'center'}}>
                            <i className="fas fa-info-circle"></i> {this.isMulti()
                                ? `Her fotoğrafa ayrı künye girilir. Alttaki şeritten fotoğraflar arasında geçebilir, sürükleyerek sıralayabilirsiniz.`
                                : `Tek künye ${this.files.length} fotoğrafın tamamına uygulanır. Alttaki şeritte fotoğrafları sürükleyerek gönderideki sıralarını değiştirebilirsiniz.`}
                        </p>
                    )}
                    <Button className="Button" style={{ ...BTN, width: '100%', boxSizing: 'border-box', padding: '0 12px', background: '#fff', color: '#e74c3c', border: '1px solid #e74c3c' }} onclick={this.cancel.bind(this)}>
                        <i className="fas fa-arrow-left" style={{marginRight: '6px'}}></i> Yüklemeyi İptal Et ve Geri Dön
                    </Button>
                </div>
            </div>

            {/* SAĞ TARAF: FORM */}
            <div className={'Attribute-Right' + (this.aiStatus() === 'analyzing' ? ' is-ai-checking' : '')} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

                {/* ANLIK AI ANALİZ DURUMU */}
                {/* Çalışırken durum alanların içinde gösterilir; burada yalnızca sonuç özeti kalır */}
                {this.aiBarVisible && this.aiStatus() !== 'analyzing' ? (
                    <div className={'FramioAI-Bar is-' + this.aiStatus()} role="status" aria-live="polite">
                        <div className="FramioAI-BarFill" style={{ width: this.aiPct + '%' }}></div>
                        <span className="FramioAI-BarText">
                            <i className="fas fa-magic"></i> Framio AI %{this.aiPct}
                            {this.aiStatus() === 'analyzing' ? ' · künye bilgileri dolduruluyor…' : this.aiMessage() ? ' · ' + this.aiMessage() : ''}
                        </span>
                        {this.aiStatus() !== 'analyzing' ? <i className="fas fa-times FramioAI-Close" onclick={() => { this.aiBarVisible = false; }}></i> : null}
                    </div>
                ) : null}

                {/* DİNAMİK KATEGORİ ŞEMASI FORMU */}
                {this.categorySchema && this.categorySchema.fields_config ? (
                    this.renderDynamicForm()
                ) : this.isCityMode ? (
                    // === ŞEHİRİÇİ ULAŞIM ARAÇLARI KÜNYE FORMU (4 SATIR) ===
                    <div>
                        {/* SATIR 1: Şehir Seçimi ve Hat Seçimi */}
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="Form-group" style={{ flex: 1 }}>
                                <label>Şehir Seçimi</label>
                                {this.isCustomCity ? (
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <input 
                                            className="FormControl" 
                                            placeholder="Şehir adı yazınız..." 
                                            value={this.city()} 
                                            oninput={e => {
                                                this.city(e.target.value);
                                                this.location(e.target.value);
                                            }} 
                                        />
                                        <Button 
                                            className="Button" 
                                            icon="fas fa-list" 
                                            onclick={() => { this.isCustomCity = false; this.city(''); m.redraw(); }} 
                                            title="Listeden Seç"
                                        />
                                    </div>
                                ) : (
                                    <input 
                                        list="city-datalist"
                                        className="FormControl" 
                                        placeholder="Şehir Seçin veya Yazın" 
                                        value={this.city()} 
                                        onchange={e => {
                                            const val = e.target.value;
                                            if (val === '__custom__') {
                                                this.isCustomCity = true;
                                                this.city('');
                                                m.redraw();
                                                return;
                                            }
                                            this.city(val);
                                            this.location(val);
                                            this.route('');
                                            if (val) this.loadRoutesForCity(val);
                                        }}
                                        oninput={e => {
                                            if (e.target.value !== '__custom__') this.city(e.target.value);
                                        }}
                                    />
                                )}
                                <datalist id="city-datalist">
                                    {this.cityList.map(c => <option value={c}>{c}</option>)}
                                    <option value="__custom__">+ Diğer (Elle Yaz)...</option>
                                </datalist>
                            </div>

                            <div className="Form-group" style={{ flex: 1 }}>
                                <label>Hat Seçimi</label>
                                {this.isCustomRoute || this.cityRoutes.length === 0 ? (
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <input 
                                            className="FormControl" 
                                            placeholder="Hat adı yazınız..." 
                                            value={this.route()} 
                                            oninput={e => this.route(e.target.value)} 
                                        />
                                        {this.cityRoutes.length > 0 && (
                                            <Button 
                                                className="Button" 
                                                icon="fas fa-list" 
                                                onclick={() => { this.isCustomRoute = false; this.route(''); m.redraw(); }} 
                                                title="Listeden Seç"
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <input 
                                        list="route-datalist"
                                        className="FormControl" 
                                        placeholder={this.isLoadingCityRoutes ? 'Hatlar yükleniyor...' : 'Hat Seçin veya Yazın'}
                                        value={this.route()} 
                                        disabled={!this.city() || this.isLoadingCityRoutes}
                                        onchange={e => {
                                            const val = e.target.value;
                                            if (val === '__custom__') {
                                                this.isCustomRoute = true;
                                                this.route('');
                                                m.redraw();
                                                return;
                                            }
                                            this.route(val);
                                        }}
                                        oninput={e => {
                                            if (e.target.value !== '__custom__') this.route(e.target.value);
                                        }}
                                    />
                                )}
                                <datalist id="route-datalist">
                                    {this.cityRoutes.map(r => {
                                        // Seçilince künyeye "589 - Güzergah" yazılır (yalnızca numara değil)
                                        const label = r.display_name || (r.route_name ? `${r.route_code} - ${r.route_name}` : r.route_code);
                                        return <option value={label}>{label}</option>;
                                    })}
                                    <option value="__custom__">+ Diğer (Elle Yaz)...</option>
                                </datalist>
                            </div>
                        </div>

                        {/* SATIR 2: Marka ve Model */}
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="Form-group" style={{ flex: 1 }}>
                                <label>{this.isLoadingTaxonomy ? 'Marka' : (brands.length > 0 ? 'Marka' : 'Marka')}</label>
                                {this.isLoadingTaxonomy ? (
                                    <select className="FormControl" disabled style={{ background: '#f8f9fa', color: '#888' }}>
                                        <option>Yükleniyor...</option>
                                    </select>
                                ) : brands.length > 0 ? (
                                    <select className="FormControl" value={this.brand()} onchange={(e) => {
                                        this.brand(e.target.value);
                                        this.isDefaultBrand = false;
                                        this.model(''); 
                                        this.updateModels(e.target.value);
                                    }}>
                                        {brands.length > 1 && <option value="">-- Marka Seç --</option>}
                                        {brands.map(brandItem => <option value={brandItem}>{brandItem}</option>)}
                                    </select>
                                ) : (
                                    <input 
                                        className="FormControl" 
                                        value={this.brand()} 
                                        oninput={e => this.brand(e.target.value)} 
                                        placeholder="Marka giriniz (Örn: Mercedes-Benz)" 
                                    />
                                )}
                            </div>
                            <div className="Form-group" style={{ flex: 1 }}>
                                <label>{this.isLoadingTaxonomy ? 'Model' : (brands.length > 0 ? 'Model' : 'Model')}</label>
                                {this.isLoadingTaxonomy ? (
                                    <select className="FormControl" disabled style={{ background: '#f8f9fa', color: '#888' }}>
                                        <option>Yükleniyor...</option>
                                    </select>
                                ) : brands.length > 0 ? (
                                    <select className="FormControl" value={this.model()} onchange={e => this.model(e.target.value)} disabled={!this.brand()}>
                                        <option value="">-- Model Seç --</option>
                                        {this.availableModels.map(mod => <option value={mod.model}>{mod.model}</option>)}
                                    </select>
                                ) : (
                                    <input 
                                        className="FormControl" 
                                        value={this.model()} 
                                        oninput={e => this.model(e.target.value)} 
                                        placeholder="Model giriniz (Örn: Conecto)" 
                                    />
                                )}
                            </div>
                        </div>

                        {/* SATIR 3: Araç Filo Kodu (Varsa) ve Plaka */}
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="Form-group" style={{ flex: 1 }}>
                                <label>Araç Filo Kodu (Varsa)</label>
                                <input 
                                    className="FormControl" 
                                    value={this.fleetCode()} 
                                    oninput={e => this.fleetCode(e.target.value)} 
                                    placeholder="Örn: 06-1234 veya Kapı No" 
                                />
                            </div>
                            <div className="Form-group" style={{ flex: 1 }}>
                                <label>Plaka</label>
                                <input className="FormControl" value={this.plate()} oninput={e => this.plate(e.target.value)} />
                            </div>
                        </div>

                        {/* SATIR 4: Çekim Yeri ve Yıl */}
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                            <div className="Form-group" style={{ flex: 1 }}>
                                <label>Çekim Yeri</label>
                                <input className="FormControl" value={this.location()} oninput={e => this.location(e.target.value)} />
                            </div>
                            <div className="Form-group" style={{ flex: 1 }}>
                                <label>Yıl</label>
                                <input className="FormControl" type="number" value={this.year()} oninput={e => this.year(e.target.value)} />
                            </div>
                        </div>
                    </div>
                ) : (
                    // === NORMAL STANDART KÜNYE FORMU (3 SATIR) ===
                    <div>
                        {/* SATIR 1: Firma ve Plaka */}
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="Form-group" style={{ flex: 1 }}>
                                <label>Firma İsmi</label>
                                <input className="FormControl" value={this.company()} oninput={e => this.company(e.target.value)} />
                            </div>
                            <div className="Form-group" style={{ flex: 1 }}>
                                <label>Plaka</label>
                                <input className="FormControl" value={this.plate()} oninput={e => this.plate(e.target.value)} />
                            </div>
                        </div>

                        {/* SATIR 2: Marka ve Model */}
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="Form-group" style={{ flex: 1 }}>
                                <label>{this.isLoadingTaxonomy ? 'Marka' : (brands.length > 0 ? 'Marka Seçiniz' : 'Marka')}</label>
                                {this.isLoadingTaxonomy ? (
                                    <select className="FormControl" disabled style={{ background: '#f8f9fa', color: '#888' }}>
                                        <option>Yükleniyor...</option>
                                    </select>
                                ) : brands.length > 0 ? (
                                    <select className="FormControl" value={this.brand()} onchange={(e) => {
                                        this.brand(e.target.value);
                                        this.isDefaultBrand = false;
                                        this.model(''); 
                                        this.updateModels(e.target.value);
                                    }}>
                                        {brands.length > 1 && <option value="">-- Marka Seç --</option>}
                                        {brands.map(brandItem => <option value={brandItem}>{brandItem}</option>)}
                                    </select>
                                ) : (
                                    <input 
                                        className="FormControl" 
                                        value={this.brand()} 
                                        oninput={e => this.brand(e.target.value)} 
                                        placeholder="Marka giriniz (Örn: Mercedes-Benz)" 
                                    />
                                )}
                            </div>
                            <div className="Form-group" style={{ flex: 1 }}>
                                <label>{this.isLoadingTaxonomy ? 'Model' : (brands.length > 0 ? 'Model Seçiniz' : 'Model')}</label>
                                {this.isLoadingTaxonomy ? (
                                    <select className="FormControl" disabled style={{ background: '#f8f9fa', color: '#888' }}>
                                        <option>Yükleniyor...</option>
                                    </select>
                                ) : brands.length > 0 ? (
                                    <select className="FormControl" value={this.model()} onchange={e => this.model(e.target.value)} disabled={!this.brand()}>
                                        <option value="">-- Model Seç --</option>
                                        {this.availableModels.map(mod => <option value={mod.model}>{mod.model}</option>)}
                                    </select>
                                ) : (
                                    <input 
                                        className="FormControl" 
                                        value={this.model()} 
                                        oninput={e => this.model(e.target.value)} 
                                        placeholder="Model giriniz (Örn: Travego)" 
                                    />
                                )}
                            </div>
                        </div>

                        {/* SATIR 3: Çekim Yeri ve Yıl */}
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                            <div className="Form-group" style={{ flex: 1 }}>
                                <label>Çekim Yeri</label>
                                <input className="FormControl" value={this.location()} oninput={e => this.location(e.target.value)} />
                            </div>
                            <div className="Form-group" style={{ flex: 1 }}>
                                <label>Yıl</label>
                                <input className="FormControl" type="number" value={this.year()} oninput={e => this.year(e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}
                
                {/* ÖZELLEŞTİRME (MÜZİK & KONUM) BİLGİSİ VE BUTONU */}
                <div style={{ marginBottom: '15px', padding: '10px 12px', background: '#f8f9fa', borderRadius: '8px', border: '1px dashed #dcdfe6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: (this.customMusic() || this.customGps()) ? '8px' : '0' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#555' }}>
                            <i className="fas fa-magic" style={{ marginRight: '5px', color: 'var(--primary-color, #e67e22)' }}></i>
                            Gönderi Özelleştirme
                        </span>
                        {this.isMulti() ? this.renderCustomScopeSwitch() : null}
                        <Button 
                            className="Button Button--link" 
                            style={{ padding: 0, fontSize: '12px', fontWeight: 'bold' }}
                            onclick={this.openCustomizeModal.bind(this)}
                        >
                            <i className="fas fa-sliders-h" style={{ marginRight: '4px' }}></i>
                            {(this.customMusic() || this.customGps()) ? 'Düzenle' : 'Müzik / Konum Ekle'}
                        </Button>
                    </div>

                    {(this.customMusic() || this.customGps()) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {this.customMusic() && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f3e8ff', color: '#7e22ce', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                                    <i className="fas fa-music"></i>
                                    {this.customMusic().title} - {this.customMusic().artist}
                                    <i className="fas fa-times" style={{ cursor: 'pointer', marginLeft: '3px' }} onclick={() => { this.customMusic(null); m.redraw(); }} title="Kaldır"></i>
                                </span>
                            )}
                            {this.customGps() && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                                    <i className="fas fa-map-marker-alt"></i>
                                    Konum Eklendi ({this.customGps().lat}, {this.customGps().lon})
                                    <i className="fas fa-times" style={{ cursor: 'pointer', marginLeft: '3px' }} onclick={() => { this.customGps(null); m.redraw(); }} title="Kaldır"></i>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* BUTONLAR — 2 sütunlu ızgara: hepsi aynı genişlik, yükseklik ve hizada */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: 'auto' }}>
                     {this.crosspostNodes ? (
                         <Button className="Button" style={ this.crosspostActive() ? { ...{ ...BTN, width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '0 12px', background: '#fff', color: '#2c3e50', border: '1px solid #dcdfe6' }, background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd' } : { ...BTN, width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '0 12px', background: '#fff', color: '#2c3e50', border: '1px solid #dcdfe6' } }
                             title="Diğer sitelerde hangi tartışmaya aktarılacağını seçin" onclick={this.openCrosspost.bind(this)}>
                            <i className={ this.crosspostActive() ? 'fas fa-check-circle' : 'fas fa-network-wired'} style={{marginRight: '6px'}}></i> Ortak Paylaş
                            {this.crosspostActive() ? <i className="fas fa-times" title="Ortak paylaşımı kaldır" style={{ marginLeft: '8px', opacity: 0.7 }} onclick={this.clearCrosspost.bind(this)}></i> : null}
                         </Button>
                     ) : null}
                     <Button className="Button" style={ this.crosspostNodes ? { ...BTN, width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '0 12px', background: '#fff', color: '#2c3e50', border: '1px solid #dcdfe6' } : { ...{ ...BTN, width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '0 12px', background: '#fff', color: '#2c3e50', border: '1px solid #dcdfe6' }, gridColumn: '1 / -1' } } onclick={this.goToInfo.bind(this)}>
                        <i className="fas fa-info-circle" style={{marginRight: '6px'}}></i> Info Ekle
                     </Button>
                     <Button className="Button" style={ { ...BTN, width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '0 12px', background: '#fff', color: '#2c3e50', border: '1px solid #dcdfe6' } } onclick={this.skip.bind(this)}>
                        <i className="fas fa-forward" style={{marginRight: '6px'}}></i> Künye Ekleme
                     </Button>
                     <Button className="Button Button--primary" style={{ ...BTN, width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '0 12px', border: '1px solid transparent' }} onclick={this.submit.bind(this)}>
                        <i className="fas fa-check" style={{marginRight: '6px'}}></i> Bilgileri Onayla
                     </Button>
                </div>
            </div>
        </div>
      </div>
    );
  }

  // === ÇOKLU AÇIKLAMA ARAYÜZÜ ===
  renderCaptionModeSwitch() {
      // Küçük hap biçimli seçici (paylaşım modalıyla aynı görünüm)
      const opt = (mode, icon, label) => {
          const active = this.captionMode() === mode;
          return (
              <button type="button" onclick={() => this.setCaptionMode(mode)} title={mode === 'single' ? 'Tüm fotoğraflara tek künye' : 'Her fotoğrafa ayrı künye'} style={{
                  padding: '4px 11px', border: 'none', borderRadius: '999px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, lineHeight: '16px',
                  background: active ? '#1e293b' : 'transparent', color: active ? '#fff' : '#64748b', transition: 'all .15s'
              }}>
                  <i className={icon} style={{ marginRight: '5px', fontSize: '10px' }}></i>{label}
              </button>
          );
      };
      return (
          <div className="Attribute-captionMode" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
              <div style={{ display: 'inline-flex', gap: '2px', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '2px', borderRadius: '999px' }}>
                  {opt('single', 'fas fa-align-left', 'Tek Açıklama')}
                  {opt('multi', 'fas fa-images', 'Birden Çok')}
              </div>
          </div>
      );
  }
  renderCustomScopeSwitch() {
      const opt = (scope, label, title) => (
          <button type="button" title={title} onclick={() => this.setCustomScope(scope)} style={{
              padding: '3px 9px', border: 'none', borderRadius: '999px', cursor: 'pointer', fontSize: '10px', fontWeight: 600,
              background: this.customScope() === scope ? '#1e293b' : 'transparent', color: this.customScope() === scope ? '#fff' : '#64748b',
          }}>{label}</button>
      );
      return (
          <div style={{ display: 'inline-flex', gap: '2px', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '2px', borderRadius: '999px', marginLeft: 'auto', marginRight: '8px' }}>
              {opt('all', 'Tüm Gönderi', 'Müzik ve konum bütün fotoğraflara uygulanır')}
              {opt('photo', `Bu Fotoğraf (${this.photoIndex + 1})`, 'Her fotoğrafa ayrı müzik ve konum')}
          </div>
      );
  }

  setCustomScope(scope) {
      if (scope === this.customScope()) return;
      if (scope === 'photo') {
          // Mevcut ortak değer her fotoğrafın başlangıç değeri olur
          this.photoData[this.photoIndex] = this.snapshot();
          this.photoData = this.photoData.map((d) => (d ? { ...d, customMusic: this.customMusic(), customGps: this.customGps() } : d));
      }
      this.customScope(scope);
      m.redraw();
  }

  /** Gönderiye yazılacak müzik/konum; fotoğrafa özelse fotoğraf sırasıyla dizi */
  customPayload() {
      const data = { music: this.customMusic(), gps: this.customGps(), perPhoto: null };
      if (this.isMulti() && this.customScope() === 'photo') {
          this.photoData[this.photoIndex] = this.snapshot();
          data.perPhoto = this.files.map((f, i) => {
              const d = this.photoData[i];
              return { music: (d && d.customMusic) || null, gps: (d && d.customGps) || null };
          });
          data.music = null; data.gps = null;
      }
      return data;
  }

  renderPhotoNav() {
      const n = this.files.length;
      const i = this.photoIndex;
      const arrow = (dir) => {
          const target = i + dir;
          const disabled = target < 0 || target >= n;
          return (
              <button type="button" disabled={disabled} title={dir < 0 ? 'Önceki fotoğraf' : 'Sonraki fotoğraf'}
                  onclick={(e) => { e.stopPropagation(); this.navPhoto(target); }}
                  style={{
                      position: 'absolute', top: '50%', [dir < 0 ? 'left' : 'right']: '8px', transform: 'translateY(-50%)',
                      width: '34px', height: '34px', borderRadius: '50%', border: 'none', cursor: disabled ? 'default' : 'pointer',
                      background: 'rgba(255,255,255,0.92)', color: '#1e293b', boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                      opacity: disabled ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                  <i className={dir < 0 ? 'fas fa-chevron-left' : 'fas fa-chevron-right'}></i>
              </button>
          );
      };
      return [
          arrow(-1),
          arrow(1),
          <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '10px', pointerEvents: 'none' }}>
              {i + 1} / {n}
          </span>
      ];
  }


  openCustomizeModal(e) {
      if (e) e.preventDefault();
      this.isConfirmed = true; // ModalManager AttributeModal'ı unmount ettiğinde onay uyarısı çıkmasını engelle
      
      const rawData = this.getRawData();
      const files = this.files;
      const session = this.session;
      const oncancel = this.oncancelCallback;
      const ongoback = this.ongobackCallback;
      const onsubmit = this.onsubmitCallback;
      const onskip = this.onskipCallback;
      const onInfo = this.onInfoCallback;

      const reopenAttributeModal = (customData) => {
          if (customData) {
              if (customData.music !== undefined) rawData.customMusic = customData.music;
              if (customData.gps !== undefined) rawData.customGps = customData.gps;
              if (rawData.customScope === 'photo' && rawData.photoData && rawData.photoData[rawData.photoIndex]) {
                  rawData.photoData[rawData.photoIndex].customMusic = rawData.customMusic;
                  rawData.photoData[rawData.photoIndex].customGps = rawData.customGps;
              }
          }
          app.modal.show(AttributeModal, {
              initialValues: rawData,
              files: files,
              session: session,
              oncancel: oncancel,
              ongoback: ongoback,
              onsubmit: onsubmit,
              onskip: onskip,
              onInfo: onInfo
          });
      };

      app.modal.show(CustomizePostModal, {
          music: this.customMusic(),
          gps: this.customGps(),
          onconfirm: (customData) => {
              reopenAttributeModal(customData);
          },
          onback: () => {
              reopenAttributeModal(null);
          }
      });
  }

  // === DİNAMİK FORM RENDER ===
  renderDynamicForm() {
      const fieldsConfig = typeof this.categorySchema.fields_config === 'string'
          ? JSON.parse(this.categorySchema.fields_config)
          : this.categorySchema.fields_config;

      if (!Array.isArray(fieldsConfig) || fieldsConfig.length === 0) return null;

      const brands = this.getSortedBrands();

      // Alanları 2'li satırlara böl
      const rows = [];
      for (let i = 0; i < fieldsConfig.length; i += 2) {
          rows.push(fieldsConfig.slice(i, i + 2));
      }

      return (
          <div>
              {rows.map((row, rowIdx) => (
                  <div key={rowIdx} style={{ display: 'flex', gap: '15px', marginBottom: rowIdx === rows.length - 1 ? '20px' : '0' }}>
                      {row.map(field => (
                          <div className="Form-group" style={{ flex: 1 }} key={field.key}>
                              <label>{field.label}{field.required && <span style={{ color: '#e74c3c' }}>*</span>}</label>
                              {this.renderDynamicField(field, brands)}
                          </div>
                      ))}
                  </div>
              ))}
          </div>
      );
  }

  renderDynamicField(field, brands) {
      const val = this.dynamicFields[field.key] || '';
      const inputStyle = { padding: '8px 12px', minHeight: '38px', lineHeight: 'normal' };

      if (field.type === 'taxonomy_select' && field.key === 'brand') {
          return this.isLoadingTaxonomy ? (
              <select className="FormControl" disabled style={{ ...inputStyle, background: '#f8f9fa', color: '#888' }}>
                  <option>Yükleniyor...</option>
              </select>
          ) : brands.length > 0 ? (
              <select className="FormControl" value={val} style={inputStyle} onchange={(e) => {
                  this.dynamicFields[field.key] = e.target.value;
                  this.brand(e.target.value);
                  this.model('');
                  this.dynamicFields['model'] = '';
                  this.updateModels(e.target.value);
              }}>
                  {brands.length > 1 && <option value="">-- {field.label} Seç --</option>}
                  {brands.map(b => <option value={b}>{b}</option>)}
              </select>
          ) : (
              <input className="FormControl" value={val} style={inputStyle}
                  oninput={e => { this.dynamicFields[field.key] = e.target.value; this.brand(e.target.value); }}
                  placeholder={`${field.label} giriniz`} />
          );
      }

      if (field.type === 'taxonomy_select' && (field.key === 'model' || field.parent === 'brand')) {
          return this.isLoadingTaxonomy ? (
              <select className="FormControl" disabled style={{ ...inputStyle, background: '#f8f9fa', color: '#888' }}>
                  <option>Yükleniyor...</option>
              </select>
          ) : brands.length > 0 ? (
              <select className="FormControl" value={val} style={inputStyle}
                  onchange={e => { this.dynamicFields[field.key] = e.target.value; this.model(e.target.value); }}
                  disabled={!this.dynamicFields['brand']}>
                  <option value="">-- {field.label} Seç --</option>
                  {this.availableModels.map(mod => <option value={mod.model}>{mod.model}</option>)}
              </select>
          ) : (
              <input className="FormControl" value={val} style={inputStyle}
                  oninput={e => { this.dynamicFields[field.key] = e.target.value; this.model(e.target.value); }}
                  placeholder={`${field.label} giriniz`} />
          );
      }

      if (field.type === 'city_select') {
          return (
              <input list={`city-datalist-${field.key}`} className="FormControl" style={inputStyle}
                  placeholder="Şehir Seçin veya Yazın"
                  value={val}
                  onchange={e => {
                      this.dynamicFields[field.key] = e.target.value;
                      this.city(e.target.value);
                      if (e.target.value) this.loadRoutesForCity(e.target.value);
                  }}
                  oninput={e => { this.dynamicFields[field.key] = e.target.value; }}
              />
          );
      }

      if (field.type === 'route_select') {
          return (
              <input list={`route-datalist-${field.key}`} className="FormControl" style={inputStyle}
                  placeholder={this.isLoadingCityRoutes ? 'Hatlar yükleniyor...' : 'Hat Seçin veya Yazın'}
                  value={val}
                  disabled={this.isLoadingCityRoutes}
                  onchange={e => { this.dynamicFields[field.key] = e.target.value; this.route(e.target.value); }}
                  oninput={e => { this.dynamicFields[field.key] = e.target.value; }}
              />
          );
      }

      if (field.type === 'year') {
          return (
              <input className="FormControl" type="number" value={val || this.year()} style={inputStyle}
                  oninput={e => {
                      this.dynamicFields[field.key] = e.target.value;
                      this.year(e.target.value);
                  }} />
          );
      }

      // Varsayılan: text
      return (
          <input className="FormControl" value={val} style={inputStyle}
              oninput={e => { this.dynamicFields[field.key] = e.target.value; }}
              placeholder={field.label} />
      );
  }

  getRawData() {
      const base = {
          company: this.company(),
          plate: this.plate(),
          brand: this.brand(),
          model: this.model(),
          location: this.location(),
          year: this.year(),
          city: this.city(),
          route: this.route(),
          fleetCode: this.fleetCode(),
          customMusic: this.customMusic(),
          customGps: this.customGps(),
          customScope: this.customScope(),
      };
      // Dinamik alanları da ekle
      if (this.dynamicFields) {
          Object.keys(this.dynamicFields).forEach(key => {
              if (!base[key]) base[key] = this.dynamicFields[key];
          });
      }
      // Çoklu açıklama durumu (Özelleştir / Info pencerelerinden dönüşte korunur)
      if (this.isMulti()) {
          this.photoData[this.photoIndex] = this.snapshot();
          base.captionMode = 'multi';
          base.photoIndex = this.photoIndex;
          base.photoData = JSON.parse(JSON.stringify(this.photoData));
          base.customPerPhoto = this.customPayload().perPhoto;
      }
      return base;
  }

  prepareData() {
    // Dinamik şema varsa şablon tabanlı çıktı üret
    if (this.categorySchema && this.categorySchema.output_template) {
        return this.prepareDynamicData();
    }

    const lines = [];

    if (this.isCityMode) {
        const brandVal = this.brand();
        const modelVal = this.model();
        let line1 = '';
        if (brandVal && modelVal) line1 = `${brandVal} ${modelVal}`;
        else if (brandVal) line1 = brandVal;
        else if (modelVal) line1 = modelVal;
        if (line1) lines.push(`- **${line1}**`);

        const fleetVal = this.fleetCode();
        const plateVal = this.plate();
        let line2 = '';
        if (fleetVal && plateVal) line2 = `${fleetVal} | ${plateVal}`;
        else if (fleetVal) line2 = fleetVal;
        else if (plateVal) line2 = plateVal;
        if (line2) lines.push(`- **${line2}**`);

        const routeVal = this.route();
        let line3 = '';
        if (routeVal) {
            if (routeVal.includes(' | ')) {
                line3 = routeVal;
            } else {
                const dashIndex = routeVal.indexOf(' - ');
                if (dashIndex !== -1) {
                    const code = routeVal.substring(0, dashIndex).trim();
                    const name = routeVal.substring(dashIndex + 3).trim();
                    line3 = `${code} | ${name}`;
                } else {
                    line3 = routeVal;
                }
            }
        }
        if (line3) lines.push(`- **${line3}**`);

        const locVal = this.location();
        let yearVal = this.year();
        if (yearVal) yearVal = "'" + yearVal.toString().slice(-2);
        let line4 = '';
        if (locVal && yearVal) line4 = `${locVal} / ${yearVal}`;
        else if (locVal) line4 = locVal;
        else if (yearVal) line4 = yearVal;
        if (line4) lines.push(`- **${line4}**`);

        return lines.length > 0 ? lines.join('\n') : null;
    }

    const firmVal = this.company();
    const plateVal = this.plate();
    let line1 = '';
    if (firmVal && plateVal) line1 = `${firmVal} | ${plateVal}`;
    else if (firmVal) line1 = firmVal;
    else if (plateVal) line1 = plateVal;
    if (line1) lines.push(`- **${line1}**`);

    const brandVal = this.brand();
    const modelVal = this.model();
    let line2 = '';
    if (brandVal && modelVal) line2 = `${brandVal} ${modelVal}`;
    else if (brandVal) line2 = brandVal;
    else if (modelVal) line2 = modelVal;
    if (line2) lines.push(`- **${line2}**`);

    const locVal = this.location();
    let yearVal = this.year();
    if (yearVal) yearVal = "'" + yearVal.toString().slice(-2);

    let line3 = '';
    if (locVal && yearVal) line3 = `${locVal} / ${yearVal}`;
    else if (locVal) line3 = locVal;
    else if (yearVal) line3 = yearVal;
    if (line3) lines.push(`- **${line3}**`);

    return lines.length > 0 ? lines.join('\n') : null;
  }

  prepareDynamicData() {
      const template = this.categorySchema.output_template;
      const values = { ...this.dynamicFields };

      // Mevcut stream'lerden de değer al (eğer dynamicFields'te yoksa)
      if (!values.company && this.company()) values.company = this.company();
      if (!values.plate && this.plate()) values.plate = this.plate();
      if (!values.brand && this.brand()) values.brand = this.brand();
      if (!values.model && this.model()) values.model = this.model();
      if (!values.location && this.location()) values.location = this.location();
      if (!values.year && this.year()) values.year = this.year();
      if (!values.city && this.city()) values.city = this.city();
      if (!values.route && this.route()) values.route = this.route();
      if (!values.fleetCode && this.fleetCode()) values.fleetCode = this.fleetCode();

      // Şablondaki değişkenleri değerlerle değiştir
      let result = template;
      Object.keys(values).forEach(key => {
          const val = String(values[key] || '').trim();
          if (key === 'year' && val) {
              result = result.replace(new RegExp(`'\\{${key}\\}`, 'g'), "'" + val.slice(-2));
          }
          result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
      });

      // Boş placeholder'ları temizle
      result = result.replace(/\{[a-z_]+\}/gi, '');
      // Boş ayırıcıları temizle
      result = result.replace(/\|\s*\*\*/g, '**').replace(/\*\*\s*\|/g, '**');
      // Tamamen boş satırları kaldır
      const lines = result.split('\n').filter(l => {
          const cleaned = l.replace(/[-*\s]/g, '');
          return cleaned.length > 0;
      });

      return lines.length > 0 ? lines.join('\n') : null;
  }

  /** Onayda yazım standardı: kullanıcının yazdığı "Varan Turizm" de "Varan" olur (çoklu açıklamada her fotoğraf) */
  applyCanon() {
      const fix = (s) => { ['company', 'brand', 'model', 'location'].forEach((f) => { if (s[f]) s[f] = canonValue(f, s[f]); }); return s; };
      (this.photoData || []).forEach((s) => s && fix(s));
      const cur = fix(this.snapshot());
      this.company(cur.company || ''); this.brand(cur.brand || ''); this.model(cur.model || ''); this.location(cur.location || '');
  }

  submit(e) {
    e.preventDefault();
    this.isConfirmed = true;
    this.learnAlias();
    this.applyCanon();
    // Birden Çok Açıklama: fotoğraf sırasıyla künye dizisi; Tek: tek künye metni
    const resultText = this.isMulti() ? this.buildPerPhotoTexts(true) : this.wrapKunye(this.prepareData(), true);
    const customData = this.customPayload();
    if (this.onsubmitCallback) this.onsubmitCallback(resultText, customData);
    app.modal.close();
  }

  /** AI'nın marka/modeli onayda farklı yazıldıysa sunucuya bildirilir (şehir içi ve kamyon başlıklarında öğrenilir) */
  learnAlias() {
      const raw = this.aiRaw;
      if (!raw || !raw.model || !this.model()) return;
      const fold = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9çğıöşü]+/g, ' ').trim();
      if (fold(raw.brand + ' ' + raw.model) === fold(this.brand() + ' ' + this.model())) return;
      const discussion = app.current && typeof app.current.get === 'function' ? app.current.get('discussion') : null;
      app.request({
          method: 'POST',
          url: app.forum.attribute('apiUrl') + '/framio-media/ai-alias',
          body: { ai_brand: raw.brand, ai_model: raw.model, brand: this.brand(), model: this.model(), tag_slug: (this._currentTagSlugs || [])[0] || '', discussion_id: discussion ? discussion.id() : '' },
      }).catch(() => {});
  }

  goToInfo(e) {
      e.preventDefault();
      this.isConfirmed = true;
      const resultText = this.isMulti() ? this.buildPerPhotoTexts(false) : this.wrapKunye(this.prepareData(), false);
      const rawData = this.getRawData();
      if (this.onInfoCallback) this.onInfoCallback(resultText, rawData);
  }

  skip() {
      this.isConfirmed = true;
      const customData = this.customPayload();
      if (this.onskipCallback) this.onskipCallback(customData);
      app.modal.close();
  }

  cancel(e) {
      if(e) e.preventDefault();
      if (!this.isConfirmed) {
          if (confirm("Yükleme İptal Edilip İmza Seçimine Geri Dönülecektir. Onaylıyor Musunuz?")) {
              this.isConfirmed = true;
              if (this.ongobackCallback) this.ongobackCallback();
              app.modal.close();
          }
      }
  }
}


