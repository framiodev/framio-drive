import Component from 'flarum/common/Component';
import Icon from 'flarum/common/components/Icon';
import app from 'flarum/forum/app';
import Tooltip from 'flarum/common/components/Tooltip';
import WatermarkModal from './WatermarkModal';
import AttributeModal, { prefetchAi } from './AttributeModal';
import InfoModal from './InfoModal';

export default class UploadButton extends Component {
  oninit(vnode) {
    super.oninit(vnode);
    this.loading = false;
    this.progressPercent = 0;
    this.fileProgresses = [];
    this.isHoveringCancel = false;
    this.session = null;
  }

  view() {
    if (this.loading) {
      const gradient = `linear-gradient(to right, #d4edda ${this.progressPercent}%, #f0f0f0 ${this.progressPercent}%)`;
      
      return (
        <button 
          className="Button spotter-upload-button hasIcon" 
          type="button" 
          style={{ 
            background: this.isHoveringCancel ? '#f8d7da' : gradient, 
            color: this.isHoveringCancel ? '#721c24' : '#555', 
            border: '1px solid #ddd', 
            transition: 'none',
            minWidth: '130px'
          }}
          onmouseenter={() => this.isHoveringCancel = true}
          onmouseleave={() => this.isHoveringCancel = false}
          onclick={(e) => {
             e.preventDefault();
             e.stopPropagation();
             if (this.session) this.cancelUploads(this.session, false);
          }}
        >
            {this.isHoveringCancel ? <Icon name="fas fa-times" /> : <Icon name="fas fa-spinner fa-spin" />}
            <span className="Button-label">
                {this.isHoveringCancel ? ' İptal Et' : (this.progressPercent === 100 ? ' İşleniyor...' : ` Yükleniyor... %${this.progressPercent}`)}
            </span>
        </button>
      );
    }

    const buttonClasses = ['Button', 'spotter-upload-button', 'hasIcon', 'Button--link', 'Button--icon'].join(' ');
    return (
      <Tooltip text="Fotoğraf Yükle"> 
        <button className={buttonClasses} type="button" onclick={() => !this.loading && this.element.querySelector('input').click()}>
            <Icon name="fas fa-camera" />
            <span className="Button-label">Fotoğraf Yükle</span>
            <input type="file" multiple accept="image/*" style="display:none" onchange={this.process.bind(this)} />
        </button>
      </Tooltip>
    );
  }

  prefetchTaxonomy() {
    let discussionId = null;
    if (app.current && typeof app.current.get === 'function') {
        const discussion = app.current.get('discussion');
        if (discussion) discussionId = discussion.id();
    }
    if (!discussionId) {
        const match = window.location.pathname.match(/\/d\/(\d+)/);
        if (match) discussionId = match[1];
    }
    
    const key = discussionId ? String(discussionId) : 'global';
    window.__framioTaxonomyCache = window.__framioTaxonomyCache || {};
    
    if (!window.__framioTaxonomyCache[key]) {
        const params = discussionId ? { discussion_id: discussionId } : {};
        app.request({
            method: 'GET',
            url: app.forum.attribute('apiUrl') + '/framio-media/taxonomy',
            params
        }).then(res => {
            window.__framioTaxonomyCache[key] = res.data || [];
        }).catch(() => {});
    }
  }

  process(e) {
    const fileList = Array.from(e.target.files);
    if (fileList.length === 0) return;
    fileList.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    
    this.prefetchTaxonomy();
    // Framio AI künyeyi kullanıcı imza seçerken okumaya başlar (ilk fotoğraf)
    prefetchAi(fileList[0]);

    app.modal.show(WatermarkModal, {
        files: fileList,
        onconfirm: (result) => this.startUpload(result.files || fileList, result)
    });
    e.target.value = '';
  }

  startUpload(fileList, result) {
    // "Üye adına paylaş": düzenleyici o üye adına gönderir (konu veya yanıt)
    if (result && result.postAs && app.composer && app.composer.body && app.composer.body.attrs) {
        app.composer.body.attrs.framioPostAs = result.postAs;
    }

    this.loading = true;
    this.progressPercent = 0;
    this.fileProgresses = new Array(fileList.length).fill(0);
    this.isHoveringCancel = false;
    m.redraw();
    
    const session = {
        abortController: new AbortController(),
        completedUploads: [],
        fileList: fileList,
        result: result,
        isCancelled: false
    };
    
    this.session = session;

    const uploadPromise = this.performBackgroundUpload(fileList, result, session);
    
    this.openAttributeModal(uploadPromise, null, session);
  }

  // --- NAVİGASYON FONKSİYONLARI (Modallar arası geçiş) ---

