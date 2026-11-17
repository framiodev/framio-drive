import Modal from "flarum/common/components/Modal";
import Button from "flarum/common/components/Button";
import app from "flarum/forum/app";

export default class CustomizePostModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);

    this.activeTab = "music"; // "music" | "location"

    // Mevcut veya seçili veriler
    this.selectedMusic = this.attrs.music ? { ...this.attrs.music } : null;
    this.selectedGps = this.attrs.gps ? { ...this.attrs.gps } : null;

    // Şarkı kesit ayarları (Instagram tarzı: Başlangıç ve Bitiş sn)
    this.audioDuration = 30; // varsayılan önizleme süresi
    this.startOffset = (this.selectedMusic && this.selectedMusic.start_offset) ? Number(this.selectedMusic.start_offset) : 0;
    this.clipDuration = (this.selectedMusic && this.selectedMusic.clip_duration) ? Number(this.selectedMusic.clip_duration) : 15;

    // Müzik Arama Durumu
    this.searchQuery = "";
    this.searchResults = [];
    this.isSearching = false;
    this.searchTimeout = null;

    // Ses Önizleme (Audio)
    this.previewAudio = null;
    this.playingTrackId = null;
    this.previewCurrentTime = 0;
    this.previewTimer = null;

    // Harita Durumu
    this.mapInstance = null;
    this.mapMarker = null;
    this.mapSearchQuery = "";
    this.isGeocoding = false;
    this.mapElement = null;

    // Başlangıç koordinatları
    this.currentLat = this.selectedGps ? Number(this.selectedGps.lat) : (this.attrs.initialGps?.lat ? Number(this.attrs.initialGps.lat) : 39.9208);
    this.currentLon = this.selectedGps ? Number(this.selectedGps.lon) : (this.attrs.initialGps?.lon ? Number(this.attrs.initialGps.lon) : 32.8541);
    this.hasPinnedLocation = Boolean(this.selectedGps || (this.attrs.initialGps && this.attrs.initialGps.lat));

    this.loadDefaultMusic();
  }

  className() {
    return "CustomizePostModal Modal--medium";
  }

  title() {
    return (
      <span className="CustomizePostModal-titleWrapper">
        {this.attrs.onback && (
          <button
            type="button"
            className="Button Button--icon Button--link CustomizePostModal-backBtn"
            onclick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              this.handleBack();
            }}
            title="Künye Ekranına Geri Dön"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
        )}
        <span>Gönderiyi Özelleştir (Müzik & Konum)</span>
      </span>
    );
  }

  handleBack() {
    this.stopPreview();
    if (this.attrs.onback) {
      this.attrs.onback();
    } else {
      app.modal.close();
    }
  }

  hide() {
    this.stopPreview();
    if (this.attrs.onback) {
      this.attrs.onback();
    } else {
      app.modal.close();
    }
  }

  loadDefaultMusic() {
    this.isSearching = true;
    app.request({
      method: "GET",
      url: app.forum.attribute("apiUrl") + "/framio-media/music/search",
      params: { q: "Türkiye En Çok Dinlenenler" },
    }).then((res) => {
      this.searchResults = res.data || [];
    }).catch(() => {
      this.searchResults = [];
    }).finally(() => {
      this.isSearching = false;
      m.redraw();
    });
  }

  onMusicSearchInput(val) {
    this.searchQuery = val;
    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    if (!val || val.trim().length < 2) {
      this.loadDefaultMusic();
      return;
    }

    this.isSearching = true;
    this.searchTimeout = setTimeout(() => {
      app.request({
        method: "GET",
        url: app.forum.attribute("apiUrl") + "/framio-media/music/search",
        params: { q: val.trim() },
      }).then((res) => {
        this.searchResults = res.data || [];
      }).catch(() => {
        this.searchResults = [];
      }).finally(() => {
        this.isSearching = false;
        m.redraw();
      });
    }, 350);
  }

  togglePreview(track, e, playFromOffset = false) {
    if (e) e.stopPropagation();

    if (this.playingTrackId === track.id && !playFromOffset) {
      this.stopPreview();
      return;
    }

    this.stopPreview();

    if (!track.preview_url) return;

    this.previewAudio = new Audio(track.preview_url);
    this.playingTrackId = track.id;
    this.previewAudio.volume = 0.85;

    const start = playFromOffset ? this.startOffset : 0;
    const duration = playFromOffset ? this.clipDuration : 30;

    this.previewAudio.addEventListener("loadedmetadata", () => {
      if (this.previewAudio.duration && !isNaN(this.previewAudio.duration)) {
        this.audioDuration = Math.floor(this.previewAudio.duration);
        m.redraw();
      }
    });

    this.previewAudio.currentTime = start;
    this.previewCurrentTime = start;

    this.previewAudio.ontimeupdate = () => {
      if (!this.previewAudio) return;
      this.previewCurrentTime = this.previewAudio.currentTime;
      if (playFromOffset && this.previewAudio.currentTime >= (start + duration)) {
        // Döngüsel veya durdur
        this.previewAudio.currentTime = start;
      }
      m.redraw();
    };

    this.previewAudio.onended = () => {
      this.stopPreview();
    };

    this.previewAudio.onerror = () => {
      this.stopPreview();
    };

    this.previewAudio.play().catch(() => {
      this.stopPreview();
    });

    m.redraw();
  }

  stopPreview() {
    if (this.previewAudio) {
      try {
        this.previewAudio.pause();
        this.previewAudio.currentTime = 0;
      } catch (err) {}
      this.previewAudio = null;
    }
    this.playingTrackId = null;
    this.previewCurrentTime = 0;
    m.redraw();
  }

  selectMusic(track) {
    this.selectedMusic = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      preview_url: track.preview_url,
      cover_url: track.cover_url,
      start_offset: 0,
      clip_duration: 15,
    };
    this.startOffset = 0;
    this.clipDuration = 15;
    this.audioDuration = 30;
    this.togglePreview(this.selectedMusic, null, true);
    m.redraw();
  }

  removeMusic() {
    this.selectedMusic = null;
    this.startOffset = 0;
    this.stopPreview();
    m.redraw();
  }

  updateStartOffset(val) {
    this.startOffset = Number(val);
    if (this.selectedMusic) {
      this.selectedMusic.start_offset = this.startOffset;
    }
    if (this.previewAudio && this.playingTrackId === this.selectedMusic.id) {
      this.previewAudio.currentTime = this.startOffset;
    } else if (this.selectedMusic) {
      this.togglePreview(this.selectedMusic, null, true);
    }
    m.redraw();
  }

  updateClipDuration(val) {
    this.clipDuration = Number(val);
    if (this.selectedMusic) {
      this.selectedMusic.clip_duration = this.clipDuration;
    }
    m.redraw();
  }

  // --- HARİTA YÖNETİMİ ---
  initLeafletMap(element) {
    if (!element) return;
    this.mapElement = element;

    if (!window.L) {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!document.getElementById("leaflet-js")) {
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => {
          this.setupLeafletIcons();
          this.mountMap(element);
        };
        document.head.appendChild(script);
      } else {
        const checkL = setInterval(() => {
          if (window.L) {
            clearInterval(checkL);
            this.setupLeafletIcons();
            this.mountMap(element);
          }
        }, 100);
      }
    } else {
      this.setupLeafletIcons();
      this.mountMap(element);
    }
  }

  setupLeafletIcons() {
    if (!window.L || window.L.__iconsSetupDone) return;
    delete window.L.Icon.Default.prototype._getIconUrl;
    window.L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
    window.L.__iconsSetupDone = true;
  }

  mountMap(element) {
    if (!element || !window.L) return;

    if (this.mapInstance) {
      try {
        this.mapInstance.remove();
      } catch (err) {}
      this.mapInstance = null;
    }

    const zoomLevel = this.hasPinnedLocation ? 14 : 6;
    this.mapInstance = window.L.map(element).setView([this.currentLat, this.currentLon], zoomLevel);

    window.L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(this.mapInstance);

    if (this.hasPinnedLocation) {
      this.mapMarker = window.L.marker([this.currentLat, this.currentLon], { draggable: true }).addTo(this.mapInstance);
      this.mapMarker.on("dragend", (e) => {
        const pos = e.target.getLatLng();
        this.setCoordinates(pos.lat, pos.lng);
      });
    }

    this.mapInstance.on("click", (e) => {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;
      this.setCoordinates(lat, lon);

      if (this.mapMarker) {
        this.mapMarker.setLatLng([lat, lon]);
      } else {
        this.mapMarker = window.L.marker([lat, lon], { draggable: true }).addTo(this.mapInstance);
        this.mapMarker.on("dragend", (dragEvent) => {
          const pos = dragEvent.target.getLatLng();
          this.setCoordinates(pos.lat, pos.lng);
        });
      }
    });

    setTimeout(() => {
      if (this.mapInstance) this.mapInstance.invalidateSize();
    }, 250);
  }

  setCoordinates(lat, lon) {
    this.currentLat = Number(lat.toFixed(6));
    this.currentLon = Number(lon.toFixed(6));
    this.selectedGps = { lat: this.currentLat, lon: this.currentLon };
    this.hasPinnedLocation = true;
    m.redraw();
  }

  searchLocationOnMap(e) {
    if (e) e.preventDefault();
    if (!this.mapSearchQuery || this.mapSearchQuery.trim().length < 2) return;

    this.isGeocoding = true;
    m.redraw();

    const q = encodeURIComponent(this.mapSearchQuery.trim());
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=tr&limit=1`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          this.setCoordinates(lat, lon);

          if (this.mapInstance) {
            this.mapInstance.setView([lat, lon], 14);
            if (this.mapMarker) {
              this.mapMarker.setLatLng([lat, lon]);
            } else if (window.L) {
              this.mapMarker = window.L.marker([lat, lon], { draggable: true }).addTo(this.mapInstance);
              this.mapMarker.on("dragend", (dragEvent) => {
                const pos = dragEvent.target.getLatLng();
                this.setCoordinates(pos.lat, pos.lng);
              });
            }
          }
        } else {
          app.alerts.show({ type: "error" }, "Konum bulunamadı. Lütfen haritadan elle tıklayarak pinleyin.");
        }
      })
      .catch(() => {
        app.alerts.show({ type: "error" }, "Konum arama servisine erişilemedi.");
      })
      .finally(() => {
        this.isGeocoding = false;
        m.redraw();
      });
  }

  removeGps() {
    this.selectedGps = null;
    this.hasPinnedLocation = false;
    if (this.mapMarker && this.mapInstance) {
      this.mapInstance.removeLayer(this.mapMarker);
      this.mapMarker = null;
    }
    m.redraw();
  }

  confirmSettings() {
    this.stopPreview();
    if (this.selectedMusic) {
      this.selectedMusic.start_offset = this.startOffset;
      this.selectedMusic.clip_duration = this.clipDuration;
    }
    if (this.attrs.onconfirm) {
      this.attrs.onconfirm({
        music: this.selectedMusic,
        gps: this.selectedGps,
      });
    }
    // Eğer onback yoksa (örneğin daha önceden paylaşılmış gönderiyi düzenleme durumu), modal kapatılır
    if (!this.attrs.onback) {
      app.modal.close();
    }
  }

  onremove(vnode) {
    this.stopPreview();
    if (this.mapInstance) {
      try {
        this.mapInstance.remove();
      } catch (e) {}
      this.mapInstance = null;
    }
    super.onremove(vnode);
  }

  content() {
    const maxOffset = Math.max(0, this.audioDuration - this.clipDuration);

    return (
      <div className="CustomizePostModal-body">
        {/* ÜST SEKME MENÜSÜ */}
        <div className="CustomizePostModal-tabs">
          <button
            type="button"
            className={`CustomizeTab-btn ${this.activeTab === "music" ? "active" : ""}`}
            onclick={() => {
              this.activeTab = "music";
            }}
          >
            <i className="fas fa-music"></i> Gönderi Müziği
            {this.selectedMusic && <span className="tab-badge">1</span>}
          </button>
          <button
            type="button"
            className={`CustomizeTab-btn ${this.activeTab === "location" ? "active" : ""}`}
            onclick={() => {
              this.activeTab = "location";
              setTimeout(() => {
                if (this.mapInstance) {
                  this.mapInstance.invalidateSize();
                } else if (this.mapElement) {
                  this.initLeafletMap(this.mapElement);
                }
              }, 150);
            }}
          >
            <i className="fas fa-map-marker-alt"></i> Çekim Konumu
            {this.selectedGps && <span className="tab-badge">1</span>}
          </button>
        </div>

        {/* 1. SEKME: MÜZİK */}
        <div
          className="CustomizeTab-content"
          style={{ display: this.activeTab === "music" ? "block" : "none" }}
        >
          {/* Seçili Müzik Varsa Üstte Göster & Instagram Tarzı Kesit / Dalga Çubuğu */}
          {this.selectedMusic ? (
            <div className="Customize-selected-music-wrapper">
              <div className="Customize-selected-music">
                <img src={this.selectedMusic.cover_url} alt="" className="c-music-cover" />
                <div className="c-music-info">
                  <div className="c-music-title">{this.selectedMusic.title}</div>
                  <div className="c-music-artist">{this.selectedMusic.artist}</div>
                </div>
                <div className="c-music-actions">
                  <button
                    type="button"
                    className="c-music-playbtn"
                    onclick={(e) => this.togglePreview(this.selectedMusic, e, true)}
                    title="Kesiti Dinle"
                  >
                    <i className={this.playingTrackId === this.selectedMusic.id ? "fas fa-pause" : "fas fa-play"}></i>
                  </button>
                  <button
                    type="button"
                    className="c-music-removebtn"
                    onclick={this.removeMusic.bind(this)}
                    title="Müziği Kaldır"
                  >
                    <i className="fas fa-times"></i> Kaldır
                  </button>
                </div>
              </div>

              {/* INSTAGRAM TARZI ŞARKI KESİTİ AYARI (Audio Trimmer) */}
              <div className="Customize-audio-trimmer">
                <div className="trimmer-header">
                  <span className="trimmer-title">
                    <i className="fas fa-sliders-h"></i> Şarkı Başlangıç ve Süre Ayarı (Instagram Tarzı)
                  </span>
                  <span className="trimmer-values">
                    {this.startOffset} sn - {this.startOffset + this.clipDuration} sn ({this.clipDuration} sn)
                  </span>
                </div>

                {/* Görsel Dalga ve İlerleme Çizgisi */}
                <div className="trimmer-visual-track">
                  <div className="trimmer-wave-bars">
                    {[40, 65, 85, 55, 95, 75, 45, 80, 100, 70, 50, 90, 85, 60, 75, 95, 65, 50, 80, 100, 70, 90, 60, 45].map((h, i) => (
                      <span
                        key={i}
                        className="trim-bar"
                        style={{
                          height: `${h}%`,
                          opacity: (i / 24) >= (this.startOffset / (this.audioDuration || 30)) && (i / 24) <= ((this.startOffset + this.clipDuration) / (this.audioDuration || 30)) ? 1 : 0.35,
                        }}
                      ></span>
                    ))}
                  </div>
                  <input
                    type="range"
                    className="trimmer-range"
                    min="0"
                    max={maxOffset}
                    step="1"
                    value={this.startOffset}
                    oninput={(e) => this.updateStartOffset(e.target.value)}
                  />
                </div>

                <div className="trimmer-options">
                  <label className="trimmer-duration-label">
                    <span>Süre:</span>
                    <select
                      className="trimmer-select"
                      value={this.clipDuration}
                      onchange={(e) => this.updateClipDuration(e.target.value)}
                    >
                      <option value="5">5 Saniye</option>
                      <option value="10">10 Saniye</option>
                      <option value="15">15 Saniye (Varsayılan)</option>
                      <option value="20">20 Saniye</option>
                      <option value="30">30 Saniye (Tam Önizleme)</option>
                    </select>
                  </label>
                  <span className="trimmer-hint">Kaydırıcıyı hareket ettirerek şarkının başlamasını istediğiniz yeri seçin.</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Arama Alanı */}
          <div className="Customize-search-box">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              className="FormControl Customize-input"
              placeholder="Instagram gibi: Şarkı veya sanatçı adı yazın..."
              value={this.searchQuery}
              oninput={(e) => this.onMusicSearchInput(e.target.value)}
            />
            {this.isSearching && <i className="fas fa-spinner fa-spin search-spinner"></i>}
          </div>

          {/* Arama Sonuçları */}
          <div className="Customize-music-list">
            {this.searchResults.length === 0 && !this.isSearching ? (
              <div className="Customize-empty-hint">
                <i className="fas fa-music"></i>
                <p>Şarkı veya sanatçı adı arayarak dilediğiniz müziği ekleyin.</p>
              </div>
            ) : (
              this.searchResults.map((track) => {
                const isPlaying = this.playingTrackId === track.id;
                const isSelected = this.selectedMusic && this.selectedMusic.id === track.id;

                return (
                  <div
                    className={`Customize-music-item ${isSelected ? "selected" : ""}`}
                    onclick={() => this.selectMusic(track)}
                  >
                    <div className="c-track-cover-wrap">
                      <img src={track.cover_url} alt="" className="c-track-cover" />
                      <button
                        type="button"
                        className="c-track-hover-play"
                        onclick={(e) => this.togglePreview(track, e)}
                      >
                        <i className={isPlaying ? "fas fa-pause" : "fas fa-play"}></i>
                      </button>
                    </div>

                    <div className="c-track-details">
                      <div className="c-track-title">{track.title}</div>
                      <div className="c-track-artist">{track.artist}</div>
                    </div>

                    <div className="c-track-right">
                      {isSelected ? (
                        <span className="c-track-selected-tag">
                          <i className="fas fa-check"></i> Seçildi
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="Button Button--link c-track-select-btn"
                          onclick={(e) => {
                            e.stopPropagation();
                            this.selectMusic(track);
                          }}
                        >
                          Seç
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2. SEKME: KONUM / HARİTA */}
        <div
          className="CustomizeTab-content"
          style={{ display: this.activeTab === "location" ? "block" : "none" }}
        >
          <div className="Customize-map-instructions">
            <i className="fas fa-info-circle"></i>
            <span>
              Fotoğrafın çekildiği yeri haritada arayın veya doğrudan haritaya tıklayarak pini bırakın.
              {this.hasPinnedLocation && (
                <strong style={{ marginLeft: "5px", color: "#27ae60" }}>
                  (Konum: {this.currentLat}, {this.currentLon})
                </strong>
              )}
            </span>
            {this.hasPinnedLocation && (
              <button
                type="button"
                className="Button Button--link"
                style={{ marginLeft: "auto", color: "#e74c3c" }}
                onclick={this.removeGps.bind(this)}
              >
                <i className="fas fa-trash"></i> Konumu Kaldır
              </button>
            )}
          </div>

          {/* Yer Arama */}
          <form className="Customize-map-search" onsubmit={this.searchLocationOnMap.bind(this)}>
            <input
              type="text"
              className="FormControl Customize-input"
              placeholder="Şehir, ilçe, otogar veya cadde adı arayın..."
              value={this.mapSearchQuery}
              oninput={(e) => (this.mapSearchQuery = e.target.value)}
            />
            <Button
              type="submit"
              className="Button Button--primary"
              loading={this.isGeocoding}
              disabled={!this.mapSearchQuery}
            >
              Haritada Bul
            </Button>
          </form>

          {/* Harita Konteyneri */}
          <div
            className="Customize-map-container"
            oncreate={(vnode) => this.initLeafletMap(vnode.dom)}
          ></div>
        </div>

        {/* ALT AKSİYON BUTONLARI */}
        <div className="CustomizePostModal-footer">
          <div className="footer-summary">
            {this.selectedMusic && (
              <span className="summary-tag music">
                <i className="fas fa-music"></i> {this.selectedMusic.title} ({this.startOffset}s-{this.startOffset + this.clipDuration}s)
              </span>
            )}
            {this.selectedGps && (
              <span className="summary-tag gps">
                <i className="fas fa-map-marker-alt"></i> Konum Belirlendi
              </span>
            )}
          </div>
          <div className="footer-buttons">
            <Button
              className="Button"
              onclick={() => this.handleBack()}
            >
              Vazgeç
            </Button>
            <Button className="Button Button--primary" onclick={this.confirmSettings.bind(this)}>
              <i className="fas fa-check" style={{ marginRight: "6px" }}></i> Tamamla ve Kaydet
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
