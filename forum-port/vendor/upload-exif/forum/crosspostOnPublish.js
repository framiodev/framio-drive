import app from 'flarum/forum/app';
import Model from 'flarum/common/Model';

/**
 * Yükleme sırasında "Ortak Paylaş" penceresinde yapılan seçimi (hedef site,
 * eşleşen/seçilen tartışma, imza) gönderi yayımlandığı anda uygular
 * (Framio Network Crosspost eklentisi gerekir).
 * Seçim yalnızca yüklenen görsellerden birini içeren yeni mesaja/konuya ve
 * 2 saat içinde uygulanır.
 */
export default function crosspostOnPublish() {
  const original = Model.prototype.save;

  Model.prototype.save = function (...args) {
    const isNew = !this.exists;
    return original.apply(this, args).then((record) => {
      try {
        const type = record && record.data && record.data.type;
        if (isNew && (type === 'posts' || type === 'discussions')) {
          window.dispatchEvent(new CustomEvent('framio:posted', { detail: { type, id: record.id() } }));
          apply(record, type);
        }
      } catch (e) {
        // Aktarım hatası gönderiyi etkilemesin
      }
      return record;
    });
  };
}

function apply(record, type) {
  const intent = window.__framioCrosspostIntent;
  if (!intent || intent.mode !== 'payload' || !intent.payload || Date.now() - intent.at > 2 * 60 * 60 * 1000) return;

  // Mesajda yüklenen görsellerden biri var mı (konu açılışında ilk mesaj içeriği gelmeyebilir)
  const html = type === 'posts' ? (record.contentHtml && record.contentHtml()) || '' : '';
  if (type === 'posts' && intent.imageIds.length && !intent.imageIds.some((id) => html.includes(`data-id="${id}"`) || html.includes(`id=${id}`))) {
    return;
  }
  window.__framioCrosspostIntent = null;

  const target = type === 'posts' ? { post_id: record.id() } : { discussion_id: record.id() };

  // Pencerede çıkarılan görseller yükleme sırasıyla geldi; artık kimlikleri belli
  const payload = { ...intent.payload };
  if (payload.excluded_image_indexes) {
    const byIndex = intent.imageIdsByIndex || [];
    payload.excluded_image_ids = payload.excluded_image_indexes.map((i) => byIndex[i]).filter(Boolean).map(Number);
    delete payload.excluded_image_indexes;
  }

  app
    .request({
      method: 'POST',
      url: app.forum.attribute('apiUrl') + '/framio/crosspost/outbound',
      body: { ...payload, ...target },
    })
    .then((res) => {
      const results = (res && res.results) || [];
      const failed = results.filter((r) => !r.success);
      if (failed.length) {
        app.alerts.show({ type: 'error' }, 'Ortak paylaşım kısmen başarısız: ' + failed.map((r) => `${r.node}: ${r.error || 'hata'}`).join(' · '));
      } else {
        app.alerts.show({ type: 'success' }, 'Gönderi ortak paylaşımla diğer sitelere de aktarıldı.');
      }
    })
    .catch(() => app.alerts.show({ type: 'error' }, 'Gönderi yayımlandı ama diğer sitelere aktarılamadı. Mesaj menüsündeki "Mesajı Ağa Aktar" ile tekrar deneyebilirsiniz.'));
}
