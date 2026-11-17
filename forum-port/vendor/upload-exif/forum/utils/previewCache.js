/**
 * Yükleme modalları (imza / künye) için hızlı önizleme.
 *
 * Ölçüm (24 MP JPEG): <img> + decoding="async" tam dosyayı ~60 ms'de, ana iş parçacığını kilitlemeden açar;
 * buna karşılık canvas → JPEG dönüştürme ~1 sn sürer. Bu yüzden:
 *  - Ana önizleme: dosyanın kendi adresi (dosya başına bir kez oluşturulur, iki modal paylaşır).
 *  - Küçük resimler: tarayıcıda arka planda küçültülen bitmap doğrudan <canvas>'a çizilir (dönüştürme yok).
 */
const urls = new WeakMap(); // File -> blob URL
const thumbs = new WeakMap(); // File -> Promise<ImageBitmap|null>
const dims = new WeakMap(); // File -> Promise<{width, height}>

/** Dosyanın paylaşılan önizleme adresi (senkron) */
export function fileUrl(file) {
    if (!file) return null;
    let u = urls.get(file);
    if (!u) urls.set(file, (u = URL.createObjectURL(file)));
    return u;
}

/** Özgün piksel boyutu; görsel arka planda çözülür, ana iş parçacığı beklemez */
export function fileDims(file) {
    if (!file) return Promise.resolve({ width: 0, height: 0 });
    let p = dims.get(file);
    if (!p) {
        p = new Promise((resolve) => {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => resolve({ width: 0, height: 0 });
            img.src = fileUrl(file);
        });
        dims.set(file, p);
    }

    return p;
}

/** Sıradaki fotoğrafı önceden çöz (geçişte bekleme olmasın) */
export function warm(file) {
    if (file) fileDims(file);
}

function thumbBitmap(file, size) {
    let p = thumbs.get(file);
    if (!p) {
        p = (typeof createImageBitmap === 'function'
            ? createImageBitmap(file, { resizeWidth: size, resizeQuality: 'low', imageOrientation: 'from-image' })
            : Promise.reject()
        ).catch(() => null);
        thumbs.set(file, p);
    }

    return p;
}

/**
 * Küçük resmi verilen <canvas>'a "cover" olarak çizer. Mithril oncreate/onupdate içinde çağrılır;
 * aynı dosya zaten çizildiyse tekrar çizmez.
 */
export function drawThumb(canvas, file, size = 240) {
    if (!canvas || !file || canvas._file === file) return;
    canvas._file = file;
    thumbBitmap(file, size).then((bm) => {
        if (canvas._file !== file) return;
        const ctx = canvas.getContext('2d');
        const w = (canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1) || size);
        const h = (canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1) || Math.round(size * 0.75));
        if (!bm) {
            // Bitmap üretilemezse (eski tarayıcı) tam görsel küçültülerek çizilir
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => cover(ctx, img, img.naturalWidth, img.naturalHeight, w, h);
            img.src = fileUrl(file);
            return;
        }
        cover(ctx, bm, bm.width, bm.height, w, h);
    });
}

const previews = new WeakMap(); // File -> Promise<ImageBitmap|null> (ekran boyutu)

/**
 * Ana önizlemeyi ekran boyutunda (uzun kenar 1600 px) bir bitmap'ten <canvas>'a çizer.
 * Tam çözünürlüklü <img> her yeniden boyamada 24 MP'yi küçültmek zorunda kalır (yazarken takılma);
 * canvas'taki küçük bitmap ise maliyetsiz boyanır. Hazır olana kadar küçük resim büyütülerek gösterilir.
 */
export function drawPreview(canvas, file, maxW = 1600) {
    if (!canvas || !file || canvas._file === file) return;
    canvas._file = file;

    let p = previews.get(file);
    if (!p) {
        p = fileDims(file).then(({ width, height }) => {
            if (typeof createImageBitmap !== 'function' || !width) return null;
            const scale = Math.min(1, maxW / Math.max(width, height));
            return createImageBitmap(file, { resizeWidth: Math.round(width * scale), resizeHeight: Math.round(height * scale), resizeQuality: 'high', imageOrientation: 'from-image' }).catch(() => null);
        });
        previews.set(file, p);
    }

    const paint = (src, w, h) => {
        if (canvas._file !== file) return;
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(src, 0, 0, w, h);
        canvas.classList.add('is-ready');
    };

    // Önce küçük resim (çoğunlukla zaten hazır), ardından keskin önizleme
    thumbBitmap(file, 240).then((bm) => { if (bm && !canvas.classList.contains('is-sharp')) paint(bm, bm.width, bm.height); });
    p.then((bm) => {
        if (bm) {
            paint(bm, bm.width, bm.height);
            canvas.classList.add('is-sharp');
            return;
        }
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => { paint(img, img.naturalWidth, img.naturalHeight); canvas.classList.add('is-sharp'); };
        img.src = fileUrl(file);
    });
}

function cover(ctx, src, sw, sh, w, h) {
    const scale = Math.max(w / sw, h / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    ctx.drawImage(src, (w - dw) / 2, (h - dh) / 2, dw, dh);
}