  openAttributeModal(uploadPromise, initialData, session) {
      app.modal.show(AttributeModal, {
        initialValues: initialData,
        files: session.fileList,
        session: session,
        oncancel: () => {
            this.cancelUploads(session, false);
        },
        ongoback: () => {
            this.cancelUploads(session, true);
        },
        onsubmit: (attributeText, customData) => {
            if(!session.isCancelled) {
                this.attachCustomDataToSession(session, customData);
                this.finishProcess(uploadPromise, attributeText, null);
            }
        },
        onskip: (customData) => {
            if(!session.isCancelled) {
                this.attachCustomDataToSession(session, customData);
                this.finishProcess(uploadPromise, null, null);
            }
        },
        onInfo: (attributeText, rawData) => {
            if(!session.isCancelled) this.openInfoModal(uploadPromise, attributeText, rawData, session);
        }
    });
  }

  attachCustomDataToSession(session, customData) {
      if (!session || !customData) return;
      session.customMusic = customData.music || null;
      session.customGps = customData.gps || null;
      session.customPerPhoto = customData.perPhoto || null;
  }

  openInfoModal(uploadPromise, attributeText, rawData, session) {
      app.modal.show(InfoModal, {
          files: session.fileList,
          initial: session.infoEntries || null,
          onsubmit: (infoText) => {
              if(!session.isCancelled) {
                  this.attachCustomDataToSession(session, { music: rawData?.customMusic, gps: rawData?.customGps, perPhoto: rawData?.customPerPhoto });
                  this.finishProcess(uploadPromise, attributeText, infoText);
              }
          },
          onback: (entries) => {
              // Künye ekranına dönüp tekrar gelince yazılan Info'lar kaybolmasın
              session.infoEntries = entries || null;
              this.openAttributeModal(uploadPromise, rawData, session);
          }
      });
  }

  cancelUploads(session, goBack) {
      session.isCancelled = true;
      session.abortController.abort();
      this.loading = false;
      m.redraw();
      
      app.alerts.show({ type: 'info' }, 'Yükleme işlemi iptal ediliyor, lütfen bekleyin...');

      const deletePromises = session.completedUploads.map(bbcode => {
          const match = bbcode.match(/id=(\d+)/);
          if (match && match[1]) {
              return app.request({
                  method: 'DELETE',
                  url: app.forum.attribute('apiUrl') + '/framio-media/image/' + match[1]
              }).catch(e => console.warn('Silme hatası:', e));
          }
          return Promise.resolve();
      });

      Promise.all(deletePromises).then(() => {
          app.alerts.show({ type: 'success' }, 'İşlem iptal edildi.');
          if (goBack) {
              app.modal.show(WatermarkModal, {
                  files: session.fileList,
                  onconfirm: (res) => this.startUpload(res.files || session.fileList, res)
              });
          }
      });
  }

  // --- SONUÇLANDIRMA VE EDİTÖRE BASMA ---

