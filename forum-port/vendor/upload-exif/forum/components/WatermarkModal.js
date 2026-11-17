import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import Stream from 'flarum/common/utils/Stream';
import Avatar from 'flarum/common/components/Avatar';
import app from 'flarum/forum/app';
import { fileUrl, fileDims, warm, drawThumb, drawPreview } from '../utils/previewCache';

// --- Otomatik imza seçimi: imzanın görselde kapladığı alanla arka planın kontrastı ---
const imgCache = {};
function loadImg(src) {
    if (!imgCache[src]) {
        imgCache[src] = new Promise((resolve, reject) => {
            const im = new Image();
            im.onload = () => resolve(im);
            im.onerror = reject;
            im.src = src;
        });
    }
    return imgCache[src];
}
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const SW = 240; // puanlama genişliği: okunurluk için yeterli, milisaniyeler içinde biter

/** Fotoğrafın SW genişliğindeki parlaklık haritası (dosya başına bir kez; createImageBitmap ana iş parçacığını kilitlemez) */
const photoCache = new WeakMap();
function photoLum(file) {
    if (!photoCache.has(file)) {
        photoCache.set(file, (async () => {
            let src;
            try { src = await createImageBitmap(file, { resizeWidth: SW, resizeQuality: 'low' }); }
            catch (e) { src = await loadImg(fileUrl(file)); }
            const w0 = src.width || src.naturalWidth, h0 = src.height || src.naturalHeight;
            const H = Math.max(1, Math.round((h0 * SW) / w0));
            const c = document.createElement('canvas'); c.width = SW; c.height = H;
            const x = c.getContext('2d', { willReadFrequently: true });
            x.drawImage(src, 0, 0, SW, H);
            if (src.close) src.close();
            const d = x.getImageData(0, 0, SW, H).data;
            const L = new Float32Array(SW * H);
            for (let p = 0, q = 0; q < L.length; p += 4, q++) L[q] = lum(d[p], d[p + 1], d[p + 2]);
            return { L, H, ratio: h0 / w0 };
        })());
    }
    return photoCache.get(file);
}

/** İmzanın SW genişliğindeki dolu pikselleri (adres başına bir kez) */
const wmCache = {};
function wmPixels(url) {
    if (!wmCache[url]) {
        wmCache[url] = loadImg(url).then((wm) => {
            const H = Math.max(1, Math.round((wm.naturalHeight * SW) / wm.naturalWidth));
            const c = document.createElement('canvas'); c.width = SW; c.height = H;
            const x = c.getContext('2d', { willReadFrequently: true });
            x.drawImage(wm, 0, 0, SW, H);
            const d = x.getImageData(0, 0, SW, H).data;
            const idx = [], L = [];
            for (let p = 0, q = 0; p < d.length; p += 4, q++) if (d[p + 3] >= 110) { idx.push(q); L.push(lum(d[p], d[p + 1], d[p + 2])); }
            return { H, idx, L };
        });
    }
    return wmCache[url];
}

/**
 * Sunucudaki gibi imza görselin genişliğine ölçeklenip alta yerleştirilir; imzanın dolu pikselleri altındaki
 * arka plan ile karşılaştırılır. Puan = ortalama parlaklık farkı / (1 + arka plan dokusu): düz ve zıt renkli
 * zeminde yüksek, kalabalık (araç detayı, yazı) ve benzer renkli zeminde düşük.
 */
async function legibility(file, wmUrl) {
    const [ph, wm] = await Promise.all([photoLum(file), wmPixels(wmUrl)]);
    const wh = Math.min(ph.H, wm.H);
    const off = (ph.H - wh) * SW; // alt şerit
    let n = 0, diff = 0, sum = 0, sum2 = 0;
    for (let k = 0; k < wm.idx.length; k++) {
        const q = wm.idx[k];
        if (q >= wh * SW) break;
        const lb = ph.L[off + q];
        diff += Math.abs(wm.L[k] - lb);
        sum += lb; sum2 += lb * lb; n++;
    }
    if (!n) return 0;
    const mean = sum / n;
    const sd = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
    return (diff / n) / (1 + sd / 40);
}

