# Framio Drive → Forumda Paylaş (mimari)

Durum: tasarım. Kaynak: `forum-ulasimarsiv` ve `forum-spottersturkey` depoları (Flarum 2.0 rc, ortak `framio/upload-exif` eklentisi).

## 1. Bulgular (depolardan)
- İki forum da **Flarum 2** (MyBB değil). Yükleme, künye, BBCode ve yapay zekâ analizi `framio/upload-exif` eklentisinde; ikisinde de aynı API.
- Yükleme: `POST /api/framio-media/upload` (multipart, alan `image`; isteğe bağlı `watermark_type`, `custom_filename`, `custom_gps`, `custom_music`, yöneticiler için `target_username`). Giriş yapmış üye yeter (`assertRegistered`). Yanıt `bbcode` döndürür: `[framio-image id=.. url=".." alt=".."]` (etiket adı admin ayarı `active_bbcode_tag`; ulasimarsiv için `ulasimarsiv-image`, spotters için `spotter-image` olabilir).
- Künye: `[framio-kunye theme=..]...[/framio-kunye]` bloğu (madde listesi).
- Yardımcı uçlar: `GET /api/framio-media/taxonomy` (marka/model), `/city-routes`, `/category-schemas`, `/watermarks`, `POST /api/framio-media/analyze-ai`.
- Başlık/gönderi: standart Flarum API'si (`POST /api/discussions`, `POST /api/posts`, `GET /api/tags`, `GET /api/discussions?filter[q]=`).
- Kimlik: Flarum `POST /api/token` (kullanıcı adı + parola → kişisel erişim jetonu). `Authorization: Token <jeton>` ile API çağrıları CSRF'den muaf.

## 2. Sonuç: forumda değişiklik gerekmez (v1)
Uygulama, forumun bir tarayıcı kullanıcısı gibi **mevcut API'sini** çağırır. Böylece forumlara hiç girmeden, forumun kendi yükleme işlemi (WebP, filigran, EXIF, bulut depolama) aynen çalışır.
İleride isteğe bağlı: forumda `GET /api/framio/client/capabilities` (etiket adı, kategori/şema, limitler tek çağrıda).

## 3. Uygulama bileşenleri
```
Sağ tık "Framio ile forumda paylaş…"  ─┐ (Drive diski, yerel dosya, uygulama içi liste)
Dosyalar sekmesi "Forumda paylaş"      ─┼─► run_action("forum", yollar) ─► "Paylaş" sekmesi
                                         
Paylaş sekmesi:  forum seç → hedef (yeni başlık | mevcut başlığa yanıt)
                 → görseller (sıra, açıklama, filigran) → künye alanları (+ yapay zekâ doldur)
                 → önizleme (üretilecek BBCode) → Gönder (ilerleme + yeniden dene)
```
Rust (`app/src/forum.rs`, yeni):
- `forum_profiles_get/save`: forum listesi `{id, ad, base_url}` (`%APPDATA%\FramioDrive\forums.json`). İki forum hazır gelir.
- `forum_login(id, kullanici, parola)`: `/api/token` → jeton + userId. **Parola saklanmaz**; jeton Windows Kimlik Bilgisi Yöneticisi'nde (`keyring`, hizmet `framio-drive`, hesap `forum:<id>`). `forum_logout`, `forum_status`.
- `forum_meta(id)`: etiketler (`/api/tags`), künye şemaları, taksonomi, filigranlar, `active_bbcode_tag` → arayüz formu bunlardan kurulur.
- `forum_find_discussion(id, sorgu)`: yanıt vermek için başlık arama.
- `forum_publish(id, plan)`: her görsel için (Drive ise indir; büyükse sunucu limitine göre küçült) `upload` → `bbcode`; sonra gövdeyi birleştirip `POST /api/discussions` (yeni, `tags` ilişkisiyle) veya `POST /api/posts` (yanıt). İlerleme `forum-progress` olayıyla; her adım ayrı hata/yeniden deneme; kısmi başarıda yüklenen görseller tekrar yüklenmez.
- `forum_ai_fill`: önce forumun `analyze-ai` ucu (forumun kendi sağlayıcı ayarları, marka/model eşleştirmesiyle uyumlu); olmazsa kullanıcının Gemini anahtarı (mevcut `gemini.rs`, düzenleme profili mantığı).

Arayüz (`index.html`): "Paylaş" sekmesi, forum girişi paneli (Ayarlar), önizleme. Bağlam menüsü: görsel dosyalar için `FramioForum` fiili (`SystemFileAssociations\image\shell`), çoklu seçimde tek pencere.

## 4. Gönderi biçimi
Gövde = `[etiket id= url= alt=]` blokları + künye bloğu. Etiket adı ve künye biçimi forumdan okunur; sabit yazılmaz. Başlık önerisi: künye alanlarından şablon (ör. `{marka} {model} – {firma} – {plaka}`), kullanıcı düzeltir.

## 5. Güvenlik
- Yalnızca HTTPS ve profildeki alan adları; uygulama başka adrese jeton göndermez.
- Parola yalnızca girişte bellekte; sunucuya yalnızca forumun `/api/token` ucuna gider.
- Jeton ömrü sınırlı (`lifetime`), çıkışta silinir; forumda "Oturumlar"dan iptal edilebilir.
- Yönetici özellikleri (`target_username`) yalnızca yönetici hesabıyla açılır.
- Gönderi atmadan önce her zaman önizleme + onay.

## 6. Riskler / doğrulanacaklar
1. `/api/token` canlı sitede açık mı; **2 adımlı doğrulama / captcha / Cloudflare** isteği engeller mi (gerekirse tarayıcıda giriş penceresinden jeton alma yedeği).
2. Flood/hız sınırı ve yeni üye onay (`flarum/approval`) kuralları gönderiyi bekletebilir.
3. Sunucu yükleme boyut sınırı (PHP `upload_max_filesize`); büyük kamera dosyaları için önceden küçültme.
4. Her forumun künye şeması farklı olabilir (kategoriye göre `category-schemas`).
5. `custom_gps` ve EXIF: küçültme EXIF'i korumalı yapılmalı (forum EXIF'ten künye/konum üretiyor).

## 7. Aşamalar
1. Giriş + forum profilleri + `forum_meta` (canlı doğrulama).
2. Tek görsel → yeni başlık (etiket seç, künyesiz).
3. Çoklu görsel, künye formu, yanıt modu, ilerleme/yeniden deneme.
4. Yapay zekâ ile künye doldurma, filigran seçimi.
5. Sağ tık menüsü ve Drive/yerel kaynakları.