  finishProcess(uploadPromise, attributeText, infoText) {
      // Künye metninden görsel alt metni: ilk iki satır ("Firma | Plaka - Marka Model")
      const altFromKunye = (text) => {
          const parts = [...String(text || '').matchAll(/\*\*(.*?)\*\*/g)].map(m => m[1].trim());
          return parts.slice(0, 2).join(' - ');
      };
      const withAlt = (code, text) => {
          const alt = altFromKunye(text);
          return alt ? code.replace(/alt="([^"]*)"/g, `alt="${alt.replace(/"/g, '&quot;')}"`) : code;
      };

      uploadPromise.then(validCodes => {
          // Künye ekranında fotoğraflar yeniden sıralandıysa: yüklemeler ilk sıraya göre tamamlandı,
          // gönderide kullanıcının belirlediği sıra uygulanır (künye / Info / müzik dizileri zaten yeni sırada)
          const s = this.session;
          if (s && Array.isArray(s.order) && Array.isArray(s.codesByIndex) && !s._orderApplied) {
              const original = s.codesByIndex;
              s.codesByIndex = s.order.map(o => original[o] || null);
              s._orderApplied = true;
              validCodes = s.codesByIndex.filter(Boolean);
          }

          if (validCodes.length > 0) {
              let textToInsert;

              // Info: dizi (yeni: gönderi geneli + fotoğrafa özel) ya da eski düz metin
              const infos = Array.isArray(infoText) ? infoText : (infoText && infoText.trim() ? [{ scope: 'all', photos: [], formatted: infoText }] : []);
              const photoInfos = infos.filter(x => x.scope === 'photos' && x.photos && x.photos.length);
              const lastPhotoOf = (x) => Math.max(...x.photos);
              infoText = infos.filter(x => x.scope !== 'photos').map(x => x.formatted).join('\n>\n');

              if (Array.isArray(attributeText)) {
                  // BİRDEN ÇOK AÇIKLAMA: her görselin hemen altında kendi künyesi;
                  // fotoğrafa özel Info, seçilen fotoğraflardan sonuncusunun ardından
                  const byIndex = (this.session && this.session.codesByIndex) || validCodes;
                  const blocks = [];
                  byIndex.forEach((code, i) => {
                      if (!code) return;
                      const kunye = attributeText[i];
                      let block = withAlt(code, kunye) + (kunye ? '\n' + kunye : '');
                      photoInfos.filter(x => lastPhotoOf(x) === i).forEach(x => { block += '\n\n' + x.formatted; });
                      blocks.push(block);
                  });
                  validCodes = byIndex.filter(Boolean);
                  textToInsert = blocks.join('\n\n');
              } else {
                  // TEK AÇIKLAMA: tüm görseller, ardından ortak künye
                  if (attributeText) validCodes = validCodes.map(code => withAlt(code, attributeText));
                  textToInsert = validCodes.join('\n');
                  if (attributeText) textToInsert += '\n' + attributeText;
                  // Fotoğrafa özel Info'lar künyenin ardından, fotoğraf numarasıyla
                  photoInfos.forEach(x => { textToInsert += '\n\n' + x.formatted; });
              }

              // 2. Gönderi geneli Info (eski biçim: Meraklısına Info + T R I V I A)
              if (infoText && infoText.trim() !== '') {
                  // Önce Başlık: > **Meraklısına Info**
                  // Sonra bir boş satır (yine > ile başlayan)
                  textToInsert += '\n\n> **Meraklısına Info**\n>\n';

                  // İçeriği satırlara böl
                  const lines = infoText.split('\n');
                  
                  // Her satırın başına > işareti ve bir boşluk ekle
                  const quotedLines = lines.map(line => `> ${line}`);
                  
                  // Satırları birleştir ve ana metne ekle
                  textToInsert += quotedLines.join('\n') + '\n';
              } else {
                  // Info yoksa sadece alt satıra geç
                  textToInsert += '\n';
              }

              // Editöre yapıştır
              if (this.attrs.editor && typeof this.attrs.editor.insertAtCursor === 'function') {
                  this.attrs.editor.insertAtCursor(textToInsert);
              } else if (app.composer && app.composer.editor) {
                  app.composer.editor.insertAtCursor(textToInsert);
              }

              // Ağa aktarma: gönderi yayımlanınca crosspostOnPublish (index.js) uygular
              const cp = this.session && this.session.crosspost;
              if (cp && cp.mode === 'payload' && cp.payload) {
                  window.__framioCrosspostIntent = {
                      mode: 'payload',
                      payload: cp.payload,
                      imageIds: validCodes.map(c => (c.match(/id="?(\d+)/) || [])[1]).filter(Boolean),
                      // Yükleme sırasına göre görsel kimlikleri (seçilmeyen görsellerin eşlenmesi için)
                      imageIdsByIndex: ((this.session && this.session.codesByIndex) || validCodes).map(c => (c && (c.match(/id="?(\d+)/) || [])[1]) || null),
                      at: Date.now(),
                  };
              }

              // Eğer müzik veya GPS özelleştirmesi varsa, yüklenen görsellerin custom-data verisini güncelle
              // Fotoğrafa özel müzik/konum (Birden Çok) varsa her görsel kendi değerini alır
              const perPhoto = this.session && this.session.customPerPhoto;
              const customTargets = perPhoto
                  ? (this.session.codesByIndex || validCodes).map((code, i) => ({ code, ...(perPhoto[i] || {}) })).filter(t => t.code && (t.music || t.gps))
                  : (this.session && (this.session.customMusic || this.session.customGps) ? validCodes.map(code => ({ code, music: this.session.customMusic, gps: this.session.customGps })) : []);
              if (customTargets.length) {
                  
                  customTargets.forEach(({ code, music: customMusic, gps: customGps }) => {
                      const idMatch = code.match(/id=(\d+)/);
                      if (idMatch && idMatch[1]) {
                          const imageId = idMatch[1];
                          let apiUrl = app.forum.attribute('apiUrl');
                          if (window.location.protocol === 'https:' && apiUrl.startsWith('http:')) apiUrl = apiUrl.replace(/^http:/, 'https:');

                          app.request({
                              method: 'PATCH',
                              url: apiUrl + '/framio-media/image/' + imageId + '/custom-data',
                              body: {
                                  custom_music: customMusic,
                                  custom_gps: customGps
                              }
                          }).catch(err => {
                              console.warn('Görsel #' + imageId + ' özelleştirme verisi kaydedilemedi:', err);
                          });
                      }
                  });
              }
          } else { 
              app.alerts.show({ type: 'error' }, 'Yükleme başarısız oldu.'); 
          }
      }).catch(err => { 
          console.error(err); 
          app.alerts.show({ type: 'error' }, 'Bir hata oluştu.'); 
      }).finally(() => { 
          this.loading = false; 
          m.redraw(); 
      });
  }

  // --- ARKA PLAN YÜKLEME İŞLEMLERİ ---

  performBackgroundUpload(fileList, result, session) {
    const selections = result.selections || [];
    const targetUsername = result.targetUsername || '';
    const targetWatermarkType = result.targetWatermarkType || '';
    const customFileNames = result.customFileNames || [];

    // Paylaşımlı sunucu aynı anda çok sayıda ağır yüklemeyi (filigran + bulut) reddedebiliyor:
    // en fazla 2 fotoğraf aynı anda gider, başarısız olan 2 kez daha denenir.
    const CONCURRENCY = 2;
    const results = new Array(fileList.length).fill(null);
    const uploadOne = (index, attempt = 0) => {
        const file = fileList[index];
        let watermarkType = selections[index] || 'none';
        if (watermarkType === 'admin_override') watermarkType = 'none';
        const customName = customFileNames[index] || '';

        return this.uploadFile(file, watermarkType, targetUsername, targetWatermarkType, customName, session, index)
            .then(bbcode => {
                if (!bbcode && !session.isCancelled && attempt < 2) {
                    this.fileProgresses[index] = 0;
                    return new Promise(r => setTimeout(r, 1500 * (attempt + 1))).then(() => uploadOne(index, attempt + 1));
                }
                if (bbcode && !session.isCancelled) {
                    session.completedUploads.push(bbcode);
                }
                return bbcode;
            })
            .catch(err => {
                if (err.message === 'AbortError') console.log('Yükleme iptal edildi:', file.name);
                return null;
            });
    };

    let next = 0;
    const worker = () => {
        if (session.isCancelled || next >= fileList.length) return Promise.resolve();
        const index = next++;
        return uploadOne(index).then(code => {
            results[index] = code;
            return worker();
        });
    };
    const workers = Array.from({ length: Math.min(CONCURRENCY, fileList.length) }, worker);

    return Promise.all(workers).then(() => {
        // Fotoğraf sırasıyla (başarısızlar null): çoklu açıklamada künye ↔ görsel eşlemesi kaymasın
        session.codesByIndex = results;
        const failed = results.filter(code => code === null).length;
        if (failed && !session.isCancelled) {
            app.alerts.show({ type: 'error' }, `${failed} fotoğraf yüklenemedi (sunucu yanıt vermedi). Lütfen bu fotoğrafları tekrar yükleyin.`);
        }
        return results.filter(code => code !== null);
    });
  }

  uploadFile(file, watermarkType, targetUsername, targetWatermarkType, customName, session, index) {
    return new Promise((resolve, reject) => {
        const data = new FormData();
        data.append('spotter_image', file);
        data.append('watermark_type', watermarkType);
        
        if (customName) data.append('custom_filename', customName);
        if (targetUsername) {
            data.append('target_username', targetUsername);
            if (targetWatermarkType) data.append('target_watermark_type', targetWatermarkType);
        }

        let apiUrl = app.forum.attribute('apiUrl');
        if (window.location.protocol === 'https:' && apiUrl.startsWith('http:')) apiUrl = apiUrl.replace(/^http:/, 'https:');

        const xhr = new XMLHttpRequest();
        xhr.open('POST', apiUrl + '/framio-media/upload');
        xhr.setRequestHeader('X-CSRF-Token', app.session.csrfToken);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                this.fileProgresses[index] = percent;
                
                // Calculate total progress across all files
                const totalPercent = Math.round(this.fileProgresses.reduce((a,b)=>a+b, 0) / this.fileProgresses.length);
                this.progressPercent = totalPercent;
                m.redraw();
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response.bbcode);
                } catch(err) {
                    console.warn('Yanıt ayrıştırma hatası:', err);
                    resolve(null);
                }
            } else {
                console.warn('Sunucu hatası:', xhr.status);
                resolve(null);
            }
        };

        xhr.onerror = () => {
            console.warn('XHR Hatası');
            resolve(null);
        };
        
        // Handle abort
        const abortHandler = () => {
            xhr.abort();
            reject(new Error('AbortError'));
        };
        
        session.abortController.signal.addEventListener('abort', abortHandler);

        xhr.onloadend = () => {
            session.abortController.signal.removeEventListener('abort', abortHandler);
        };

        xhr.send(data);
    });
  }
}