// --- CSS STİLLERİ (Image 2 Birebir Tasarımı) ---
const CUSTOM_CSS = `
    /* Modal Genel ve Başlık */
    .WatermarkModal, .WatermarkModal .Modal-dialog, .WatermarkModal .Modal-content {
        transform: none !important;
        filter: none !important;
        will-change: auto !important;
    }
    .WatermarkModal .Modal-dialog { max-width: 1000px !important; width: 94vw !important; }
    .WatermarkModal .Modal-content { border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); overflow: visible; }
    .WatermarkModal .Modal-header { padding: 16px 24px; border-bottom: 1px solid var(--control-bg); }
    .WatermarkModal .Modal-title { font-size: 1.25em; font-weight: 700; color: var(--heading-color); }
    .WatermarkModal .Modal-body { padding: 0; border-radius: 0 0 12px 12px; }
    .WatermarkModal .Modal-header { border-radius: 12px 12px 0 0; }
    
    /* Düzen (Layout) */
    .Watermark-Layout {
        display: flex;
        flex-direction: column;
        padding: 20px;
        gap: 20px;
    }
    @media (min-width: 900px) {
        .Watermark-Layout {
            flex-direction: row;
            align-items: stretch;
        }
        .Watermark-Left {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
        }
        /* Fotoğraf sağ sütunla aynı üst hizadan başlar; kutu fotoğrafın kendisidir */
        .Watermark-Left .Watermark-preview-area {
            min-height: 0;
            align-items: flex-start;
            background: transparent;
            border: 0;
            box-shadow: none;
            border-radius: 12px;
        }
        .Watermark-Left .Watermark-preview-area > div { align-items: flex-start !important; }
        .WatermarkModal .Watermark-Left .Watermark-preview-area img { border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,.12); }
        .Watermark-Right {
            width: 340px;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            min-width: 0;
        }
        .Watermark-Right::-webkit-scrollbar { width: 6px; }
        .Watermark-Right::-webkit-scrollbar-track { background: transparent; }
        .Watermark-Right::-webkit-scrollbar-thumb { background: #dcdfe6; border-radius: 4px; }
    }
    
    /* Önizleme Alanı */
    .Preview-Wrapper {
        width: 100%;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .Watermark-preview-area {
        position: relative;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--control-bg);
        border-radius: 12px;
        box-shadow: inset 0 2px 10px rgba(0,0,0,0.02);
        overflow: hidden;
        min-height: 240px;
    }
    .Watermark-preview-area img {
        max-width: 100%;
        max-height: 440px;
        display: block;
        object-fit: contain;
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }
    /* Ekran boyutunda önizleme (24 MP görsel yerine): yazma / geçişlerde yeniden boyama maliyetsiz */
    .Watermark-preview-area canvas.WmPreviewCanvas { display: block; max-width: 100%; max-height: 440px; width: auto; height: auto; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,.12); background: #e9edf1; }
    /* Fotoğraf hazırlanırken sabit boyutlu çerçeve ve içinde uyarı; hazır olunca yumuşakça belirir */
    .Watermark-preview-area canvas.WmPreviewCanvas:not(.is-sharp) { width: 480px; max-width: 100%; height: 320px; opacity: 0; }
    .Watermark-preview-area canvas.WmPreviewCanvas.is-sharp { animation: wmPvIn .2s ease-out; }
    @keyframes wmPvIn { from { opacity: 0; } to { opacity: 1; } }
    .WmPreviewLoading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 12px; background: #e9edf1; color: #475569; font-size: 13px; font-weight: 600; pointer-events: none; }
    .WmPreviewBox.is-sharp .WmPreviewLoading { display: none; }

    /* Plaka / boyut bilgisi */
    .WmPick-info { margin-bottom: 18px; padding: 14px; border-radius: 12px; background: var(--control-bg); }
    .WmPick-file { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--text-color); min-width: 0; }
    .WmPick-file i { color: var(--primary-color); }
    .WmPick-file span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .WmPick-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
    .WmPick-stats div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .WmPick-stats span { font-size: 11px; color: var(--muted-color); }
    .WmPick-stats strong { font-size: 13px; color: var(--text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .WmPick-stats small { font-weight: 500; color: var(--muted-color); }
    .WmPick-sub { margin: -2px 0 10px; font-size: 12px; color: var(--muted-color); }
    .WmPick-notice { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; padding: 8px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; color: var(--primary-color); background: var(--control-bg); }
    .WmPick-meta { margin-bottom: 0 !important; }
    .WmPick-plate { width: 100%; margin-top: 14px; }
    .WmPick-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 14px;
        font-size: 13px;
        font-weight: 600;
        color: var(--muted-color);
    }
    .WmPick-meta span:first-of-type { color: var(--text-color); font-variant-numeric: tabular-nums; }
    .WmPick-orient {
        margin-left: auto;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        color: var(--primary-color);
        background: var(--control-bg);
    }
    .WmPick-label {
        display: block;
        margin-bottom: 6px;
        font-size: 12px;
        font-weight: 700;
        color: var(--muted-color);
    }
    .Modern-Input-Group {
        display: flex;
        align-items: center;
        padding: 0 12px;
        border: 1px solid transparent;
        border-radius: 10px;
        background: var(--control-bg);
        transition: border-color .15s, box-shadow .15s;
    }
    .Modern-Input-Group:focus-within {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 18%, transparent);
    }
    .Modern-Input-Group i { margin-right: 10px; font-size: 13px; color: var(--muted-color); }
    .Modern-Input-Group input {
        flex: 1;
        min-width: 0;
        height: 42px;
        border: 0;
        outline: 0;
        background: transparent;
        font-size: 15px;
        font-weight: 700;
        letter-spacing: .5px;
        color: var(--text-color);
    }
    .WmPick-hint { margin-top: 6px; font-size: 12px; color: var(--muted-color); }
    .WmPick-hint i { color: #f59e0b; margin-right: 4px; }

    /* İmza seçimi: sade satırlar */
    .WmPick-loading { padding: 16px; text-align: center; font-size: 13px; color: var(--muted-color); }
    .WmPick-title { margin-bottom: 8px; font-size: 12px; font-weight: 700; color: var(--muted-color); }
    .WmPick-list { display: flex; flex-direction: column; gap: 6px; }
    .WmPick-row {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        height: 42px;
        margin: 0;
        padding: 0 12px;
        border: 1.5px solid transparent;
        border-radius: 10px;
        background: var(--control-bg);
        color: var(--text-color);
        font-size: 13px;
        font-weight: 600;
        text-align: left;
        cursor: pointer;
        transition: border-color .15s, background .15s;
    }
    .WmPick-row:hover { border-color: var(--muted-more-color, rgba(0,0,0,.15)); }
    .WmPick-row:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .WmPick-row.is-selected { border-color: var(--primary-color); }
    .WmPick-rowIcon { width: 16px; text-align: center; color: var(--muted-color); }
    .WmPick-row.is-selected .WmPick-rowIcon { color: var(--primary-color); }
    .WmPick-rowLabel { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .WmPick-radio { font-size: 15px; color: var(--muted-color); opacity: .6; }
    .WmPick-row.is-selected .WmPick-radio { color: var(--primary-color); opacity: 1; }
    .WmPick-chevron { font-size: 11px; color: var(--muted-color); transition: transform .15s; }
    .WmPick-chevron.is-open { transform: rotate(180deg); }

    .WmPick-dd { position: relative; }
    .WmPick-menu {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        z-index: 30;
        box-shadow: 0 10px 28px rgba(0,0,0,.18);
        max-height: 220px;
        overflow-y: auto;
        padding: 4px;
        border-radius: 10px;
        background: var(--body-bg);
        border: 1px solid var(--control-bg);
    }
    .WmPick-menuHead { padding: 6px 10px 4px; font-size: 11px; font-weight: 700; color: var(--muted-color); }
    .WmPick-menuItem {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 9px 10px;
        border: 0;
        border-radius: 8px;
        background: none;
        color: var(--text-color);
        font-size: 13px;
        text-align: left;
        cursor: pointer;
    }
    .WmPick-menuItem:hover { background: var(--control-bg); }
    .WmPick-menuItem.is-selected { font-weight: 700; color: var(--primary-color); }

    .WmPick-uploadLink {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 8px;
        font-size: 12px;
        font-weight: 600;
        color: var(--primary-color);
        cursor: pointer;
    }
    .WmPick-uploadLink.is-busy { opacity: .6; pointer-events: none; }
    .WmPick-empty { margin-top: 8px; font-size: 12px; color: var(--muted-color); }

    /* Tümüne uygula */
    .WmPick-applyAll {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 14px 0 0;
        font-size: 13px;
        font-weight: 600;
        color: var(--text-color);
        cursor: pointer;
    }

    /* Gelişmiş (yönetici) */
    .WmPick-advanced { margin-top: 14px; }
    .WmPick-advancedToggle {
        display: flex; align-items: center; gap: 6px; width: 100%;
        padding: 6px 0; border: 0; background: none; cursor: pointer;
        font-size: 12px; font-weight: 700; color: var(--muted-color);
    }
    .WmPick-advancedToggle .WmPick-chevron { margin-left: auto; }
    .WmPick-advanced.is-open .WmPick-chevron { transform: rotate(180deg); }
    .WmPick-advancedBody { padding-top: 6px; }

    /* Alt butonlar */
    .WmPick-actions {
        display: flex; gap: 8px; margin-top: auto; padding-top: 16px;
        border-top: 1px solid var(--control-bg);
    }
    .WatermarkModal .WmPick-actions .Button {
        flex: 1; height: 40px; margin: 0; padding: 0 12px;
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        border-radius: 10px; font-size: 13px; font-weight: 700; white-space: nowrap;
    }
    .WatermarkModal .WmPick-addBtn { cursor: pointer; background: var(--control-bg); color: var(--control-color); }
    .WatermarkModal .WmPick-uploadBtn { flex: 1.4; }

    /* Küçük resim şeridi */
    .WmPick-strip { display: flex; gap: 8px; width: 100%; margin-top: 10px; }
    .WmPick-thumbs { display: flex; gap: 8px; min-width: 0; overflow-x: auto; padding-bottom: 2px; }
    .WmPick-addTile {
        flex: 0 0 auto; width: 72px; height: 54px; margin: 0;
        display: flex; align-items: center; justify-content: center;
        border: 2px dashed var(--control-bg); border-radius: 8px;
        color: var(--muted-color); cursor: pointer; transition: border-color .15s, color .15s;
    }
    .WmPick-addTile:hover { border-color: var(--primary-color); color: var(--primary-color); }
    .WmA-meta {
        display: flex; align-items: center; gap: 8px; width: 100%; margin-top: 10px;
        font-size: 12px; font-weight: 600; color: var(--muted-color); font-variant-numeric: tabular-nums;
    }
    .WmA-meta i { color: var(--primary-color); }
    /* Dikey/kare fotoğraf: kutu fotoğrafı sarar ve ortalanır; şeritler sütun genişliğinde kalır */
    .Watermark-Left .Preview-Wrapper { align-items: stretch; }
    .Watermark-Left .Watermark-preview-area { width: fit-content; max-width: 100%; margin: 0 auto; }
    .WatermarkModal .Watermark-Left .Watermark-preview-area img { max-height: 440px; }
    .WmPick-thumb {
        position: relative;
        flex: 0 0 auto;
        width: 72px;
        height: 54px;
        padding: 0;
        border: 2px solid transparent;
        border-radius: 8px;
        overflow: hidden;
        background: var(--control-bg);
        cursor: pointer;
        opacity: .7;
    }
    .WmPick-thumb.is-active { border-color: var(--primary-color); opacity: 1; }
    .WatermarkModal .WmPick-thumb img, .WatermarkModal .WmPick-thumbCanvas { width: 100%; height: 100%; max-height: none; object-fit: cover; box-shadow: none; display: block; }
    .WmPick-thumbBadge {
        position: absolute;
        right: 3px;
        bottom: 3px;
        width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 9px;
        color: #fff;
        background: rgba(0,0,0,.6);
    }
    .WmPick-thumbBadge.is-signed { background: var(--primary-color); }
    /* Sıralama: numara, oklar, sürükle-bırak (animasyonlu) */
    .WmPick-orderHint { display: flex; align-items: center; gap: 6px; margin: 2px 0 6px; font-size: 12px; font-weight: 600; color: var(--muted-color); }
    .WmPick-orderHint i { color: var(--primary-color); }
    .WatermarkModal .WmPick-thumb { width: 96px; height: 72px; cursor: grab; transition: transform .25s ease, box-shadow .2s, opacity .2s; }
    .WatermarkModal .WmPick-thumb:active { cursor: grabbing; }
    .WatermarkModal .WmPick-thumb.is-dragging { opacity: .35; transform: scale(.94); }
    .WatermarkModal .WmPick-thumb.is-over { box-shadow: -4px 0 0 0 var(--primary-color); }
    .WmPick-num { position: absolute; top: 3px; left: 3px; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 10px; background: rgba(0,0,0,.65); color: #fff; font-size: 11px; font-weight: 800; line-height: 20px; text-align: center; }
    .WmPick-thumb.is-active .WmPick-num { background: var(--primary-color); }
    .WmPick-move { position: absolute; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; border: 0; border-radius: 50%; background: rgba(0,0,0,.6); color: #fff; font-size: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transition: opacity .15s, background .15s; }
    .WmPick-move.is-left { left: 3px; } .WmPick-move.is-right { right: 3px; }
    .WmPick-thumb:hover .WmPick-move, .WmPick-thumb:focus-within .WmPick-move, .WmPick-thumb.is-active .WmPick-move { opacity: 1; }
    .WmPick-move:hover { background: var(--primary-color); }
    @media (hover: none) { .WmPick-move { opacity: 1; } }
    .WmPick-auto { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; padding: 7px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 8%, transparent); }

    /* ===== Arşiv düzeni (sade) ===== */
    .WmA-file { width: 100%; margin-bottom: 18px; }
    .WmA-fileHint { margin: 0 0 8px; font-size: 12px; font-weight: 500; color: var(--muted-color); }
    .WmA-fileHint i { margin-right: 4px; }
    .WatermarkModal .Modern-Input-Group {
        display: flex; align-items: center; padding: 0 12px;
        border: 1px solid var(--control-bg); border-radius: 8px;
        background: var(--body-bg);
        transition: border-color .15s, box-shadow .15s;
    }
    .WatermarkModal .Modern-Input-Group:focus-within { border-color: var(--primary-color); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 15%, transparent); }
    .WatermarkModal .Modern-Input-Group i { margin-right: 10px; font-size: 14px; color: var(--muted-color); }
    .WatermarkModal .Modern-Input-Group input { flex: 1; min-width: 0; height: 44px; border: 0; outline: 0; background: transparent; font-size: 14px; font-weight: 500; color: var(--text-color); }
    .WmA-plateWarn { margin-top: 8px; padding: 6px 8px; border-left: 3px solid #ffc107; border-radius: 4px; background: #fff3cd; color: #b26a00; font-size: 11px; font-weight: 600; }

    .WmA-alert {
        display: flex; align-items: center; gap: 12px;
        margin-bottom: 20px; padding: 12px 16px;
        border-left: 4px solid #ff4d4f; border-radius: 6px;
        background: #fff4f4;
    }
    .WmA-alert i { font-size: 18px; color: #ff4d4f; }
    .WmA-alert span { font-size: 12px; font-weight: 500; line-height: 1.5; color: #cf1322; }

    .WmA-dims {
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 12px;
        font-size: 12px; font-weight: 700; letter-spacing: .5px; color: var(--muted-color);
    }
    .WmA-dims i { color: var(--primary-color); }
    .WmA-orient { margin-left: auto; font-weight: 600; letter-spacing: 0; }
    .WmA-loading { padding: 20px; text-align: center; font-size: 13px; color: var(--muted-color); }

    .WmA-options { display: flex; flex-direction: column; gap: 10px; }
    .WmA-optWrap { position: relative; }
    .WmA-opt {
        position: relative;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        width: 100%; min-height: 48px; margin: 0; padding: 0 16px;
        border: 2px solid transparent; border-radius: 8px;
        font-size: 13px; font-weight: 600; cursor: pointer; user-select: none;
        box-shadow: 0 2px 5px rgba(0,0,0,.04);
        transition: transform .15s, box-shadow .15s, border-color .15s;
    }
    .WmA-opt:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }
    .WmA-opt:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .WmA-opt.is-primary { background: var(--primary-color); color: #fff; }
    .WmA-opt.is-primary.is-selected { box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 30%, transparent); }
    .WmA-opt.is-site { background: var(--control-bg); color: var(--control-color); }
    .WmA-opt.is-site.is-selected { border-color: var(--primary-color); color: var(--primary-color); }
    .WmA-opt.is-upload { border: 2px dashed var(--control-bg); background: transparent; color: var(--primary-color); }
    .WmA-opt.is-upload.is-busy { opacity: .6; pointer-events: none; }
    .WmA-opt.is-none { background: var(--body-bg); color: var(--muted-color); border-color: var(--control-bg); }
    .WmA-opt.is-none.is-selected { border-color: var(--text-color); color: var(--text-color); }
    .WmA-chevron { position: absolute; right: 16px; font-size: 11px; transition: transform .15s; }
    .WmA-chevron.is-open { transform: rotate(180deg); }

    .WmA-menu {
        position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 30;
        max-height: 220px; overflow-y: auto; padding: 4px;
        border: 1px solid var(--control-bg); border-radius: 8px;
        background: var(--body-bg); box-shadow: 0 10px 28px rgba(0,0,0,.18);
    }
    .WmA-menuHead { padding: 6px 10px 4px; font-size: 11px; font-weight: 700; color: var(--muted-color); }
    .WmA-menuItem {
        display: flex; align-items: center; justify-content: space-between;
        width: 100%; padding: 9px 10px; border: 0; border-radius: 6px;
        background: none; color: var(--text-color); font-size: 13px; text-align: left; cursor: pointer;
    }
    .WmA-menuItem:hover { background: var(--control-bg); }
    .WmA-menuItem.is-selected { font-weight: 700; color: var(--primary-color); }
    .WmA-menuLabel { display: inline-flex; align-items: center; gap: 8px; }
    .WmA-swatch { width: 12px; height: 12px; flex-shrink: 0; border-radius: 3px; border: 2px solid transparent; }

    .WmA-splitRow { position: relative; display: grid; grid-template-columns: 2fr 1fr; gap: 8px; align-items: stretch; }
    .WmA-splitMain { min-width: 0; }
    .WmA-splitRow .WmA-optWrap { position: static; }
    .WmA-splitRow .WmA-opt { height: 100%; }
    .WmA-allSwitch {
        flex: 0 0 auto;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
        width: 100%; min-height: 48px; margin: 0; padding: 0;
        border: 2px solid var(--control-bg); border-radius: 8px;
        background: var(--body-bg); cursor: pointer;
        transition: border-color .15s;
    }
    .WmA-allSwitch.is-on { border-color: var(--primary-color); }
    .WmA-allLabel { font-size: 10px; font-weight: 700; letter-spacing: .3px; text-transform: uppercase; color: var(--muted-color); }
    .WmA-allSwitch.is-on .WmA-allLabel { color: var(--primary-color); }
    .WmA-toggle { position: relative; width: 32px; height: 18px; border-radius: 999px; background: var(--control-bg); transition: background .15s; }
    .WmA-toggle span { position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.3); transition: transform .15s; }
    .WmA-allSwitch.is-on .WmA-toggle { background: var(--primary-color); }
    .WmA-allSwitch.is-on .WmA-toggle span { transform: translateX(14px); }
    .WmA-allSwitch:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }

    .WmA-applyAll {
        display: flex; align-items: center; gap: 8px;
        width: 100%; margin: 2px 0 0; padding: 8px 12px;
        border: 1px dashed color-mix(in srgb, var(--primary-color) 45%, transparent); border-radius: 8px;
        background: color-mix(in srgb, var(--primary-color) 6%, transparent);
        color: var(--primary-color);
        font-size: 12px; font-weight: 600; text-align: left; cursor: pointer;
        transition: background .15s;
    }
    .WmA-applyAll:hover { background: color-mix(in srgb, var(--primary-color) 12%, transparent); }
    .WmA-applyAll span:first-of-type { flex: 1; }
    .WmA-applyCount { padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; color: #fff; background: var(--primary-color); }
    .WmA-applyAll.is-done { border-style: solid; border-color: var(--control-bg); background: none; color: var(--muted-color); cursor: default; }
    .WmA-applyAll.is-done .WmA-applyCount { background: var(--muted-color); }

    .WmA-wmLoading {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,.25); pointer-events: none;
    }
    .WmA-wmLoading span {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 8px 14px; border-radius: 999px;
        background: rgba(0,0,0,.7); color: #fff;
        font-size: 12px; font-weight: 600;
    }

    .WmA-postAs { margin-top: 12px; border: 2px solid #fde68a; border-radius: 8px; background: #fffbeb; }
    .WmA-postAs.is-on { border-color: #f59e0b; }
    .WmA-postAsHead {
        display: flex; align-items: center; gap: 10px; width: 100%; min-height: 44px; padding: 0 14px;
        border: 0; background: none; color: #b45309; font-size: 13px; font-weight: 600; cursor: pointer; text-align: left;
    }
    .WmA-postAsHead > span:nth-of-type(1) { flex: 1; }
    .WmA-postAs.is-on .WmA-toggle { background: #f59e0b; }
    .WmA-postAs.is-on .WmA-toggle span { transform: translateX(14px); }
    .WmA-postAsBody { padding: 0 12px 12px; }
    .WmA-postAsSearch { position: relative; display: flex; align-items: center; gap: 8px; padding: 0 10px; border: 1px solid #fde68a; border-radius: 8px; background: #fff; }
    .WmA-postAsSearch i { color: #b45309; }
    .WmA-postAsSearch input { flex: 1; min-width: 0; height: 38px; border: 0; outline: 0; background: transparent; font-size: 13px; color: #1f2937; }
    .WmA-postAsResults {
        position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 40;
        margin: 0; padding: 4px; list-style: none; max-height: 220px; overflow-y: auto;
        border-radius: 8px; background: var(--body-bg); box-shadow: 0 10px 28px rgba(0,0,0,.18);
    }
    .WmA-postAsResults button {
        display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px;
        border: 0; border-radius: 6px; background: none; color: var(--text-color); font-size: 13px; text-align: left; cursor: pointer;
    }
    .WmA-postAsResults button:hover { background: var(--control-bg); }
    .WmA-postAsResults small { margin-left: auto; color: var(--muted-color); }
    .WmA-postAsUser { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; background: #fff; border: 1px solid #fde68a; }
    .WmA-postAsName { display: flex; flex-direction: column; min-width: 0; line-height: 1.25; }
    .WmA-postAsName strong { font-size: 13px; color: #1f2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .WmA-postAsName small { font-size: 11px; color: #b45309; }
    .WmA-postAsClear { margin-left: auto; width: 28px; height: 28px; border: 0; border-radius: 50%; background: #fef3c7; color: #b45309; cursor: pointer; }
    .WmA-postAsNote { margin-top: 8px; font-size: 12px; color: #b45309; }
    .WmA-admin { margin-top: 10px; }
    /* Karanlık tema: uyarı ve yönetici kutuları tonunu koruyarak koyulaşır */
    [data-theme^=dark] .WmA-plateWarn { background: color-mix(in srgb, #ffc107 14%, var(--control-bg)); color: #f5c26b; }
    [data-theme^=dark] .WmA-postAs { background: color-mix(in srgb, #f59e0b 12%, var(--control-bg)); border-color: color-mix(in srgb, #f59e0b 45%, transparent); }
    [data-theme^=dark] .WmA-postAsHead, [data-theme^=dark] .WmA-postAsSearch i, [data-theme^=dark] .WmA-postAsName small, [data-theme^=dark] .WmA-postAsNote { color: #f5c26b; }
    [data-theme^=dark] .WmA-postAsSearch, [data-theme^=dark] .WmA-postAsUser { background: var(--body-bg); border-color: color-mix(in srgb, #f59e0b 35%, transparent); }
    [data-theme^=dark] .WmA-postAsSearch input, [data-theme^=dark] .WmA-postAsName strong { color: var(--text-color); }
    [data-theme^=dark] .WmA-postAsClear { background: color-mix(in srgb, #f59e0b 20%, var(--control-bg)); color: #f5c26b; }
    .WmA-adminBtn {
        display: flex; align-items: center; justify-content: center; gap: 8px;
        width: 100%; min-height: 48px; padding: 0 14px;
        border: 2px solid #fde68a; border-radius: 8px;
        background: #fffbeb; color: #b45309;
        font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .WmA-adminBtn.is-selected { border-color: #b45309; }

    .WmA-actions { display: flex; gap: 10px; margin-top: auto; padding-top: 20px; }
    .WatermarkModal .WmA-actions .Button {
        flex: 1; height: 44px; margin: 0; padding: 0 12px;
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        border-radius: 8px; font-size: 13px; white-space: nowrap;
    }
    .WatermarkModal .WmA-addBtn { background: var(--control-bg); color: var(--control-color); cursor: pointer; }
    .WatermarkModal .WmA-uploadBtn { font-weight: 700; width: 100%; }

    /* Animasyonlar */
    .slide-in-right { animation: slideInRight 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
    .slide-in-left { animation: slideInLeft 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes slideInRight { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideInLeft { from { transform: translateX(-100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
`;

export default class WatermarkModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);
    
    this.injectStyles();

    this.files = this.attrs.files || []; 
    this.onconfirm = this.attrs.onconfirm; 
    
    this.selections = new Array(this.files.length).fill('none');
    this.touched = new Array(this.files.length).fill(false); // kullanıcı kendisi seçtiyse otomatik seçim dokunmaz
    this.autoPicked = new Array(this.files.length).fill(false);
    this.files.forEach((f) => { if (!f.__wmKey) f.__wmKey = 'f' + Math.random().toString(36).slice(2); });
    
    // Dosya adları
    this.customFileNames = this.files.map(f => {
        const name = f.name;
        const lastDotIndex = name.lastIndexOf('.');
        return lastDotIndex !== -1 ? name.substring(0, lastDotIndex) : name;
    });

    this.activeIndex = 0;
    this.previewUrl = Stream(null); 
    this.currentImageOrientation = Stream('landscape'); 
    this.currentImageDimensions = Stream({w: 0, h: 0});
    this.hoveredOption = Stream(null);
    this.isZoomed = Stream(false);
    this.slideDirection = Stream('fade-in');
    this.isDropdownOpen = false;
    // Çoklu fotoğrafta seçim varsayılan olarak tümüne uygulanır (Spotters şablonlarında otomatik seçim fotoğraf başına yapılır)
    this.applyAll = this.files.length > 1;
    this.isUploadingPersonal = false;
    this.thumbUrls = [];

    this.handleKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.handleKeyDown);

    this.handleDocumentClick = (e) => {
        if (this.isDropdownOpen && !e.target.closest('.Watermark-Dropdown-Container')) {
            this.isDropdownOpen = false;
            m.redraw();
        }
    };
    document.addEventListener('click', this.handleDocumentClick);

    // Admin
    this.postAsEnabled = false;
    this.postAsUser = null;
    this.targetPersonal = [];
    this.userQuery = '';
    this.userSearchResults = [];
    this.isSearching = false;
    this.searchTimeout = null;

    this.loadingOptions = true;
    
    this.watermarkMode = Stream('hybrid');
    this.watermarksList = [];
    this.watermarkMap = {};

    if (this.files.length > 0) this.loadPreview(0);
    this.loadWatermarks();
  }

  injectStyles() {
      if (!document.getElementById('watermark-modal-css')) {
          const style = document.createElement('style');
          style.id = 'watermark-modal-css';
          style.innerHTML = CUSTOM_CSS;
          document.head.appendChild(style);
      }
  }

  hide() {
      if (!this.isConfirmed) {
          if (confirm("Yükleme işlemi iptal edilecektir. Onaylıyor musunuz?")) {
              if (this.attrs.oncancel) this.attrs.oncancel();
              super.hide();
          }
      } else {
          super.hide();
      }
  }

  onremove(vnode) {
      if (!this.isConfirmed && this.attrs.oncancel) {
          this.attrs.oncancel();
      }
      // Önizlemeler paylaşılan önbellekte; künye modalı da aynılarını kullanır (iptal edilmez)
      const styleTag = document.getElementById('watermark-modal-css');
      if (styleTag) styleTag.remove();
      document.removeEventListener('keydown', this.handleKeyDown);
      document.removeEventListener('click', this.handleDocumentClick);
      super.onremove(vnode);
  }

  handleKeyDown(e) {
      if (this.files.length <= 1) return;
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowRight') {
          if (this.activeIndex < this.files.length - 1) {
              this.changeActiveImage(1);
              m.redraw();
          }
      } else if (e.key === 'ArrowLeft') {
          if (this.activeIndex > 0) {
              this.changeActiveImage(-1);
              m.redraw();
          }
      }
  }

  loadPreview(index) {
      const file = this.files[index];
      if (!file) return;

      // Dosyanın kendi adresi anında gösterilir (tarayıcı arka planda çözer); boyut çözülünce yön belirlenir
      this.previewUrl(fileUrl(file));
      fileDims(file).then(({ width: w, height: h }) => {
          if (this.activeIndex !== index) return;
          let orientation = 'landscape';
          if (w && h) {
              const ratioDiff = Math.abs(w - h) / Math.max(w, h);
              if (ratioDiff < 0.04 || w === h) orientation = 'square';
              else if (w < h) orientation = 'portrait';
          }
          this.currentImageOrientation(orientation);
          this.currentImageDimensions({ w, h });
          this.isDropdownOpen = false;
          this.normalizeSelection(index);
          m.redraw();
      });
      warm(this.files[index + 1]);
  }

  changeActiveImage(direction) {
      const newIndex = this.activeIndex + direction;
      if (newIndex >= 0 && newIndex < this.files.length) {
          this.slideDirection(direction > 0 ? 'slide-in-right' : 'slide-in-left');
          this.activeIndex = newIndex;
          this.loadPreview(newIndex);
      }
  }

  handleFileNameChange(e) {
      // Plaka alanı: Türkçe büyük harf, fazla boşluklar tekilleşir
      const el = e.target;
      const v = el.value.toLocaleUpperCase('tr-TR').replace(/\s{2,}/g, ' ');
      if (el.value !== v) {
          const pos = el.selectionStart;
          el.value = v;
          try { el.setSelectionRange(pos, pos); } catch (err) {}
      }
      this.customFileNames[this.activeIndex] = v;
      // Her tuşta tüm sayfa yeniden çizilmez (~100 ms); yazma durunca tek çizim
      e.redraw = false;
      clearTimeout(this._nameRedraw);
      this._nameRedraw = setTimeout(() => m.redraw(), 300);
  }

  addMoreFiles(e) {
      const newFiles = Array.from(e.target.files);
      if (newFiles.length === 0) return;
      newFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
      
      const newSelections = new Array(newFiles.length).fill(this.applyAll ? this.selections[this.activeIndex] : this.defaultSelection());
      const newCustomFileNames = newFiles.map(f => {
          const name = f.name;
          const lastDotIndex = name.lastIndexOf('.');
          return lastDotIndex !== -1 ? name.substring(0, lastDotIndex) : name;
      });

      newFiles.forEach((f) => { f.__wmKey = 'f' + Math.random().toString(36).slice(2); });
      this.files.push(...newFiles);
      this.selections.push(...newSelections);
      this.customFileNames.push(...newCustomFileNames);
      this.touched.push(...newFiles.map(() => this.applyAll));
      this.autoPicked.push(...newFiles.map(() => false));
      if (!this.applyAll) this.autoSelectAll();
      
      e.target.value = '';
      m.redraw();
  }

  removeActiveFile() {
      if(this.files.length === 1) {
          this.hide();
          return;
      }
      this.files.splice(this.activeIndex, 1);
      this.selections.splice(this.activeIndex, 1);
      this.customFileNames.splice(this.activeIndex, 1);
      this.touched.splice(this.activeIndex, 1);
      this.autoPicked.splice(this.activeIndex, 1);
      
      if (this.activeIndex >= this.files.length) {
          this.activeIndex = this.files.length - 1;
      }
      this.loadPreview(this.activeIndex);
  }

  className() { return 'WatermarkModal Modal--large'; }
  title() { return `İmza Seçimi (${this.activeIndex + 1} / ${this.files.length})`; }

  content() {
    const isAdmin = app.session.user && app.session.user.isAdmin();
    const { w, h } = this.currentImageDimensions();

    return (
      <div className="Modal-body" style={{ padding: 0 }}>
        <div className="Watermark-Layout">
            {/* SOL: önizleme ve dosya adı */}
            <div className="Watermark-Left">
                {this.renderPreviewArea()}
            </div>

            {/* SAĞ: uyarı, boyut, imza seçenekleri, yönetici ve butonlar */}
            <div className="Watermark-Right">
                {this.renderPlateField()}

                {this.loadingOptions ? (
                    <div className="WmA-loading"><i className="fas fa-spinner fa-spin"></i> İmzalar yükleniyor...</div>
                ) : this.loadFailed ? (
                    <div className="WmA-loading WmA-loadFailed">
                        <i className="fas fa-exclamation-triangle"></i> İmzalar yüklenemedi.{' '}
                        <button type="button" className="Button Button--link" onclick={() => this.loadWatermarks()}>Tekrar dene</button>
                        <div style={{ marginTop: '6px', fontSize: '12px', opacity: .8 }}>İmzasız yüklemeye de devam edebilirsiniz.</div>
                    </div>
                ) : (
                    this.renderSignatureControls()
                )}

                {isAdmin && this.renderAdminPanel()}

                <div className="WmA-actions">
                    <Button
                        className="Button Button--primary WmA-uploadBtn"
                        type="button"
                        icon="fas fa-upload"
                        onclick={(e) => { e.preventDefault(); this.confirmUpload(); }}
                    >
                        {this.files.length} Fotoğrafı Yükle
                    </Button>
                </div>
            </div>
        </div>
      </div>
    );
  }

  /** Önizleme canvas'ını çizer; hazır olunca kapsayıcıya is-sharp ekleyip yükleniyor yazısını gizler */
  attachPreview(canvas) {
      const box = canvas.parentNode;
      if (box) box.classList.add('WmPreviewBox');
      const file = this.files[this.activeIndex];
      if (canvas._file !== file && box) box.classList.remove('is-sharp');
      drawPreview(canvas, file);
      const sync = () => { if (box && canvas.classList.contains('is-sharp') && canvas._file === file) box.classList.add('is-sharp'); };
      sync();
      if (!canvas._obs) {
          canvas._obs = new MutationObserver(() => { if (box && canvas.classList.contains('is-sharp')) box.classList.add('is-sharp'); });
          canvas._obs.observe(canvas, { attributes: true, attributeFilter: ['class'] });
      }
  }

  /** Seçili imzanın önizleme adresi ('' = imzasız) */
  watermarkUrlFor(id) {
      const wm = id && id !== 'none' ? this.watermarkMap[id] : null;
      if (!wm || !wm.url) return '';
      let baseUrl = app.forum.attribute('baseUrl').replace(/\/$/, '');
      if (window.location.protocol === 'https:' && baseUrl.startsWith('http:')) baseUrl = baseUrl.replace(/^http:/, 'https:');
      return wm.url.startsWith('http') ? wm.url : baseUrl + wm.url;
  }

  // --- SOL PANEL: ÖNİZLEME ALANI ---
  renderPreviewArea() {
      const currentSelectionId = this.selections[this.activeIndex];
      let baseUrl = app.forum.attribute('baseUrl').replace(/\/$/, '');
      if (window.location.protocol === 'https:' && baseUrl.startsWith('http:')) baseUrl = baseUrl.replace(/^http:/, 'https:');
      const selectedWm = this.watermarkMap[currentSelectionId];
      let watermarkUrl = '';
      if (selectedWm && selectedWm.url) {
          watermarkUrl = selectedWm.url.startsWith('http') ? selectedWm.url : (baseUrl + selectedWm.url);
      }

      return (
        <div className="Preview-Wrapper">
            <div className="Watermark-preview-area">
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {this.previewUrl() ? (
                        <div 
                            key={`preview-wrapper-${this.activeIndex}`}
                            style={{
                                position: 'relative', 
                                display: 'inline-block', 
                                maxWidth: '100%', 
                                cursor: 'zoom-in'
                            }}
                            onclick={() => { this.isZoomed(true); m.redraw(); }}
                            title="Tam ekranda incelemek için tıklayın"
                        >
                            <canvas className="WmPreviewCanvas" oncreate={(v) => this.attachPreview(v.dom)} onupdate={(v) => this.attachPreview(v.dom)}></canvas>
                            <div className="WmPreviewLoading"><i className="fas fa-circle-notch fa-spin"></i> Fotoğraf yükleniyor…</div>
                            {currentSelectionId !== 'none' && watermarkUrl && (
                                <img
                                    className={this.slideDirection()}
                                    src={watermarkUrl}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: this.wmLoadedSrc === watermarkUrl ? 1 : 0, transition: 'opacity .25s' }}
                                    onload={() => { this.wmLoadedSrc = watermarkUrl; m.redraw(); }}
                                    onerror={(e) => { e.target.style.display = 'none'; this.wmLoadedSrc = watermarkUrl; m.redraw(); }}
                                />
                            )}
                            {currentSelectionId !== 'none' && watermarkUrl && this.wmLoadedSrc !== watermarkUrl ? (
                                <div className="WmA-wmLoading">
                                    <span><i className="fas fa-circle-notch fa-spin"></i> {selectedWm && selectedWm.label ? selectedWm.label : 'Seçilen imza'} yükleniyor…</span>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div style={{ color: '#64748b', padding: '20px' }}>
                            <i className="fas fa-spinner fa-spin"></i> Önizleme hazırlanıyor...
                        </div>
                    )}
                </div>

                {/* SİLME BUTONU (Sol Üst) */}
                <button 
                    className="Button Button--icon" 
                    type="button" 
                    title="Bu Fotoğrafı Sil"
                    style={{ position: 'absolute', top: '10px', left: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} 
                    onclick={(e) => { e.preventDefault(); e.stopPropagation(); this.removeActiveFile(); }}
                >
                    <i className="fas fa-trash"></i>
                </button>
                
                {/* SAYAÇ ROZETİ (Sağ Üst) */}
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                    {this.activeIndex + 1} / {this.files.length}
                </div>

                {/* FOTOĞRAF GEÇİŞ OKLARI */}
                {this.files.length > 1 && (
                    <div style={{ position: 'absolute', width: '100%', top: '50%', left: 0, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'space-between', padding: '0 8px', pointerEvents: 'none' }}>
                        <button className="Button Button--icon Button--primary" type="button" style={{ pointerEvents: 'auto', opacity: this.activeIndex === 0 ? 0.3 : 1, boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} onclick={(e) => { e.preventDefault(); e.stopPropagation(); this.changeActiveImage(-1); }} disabled={this.activeIndex === 0}><i className="fas fa-chevron-left"></i></button>
                        <button className="Button Button--icon Button--primary" type="button" style={{ pointerEvents: 'auto', opacity: this.activeIndex === this.files.length - 1 ? 0.3 : 1, boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} onclick={(e) => { e.preventDefault(); e.stopPropagation(); this.changeActiveImage(1); }} disabled={this.activeIndex === this.files.length - 1}><i className="fas fa-chevron-right"></i></button>
                    </div>
                )}
            </div>

            {/* BİLGİ ŞERİDİ */}
            {this.renderMetaStrip()}

            {/* KÜÇÜK RESİM ŞERİDİ: her fotoğrafın imza durumu + fotoğraf ekleme */}
            {this.files.length > 1 ? (
                <div className="WmPick-orderHint"><i className="fas fa-arrows-alt-h"></i> Fotoğrafları sürükleyerek ya da oklarla sıralayın; mesajda bu sırayla yer alırlar.</div>
            ) : null}
            <div className="WmPick-strip">
                    <div className="WmPick-thumbs">{this.files.map((f, i) => {
                        const sel = this.selections[i];
                        const signed = sel && sel !== 'none';
                        if (!f.__wmKey) f.__wmKey = 'f' + Math.random().toString(36).slice(2);
                        return (
                            <div
                                key={f.__wmKey}
                                data-key={f.__wmKey}
                                role="button"
                                tabindex="0"
                                draggable="true"
                                className={'WmPick-thumb' + (i === this.activeIndex ? ' is-active' : '') + (this.dragFrom === i ? ' is-dragging' : '') + (this.dragOver === i && this.dragFrom !== i ? ' is-over' : '')}
                                title={f.name + ' — sürükleyerek sıralayın'}
                                ondragstart={(e) => { this.dragFrom = i; try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); } catch (x) {} }}
                                ondragover={(e) => { e.preventDefault(); if (this.dragOver !== i) { this.dragOver = i; m.redraw(); } else e.redraw = false; }}
                                ondragleave={(e) => { e.redraw = false; }}
                                ondrop={(e) => { e.preventDefault(); const from = this.dragFrom; this.dragFrom = null; this.dragOver = null; if (from != null) this.moveFile(from, i); }}
                                ondragend={() => { this.dragFrom = null; this.dragOver = null; }}
                                onclick={() => {
                                    if (i === this.activeIndex) return;
                                    this.slideDirection(i > this.activeIndex ? 'slide-in-right' : 'slide-in-left');
                                    this.activeIndex = i;
                                    this.loadPreview(i);
                                }}
                            >
                                <canvas className="WmPick-thumbCanvas" oncreate={(v) => drawThumb(v.dom, f)} onupdate={(v) => drawThumb(v.dom, f)}></canvas>
                                <span className="WmPick-num">{i + 1}</span>
                                {i > 0 ? (
                                    <button type="button" className="WmPick-move is-left" title="Sola taşı" aria-label="Sola taşı" onclick={(e) => { e.stopPropagation(); this.moveFile(i, i - 1); }}><i className="fas fa-chevron-left"></i></button>
                                ) : null}
                                {i < this.files.length - 1 ? (
                                    <button type="button" className="WmPick-move is-right" title="Sağa taşı" aria-label="Sağa taşı" onclick={(e) => { e.stopPropagation(); this.moveFile(i, i + 1); }}><i className="fas fa-chevron-right"></i></button>
                                ) : null}
                                <span className={'WmPick-thumbBadge' + (signed ? ' is-signed' : '')}>
                                    <i className={signed ? 'fas fa-signature' : 'fas fa-ban'}></i>
                                </span>
                            </div>
                        );
                    })}</div>
                    <label className="WmPick-addTile" title="Fotoğraf ekle">
                        <i className="fas fa-plus"></i>
                        <input type="file" multiple accept="image/*" style={{ display: 'none' }} onchange={this.addMoreFiles.bind(this)} />
                    </label>
            </div>

            {/* LIGHTBOX (Tam Ekran İnceleme) */}
            {this.isZoomed() && (
                <div 
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        background: 'rgba(0,0,0,0.85)', zIndex: 999999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out'
                    }}
                    onclick={(e) => { e.stopPropagation(); this.isZoomed(false); m.redraw(); }}
                >
                    <div style={{ position: 'relative', display: 'inline-block', maxWidth: '95vw', maxHeight: '95vh' }}>
                        <img className={this.slideDirection()} src={this.previewUrl()} style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', display: 'block', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} />
                        {currentSelectionId !== 'none' && watermarkUrl && (
                            <img className={this.slideDirection()} src={watermarkUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} onerror={(e) => { e.target.style.display = 'none'; }} />
                        )}
                    </div>
                    
                    <button style={{ position: 'absolute', top: '20px', right: '30px', background: 'transparent', border: 'none', color: '#fff', fontSize: '30px', cursor: 'pointer', padding: '10px' }} onclick={(e) => { e.stopPropagation(); this.isZoomed(false); m.redraw(); }}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            )}
        </div>
      );
  }

  // --- SOL: FOTOĞRAF BİLGİ ŞERİDİ ---
  renderMetaStrip() {
      const { w, h } = this.currentImageDimensions();
      const file = this.files[this.activeIndex];
      const parts = [];
      if (w > 0) {
          parts.push(w + ' × ' + h);
          parts.push(this.orientationLabel());
          parts.push(((w * h) / 1e6).toFixed(1).replace('.', ',') + ' MP');
      }
      if (file) parts.push(file.size >= 1048576 ? (file.size / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(file.size / 1024)) + ' KB');

      return (
        <div className="WmA-meta">
            <i className={this.currentImageOrientation() === 'portrait' ? 'fas fa-portrait' : 'fas fa-image'}></i>
            <span>{parts.length ? parts.join(' · ') : 'Ölçülüyor…'}</span>
        </div>
      );
  }

  // --- SOL: DOSYA ADI / PLAKA ---
  renderPlateField() {
      const name = this.customFileNames[this.activeIndex] || '';
      const looksLikePlate = /^[0-9]{2}\s*[A-ZÇĞİÖŞÜ]{1,3}\s*[0-9]{2,4}(?:\s*[-_.]\s*\d{1,3}|\s*\(\d{1,3}\))?$/i.test(name.trim());

      return (
        <div className="WmA-file">
            <p className="WmA-fileHint"><i className="fas fa-info-circle"></i> Görsel adını araç plakası olarak yazınız (Örn: 34 CDL 37).</p>
            <div className="Modern-Input-Group">
                <i className="fas fa-pen"></i>
                <input type="text" placeholder="Dosya adı" value={name} oninput={this.handleFileNameChange.bind(this)} />
            </div>
            {name.trim() && !looksLikePlate ? (
                <div className="WmA-plateWarn">
                    <i className="fas fa-exclamation-triangle"></i> Dosya adı araç plakasına benzemiyor. Doğru künye eşleşmesi için plaka girmeniz tavsiye edilir.
                </div>
            ) : null}
        </div>
      );
  }

  // --- SAĞ: İMZA SEÇENEKLERİ ---
  // Kişisel imza (varsa) · fotoğrafın yönüne uygun site imzaları (varsa) · İmza Ekleme (Orijinal Kalsın)
  renderSignatureControls() {
      const mode = this.watermarkMode(); // 'templates' | 'personal' | 'hybrid'
      const current = this.selections[this.activeIndex];
      const allowPersonal = mode !== 'templates';
      const allowTemplates = mode !== 'personal';
      const personal = allowPersonal ? this.getMatchingPersonalWatermark() : null;
      const templates = allowTemplates ? this.getFilteredSiteTemplates() : [];
      const personalId = personal ? (personal.id || personal.filename) : null;
      const canUpload = allowPersonal && !personal && this.allowPersonalUpload && !this.postAsUser;

      const autoNote = this.autoBusy && !this.autoPicked[this.activeIndex] && !this.touched[this.activeIndex]
          ? <div className="WmPick-auto"><i className="fas fa-circle-notch fa-spin"></i> Bu fotoğrafa en uygun imza seçiliyor…</div>
          : this.autoPicked[this.activeIndex]
          ? <div className="WmPick-auto"><i className="fas fa-magic"></i> {personal ? 'İmzanız otomatik seçildi.' : 'Bu fotoğrafta en iyi görünen imza (renk ve konum) otomatik seçildi.'} Değiştirebilirsiniz.</div>
          : null;
      return (
        <div className="WmA-options">
            {autoNote}
            {personal ? this.renderBigOption(personalId, 'fas fa-signature', this.postAsUser ? '@' + this.postAsUser.username() + ' imzası' : 'Kişisel İmza', current === personalId, 'is-primary') : null}

            {canUpload ? (
                <label className={'WmA-opt is-upload' + (this.isUploadingPersonal ? ' is-busy' : '')}>
                    <i className={this.isUploadingPersonal ? 'fas fa-spinner fa-spin' : 'fas fa-signature'}></i>
                    <span>Kişisel İmza Yükle</span>
                    <input type="file" accept="image/png,image/webp" style={{ display: 'none' }} disabled={this.isUploadingPersonal} onchange={(e) => this.uploadPersonalWatermark(e)} />
                </label>
            ) : null}

            {templates.length ? this.withApplySwitch(this.renderSiteDropdown(templates, current)) : null}

            {templates.length
                ? this.renderBigOption('none', 'fas fa-ban', 'İmza Ekleme (Orijinal Kalsın)', current === 'none', 'is-none')
                : this.withApplySwitch(this.renderBigOption('none', 'fas fa-ban', 'İmza Ekleme (Orijinal Kalsın)', current === 'none', 'is-none'))}
        </div>
      );
  }

  orientationLabel() {
      const o = this.currentImageOrientation();
      return o === 'portrait' ? 'Dikey' : (o === 'square' ? 'Kare' : 'Yatay');
  }

  /**
   * Çoklu fotoğrafta seçeneğin yanına "Tümüne" anahtarı ekler.
   * Açıkken yapılan seçim tüm fotoğraflara, kapalıyken yalnızca etkin fotoğrafa uygulanır.
   */
  withApplySwitch(control) {
      if (this.files.length < 2) return control;
      const on = !!this.applyAll;

      return (
        <div className="WmA-splitRow">
            <div className="WmA-splitMain">{control}</div>
            <button
                type="button"
                className={'WmA-allSwitch' + (on ? ' is-on' : '')}
                role="switch"
                aria-checked={on ? 'true' : 'false'}
                title={on ? 'Seçim tüm fotoğraflara uygulanıyor' : 'Seçim yalnızca bu fotoğrafa uygulanıyor'}
                onclick={(e) => {
                    e.preventDefault();
                    this.applyAll = !on;
                    if (this.applyAll) this.applyToAll(this.selections[this.activeIndex]);
                    m.redraw();
                }}
            >
                <span className="WmA-allLabel">Tümüne</span>
                <span className="WmA-toggle"><span></span></span>
            </button>
        </div>
      );
  }

  renderBigOption(id, icon, label, isSelected, variant) {
      return (
        <div className="WmA-optWrap">
            <button type="button" className={'WmA-opt ' + variant + (isSelected ? ' is-selected' : '')} aria-pressed={isSelected ? 'true' : 'false'} onclick={() => { this.selectWatermark(id); this.isDropdownOpen = false; }}>
                <i className={icon}></i>
                <span>{label}</span>
            </button>
        </div>
      );
  }

  /** Admin'de tanımlı buton renkleri (zemin/yazı/kenarlık); boş olanlar temadan gelir */
  wmButtonStyle(wm, swatch) {
      const st = {};
      if (wm.bg_color) st.background = wm.bg_color;
      if (wm.text_color) st.color = wm.text_color;
      if (wm.border_color) st.borderColor = wm.border_color;
      if (swatch && !wm.bg_color && !wm.border_color) st.background = 'var(--control-bg)';
      return st;
  }

  renderSiteDropdown(templates, current) {
      const selected = templates.find((t) => (t.id || t.filename) === current);

      return (
        <div className="Watermark-Dropdown-Container WmA-optWrap">
            <button
                type="button"
                className={'WmA-opt is-site' + (selected ? ' is-selected' : '')}
                style={selected ? this.wmButtonStyle(selected) : undefined}
                aria-expanded={this.isDropdownOpen ? 'true' : 'false'}
                onclick={(e) => { e.preventDefault(); this.isDropdownOpen = !this.isDropdownOpen; m.redraw(); }}
            >
                <i className="fas fa-stamp"></i>
                <span>{selected ? selected.label : 'Site İmzası Seç'}</span>
                <i className={'fas fa-chevron-down WmA-chevron' + (this.isDropdownOpen ? ' is-open' : '')}></i>
            </button>

            {this.isDropdownOpen ? (
                <div className="WmA-menu">
                    <div className="WmA-menuHead">{this.orientationLabel()} fotoğraf imzaları</div>
                    {templates.map((wm) => {
                        const id = wm.id || wm.filename;
                        const on = current === id;
                        return (
                            <button type="button" className={'WmA-menuItem' + (on ? ' is-selected' : '')} onclick={() => { this.selectWatermark(id); this.isDropdownOpen = false; m.redraw(); }}>
                                <span className="WmA-menuLabel">
                                    <span className="WmA-swatch" style={this.wmButtonStyle(wm, true)}></span>
                                    {wm.label}
                                </span>
                                {on ? <i className="fas fa-check"></i> : null}
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
      );
  }

  uploadPersonalWatermark(e) {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;

      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      // Sunucu yönü dosya adından ("dikey") anlıyor
      const name = (this.currentImageOrientation() === 'portrait' ? 'kisisel_dikey.' : 'kisisel_yatay.') + ext;
      const fd = new FormData();
      fd.append('watermark', new File([file], name, { type: file.type }));

      this.isUploadingPersonal = true;
      m.redraw();

      app.request({
          method: 'POST',
          url: app.forum.attribute('apiUrl') + '/framio-media/watermarks',
          body: fd,
      }).then((res) => {
          this.isUploadingPersonal = false;
          app.alerts.show({ type: 'success' }, 'Kişisel imzanız kaydedildi.');
          return this.loadWatermarks().then(() => {
              if (res && res.filename && this.watermarkMap[res.filename]) this.selectWatermark(res.filename);
          });
      }).catch(() => {
          this.isUploadingPersonal = false;
          app.alerts.show({ type: 'error' }, 'İmza yüklenemedi. Yalnızca şeffaf PNG veya WebP desteklenir.');
          m.redraw();
      });
  }

  // --- YÖNETİCİ: ÜYE ADINA PAYLAŞ ---
  // Açıkken seçilen üye; görseller ve konu/mesaj doğrudan o üye adına kaydedilir.
  // İmza seçenekleri admin'deki dağıtım moduna göre (şablon/kişisel/hibrit) üyenin
  // kişisel imzaları ve site imzalarından oluşur.
  renderAdminPanel() {
      const on = !!this.postAsEnabled;
      const user = this.postAsUser;

      return (
        <div className={'WmA-postAs' + (on ? ' is-on' : '')}>
            <button type="button" className="WmA-postAsHead" role="switch" aria-checked={on ? 'true' : 'false'} onclick={() => this.togglePostAs()}>
                <i className="fas fa-user-secret"></i>
                <span>Üye adına paylaş</span>
                <span className="WmA-toggle"><span></span></span>
            </button>

            {on ? (
                <div className="WmA-postAsBody">
                    {user ? (
                        <div className="WmA-postAsUser">
                            <Avatar user={user} className="Avatar--small" />
                            <div className="WmA-postAsName">
                                <strong>{user.displayName()}</strong>
                                <small>@{user.username()} adına paylaşılacak</small>
                            </div>
                            <button type="button" className="WmA-postAsClear" title="Üyeyi değiştir" onclick={() => this.setPostAsUser(null)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    ) : (
                        <div className="WmA-postAsSearch">
                            <i className={this.isSearching ? 'fas fa-spinner fa-spin' : 'fas fa-search'}></i>
                            <input type="text" placeholder="Üye ara (en az 2 harf)…" value={this.userQuery || ''} oninput={this.handleSearchInput.bind(this)} />
                            {this.userSearchResults.length ? (
                                <ul className="WmA-postAsResults">
                                    {this.userSearchResults.map((u) => (
                                        <li>
                                            <button type="button" onclick={() => this.setPostAsUser(u)}>
                                                <Avatar user={u} className="Avatar--small" />
                                                <span>{u.displayName()}</span>
                                                <small>@{u.username()}</small>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                    )}
                    {this.loadingTargetWm ? <div className="WmA-postAsNote"><i className="fas fa-spinner fa-spin"></i> Üyenin imzaları yükleniyor…</div> : null}
                </div>
            ) : null}
        </div>
      );
  }

  togglePostAs() {
      this.postAsEnabled = !this.postAsEnabled;
      if (!this.postAsEnabled) this.setPostAsUser(null);
      m.redraw();
  }

  /** Hedef üyeyi ayarlar ve (varsa) kişisel imzalarını getirir */
  setPostAsUser(user) {
      this.postAsUser = user;
      this.targetPersonal = [];
      this.userQuery = '';
      this.userSearchResults = [];

      // Önceki kişinin kişisel imzası seçiliyse imzasıza dön
      this.selections = this.selections.map((sel) => {
          const wm = this.watermarkMap[sel];
          return wm && wm.is_personal ? 'none' : sel;
      });

      if (user && this.watermarkMode() !== 'templates') {
          this.loadingTargetWm = true;
          app.request({
              method: 'GET',
              url: app.forum.attribute('apiUrl') + '/framio-media/watermarks',
              params: { for_user: user.username() },
          }).then((res) => {
              this.targetPersonal = (res.user || []).map((wm) => Object.assign({}, wm, { is_personal: true }));
              this.targetPersonal.forEach((wm) => { this.watermarkMap[wm.id || wm.filename] = wm; });
              this.loadingTargetWm = false;
              m.redraw();
          }).catch(() => {
              this.loadingTargetWm = false;
              m.redraw();
          });
      }
      m.redraw();
  }

  /**
   * Seçili imza bu fotoğrafın yönüne uymuyorsa düzelt: kişisel imza yöne uygun
   * kişisel imzaya çevrilir; başka yönün site imzası seçiliyse imzasıza döner.
   */
  normalizeSelection(index) {
      if (index !== this.activeIndex || this.loadingOptions) return;
      const sel = this.selections[index];
      if (!sel || sel === 'none' || sel === 'admin_override') return;
      const wm = this.watermarkMap[sel];
      if (!wm) { this.selections[index] = 'none'; return; }
      if (wm.is_personal) {
          const p = this.getMatchingPersonalWatermark();
          if (p) this.selections[index] = p.id || p.filename;
          return;
      }
      const ok = this.getFilteredSiteTemplates().some((t) => (t.id || t.filename) === sel);
      if (!ok) this.selections[index] = 'none';
  }

  // --- YÖN BAZLI SİTE ŞABLONLARI FİLTRESİ ---
  getFilteredSiteTemplates() {
      const orientation = this.currentImageOrientation(); // 'landscape', 'portrait', 'square'
      const siteTemplates = this.watermarksList.filter(wm => !wm.is_personal);

      return siteTemplates.filter(wm => {
          const o = (wm.orientation || wm.type || 'landscape').toLowerCase();
          return o === 'all' || o === orientation;
      });
  }


  // --- KULLANICININ YÖNE UYGUN KİŞİSEL İMZASINI BULMA ---
  getMatchingPersonalWatermark() {
      const orientation = this.currentImageOrientation();
      const personalList = this.postAsUser
          ? (this.targetPersonal || [])
          : this.watermarksList.filter(wm => wm.is_personal);
      if (personalList.length === 0) return null;

      const matched = personalList.find(wm => {
          const o = (wm.orientation || wm.type || '').toLowerCase();
          const fn = (wm.filename || '').toLowerCase();
          if (orientation === 'portrait') {
              return o === 'portrait' || fn.includes('dikey');
          }
          return o === 'landscape' || (!fn.includes('dikey'));
      });

      return matched || personalList[0];
  }

  loadWatermarks() {
    this.loadingOptions = true;
    this.loadFailed = false;
    // İstek cevapsız kalırsa (eklenti / ağ engeli) ekran "yükleniyor"da takılmasın: 12 sn sonra tekrar dene seçeneği
    const attempt = (this.loadAttempt = (this.loadAttempt || 0) + 1);
    clearTimeout(this.loadTimer);
    this.loadTimer = setTimeout(() => {
        if (this.loadingOptions && attempt === this.loadAttempt) {
            this.loadingOptions = false;
            this.loadFailed = true;
            m.redraw();
        }
    }, 12000);
    return app.request({
        method: 'GET',
        url: app.forum.attribute('apiUrl') + '/framio-media/watermarks',
        errorHandler: () => {},
    }).then((response) => {
        if (attempt !== this.loadAttempt) return;
        clearTimeout(this.loadTimer);
        response = response || {};
        this.loadFailed = false;
        this.watermarkMode(response.mode || 'hybrid');
        this.allowPersonalUpload = response.allow_personal_upload !== false;
        const list = response.watermarks || [];
        this.watermarksList = list;
        this.watermarkMap = {};
        
        list.forEach(wm => {
            const id = wm.id || wm.filename || wm.name;
            this.watermarkMap[id] = wm;
        });

        this.loadingOptions = false;
        if (!this.restoredLast) {
            this.restoredLast = true;
            const last = this.defaultSelection();
            if (last !== 'none') this.selections = this.selections.map((sel) => (sel === 'none' ? last : sel));
        }
        this.normalizeSelection(this.activeIndex);
        this.autoSelectAll();
        m.redraw();
    }).catch(err => {
        console.error(err);
        if (attempt !== this.loadAttempt) return;
        clearTimeout(this.loadTimer);
        this.loadingOptions = false;
        this.loadFailed = true;
        m.redraw();
    });
  }

  handleSearchInput(e) {
      const q = e.target.value;
      this.userQuery = q;
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
      if (q.trim().length < 2) { this.userSearchResults = []; m.redraw(); return; }
      this.searchTimeout = setTimeout(() => {
          this.isSearching = true; m.redraw();
          app.store.find('users', { filter: { q: q.trim() }, page: { limit: 6 } })
              .then((u) => { this.userSearchResults = u; this.isSearching = false; m.redraw(); })
              .catch(() => { this.isSearching = false; m.redraw(); });
      }, 300);
  }

  selectWatermark(id) {
      if (this.applyAll) { this.selections.fill(id); this.touched.fill(true); this.autoPicked.fill(false); }
      else { this.selections[this.activeIndex] = id; this.touched[this.activeIndex] = true; this.autoPicked[this.activeIndex] = false; }
      this.syncApplyAll();
      m.redraw();
  }

  /** Tüm fotoğraflarda aynı imza varsa "Tümüne" anahtarı açık görünür */
  syncApplyAll() {
      if (this.files.length < 2) return;
      const first = this.selections[0];
      if (first && this.selections.every((s) => s === first)) this.applyAll = true;
  }

  /** Dosyanın yönü (yatay / dikey / kare) */
  async orientationOf(file) {
      const { width: w, height: h } = await fileDims(file);
      if (!w || !h) return 'landscape';
      const ratioDiff = Math.abs(w - h) / Math.max(w, h);
      if (ratioDiff < 0.04 || w === h) return 'square';
      return w < h ? 'portrait' : 'landscape';
  }

  /**
   * Otomatik imza:
   *  - Kişisel imzası olan kullanıcı (Ulaşım Arşiv mantığı): fotoğrafın yönüne uygun kişisel imza seçili gelir.
   *  - Site şablonları (Spotters: renk × konum): her fotoğraf için imzanın düşeceği alanda en okunaklı olan seçilir.
   * Kullanıcının elle seçtiği fotoğraflara dokunulmaz.
   */
  async autoSelectAll() {
      const mode = this.watermarkMode();
      const personalAll = mode !== 'templates' ? (this.postAsUser ? this.targetPersonal || [] : this.watermarksList.filter((w) => w.is_personal)) : [];
      const templatesAll = mode !== 'personal' ? this.watermarksList.filter((w) => !w.is_personal) : [];
      if (!personalAll.length && !templatesAll.length) return;
      this.autoBusy = true;
      m.redraw();
      // Tüm fotoğraflar aynı anda puanlanır (sırayla beklemez)
      await Promise.all(this.files.map(async (file, i) => {
          if (this.touched[i] || (this.selections[i] && this.selections[i] !== 'none')) return;
          try {
              const o = await this.orientationOf(file);
              let pick = null;
              if (personalAll.length) {
                  // Kişisel imza (iki sitede de): tüm fotoğraflara uygulanır, yalnızca yönüne uygun sürümü seçilir
                  pick = personalAll.find((w) => {
                      const wo = (w.orientation || w.type || '').toLowerCase();
                      const fn = (w.filename || '').toLowerCase();
                      return o === 'portrait' ? wo === 'portrait' || fn.includes('dikey') : wo === 'landscape' || !fn.includes('dikey');
                  }) || personalAll[0];
              } else {
                  const cands = templatesAll.filter((w) => { const wo = (w.orientation || w.type || 'landscape').toLowerCase(); return wo === 'all' || wo === o; });
                  const scores = await Promise.all(cands.map((w) => {
                      const url = this.watermarkUrlFor(w.id || w.filename);
                      return url ? legibility(file, url).catch(() => -1) : -1;
                  }));
                  let best = -1;
                  scores.forEach((s, k) => { if (s > best) { best = s; pick = cands[k]; } });
              }
              if (pick && !this.touched[i] && this.files[i] === file) {
                  this.selections[i] = pick.id || pick.filename;
                  this.autoPicked[i] = true;
                  m.redraw();
              }
          } catch (e) {}
      }));
      this.autoBusy = false;
      // Şablonlar fotoğraf başına farklı seçildiyse anahtar kapanır; hepsi aynıysa açık kalır
      if (this.files.length > 1) {
          const first = this.selections[0];
          this.applyAll = !!first && this.selections.every((x) => x === first);
      }
      m.redraw();
  }

  /** Sıralama: fotoğrafı ve ona bağlı imza, ad, durum bilgilerini birlikte taşır (animasyonlu) */
  moveFile(from, to) {
      if (from === to || to < 0 || to >= this.files.length) return;
      const strip = document.querySelector('.WatermarkModal .WmPick-thumbs');
      const before = {};
      if (strip) strip.querySelectorAll('[data-key]').forEach((el) => (before[el.dataset.key] = el.getBoundingClientRect().left));
      const activeFile = this.files[this.activeIndex];
      [this.files, this.selections, this.customFileNames, this.touched, this.autoPicked].forEach((arr) => {
          const [x] = arr.splice(from, 1);
          arr.splice(to, 0, x);
      });
      this.activeIndex = Math.max(0, this.files.indexOf(activeFile));
      m.redraw.sync();
      if (strip) {
          strip.querySelectorAll('[data-key]').forEach((el) => {
              const dx = (before[el.dataset.key] || 0) - el.getBoundingClientRect().left;
              if (!dx) return;
              el.style.transition = 'none';
              el.style.transform = `translateX(${dx}px)`;
              requestAnimationFrame(() => { el.style.transition = ''; el.style.transform = ''; });
          });
      }
  }

  /** Son seçilen imza (bu tarayıcıda hatırlanır); artık yoksa imzasız */
  defaultSelection() {
      // Yeni fotoğraflar her zaman imzasız başlar; kullanıcı kendisi seçer
      return 'none';
  }
  
  applyToAll(id) { 
      this.selections.fill(id);
      m.redraw();
  }

  confirmUpload() {
    this.isConfirmed = true;
    if (this.onconfirm) this.onconfirm({
        // Bu pencerede sıralanan / eklenen fotoğraflar yükleme sırasını belirler
        files: this.files,
        selections: this.selections,
        // Künye önizlemesi imzayı aynı adresten gösterir (imza listesindeki gerçek adres)
        watermarkUrls: this.selections.map((id) => this.watermarkUrlFor(id)),
        customFileNames: this.customFileNames, 
        targetUsername: this.postAsUser ? this.postAsUser.username() : '',
        postAs: this.postAsUser ? { id: this.postAsUser.id(), username: this.postAsUser.username(), displayName: this.postAsUser.displayName() } : null
    });
    app.modal.close();
  }
}
