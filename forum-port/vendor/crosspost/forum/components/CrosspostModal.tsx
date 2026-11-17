import Modal, { IInternalModalAttrs } from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import Icon from 'flarum/common/components/Icon';
import app from 'flarum/forum/app';
import type Discussion from 'flarum/common/models/Discussion';
import type Post from 'flarum/common/models/Post';
import type Mithril from 'mithril';

export interface CrosspostModalAttrs extends IInternalModalAttrs {
  discussion?: Discussion;
  post?: Post;
  /**
   * Ertelenmiş mod: içerik henüz yayımlanmadı (yükleme penceresinden açılır).
   * Seçimler gönderilmez, onconfirm ile geri verilir; gönderi yayımlanınca aktarılır.
   */
  deferred?: boolean;
  /** Ertelenmiş modda mesaj mevcut tartışmaya yanıt mı */
  isReply?: boolean;
  /** Ertelenmiş modda önizlenecek görseller */
  previewImages?: string[];
  /** Daha önce kaydedilmiş seçim (ertelenmiş mod) */
  initialPayload?: Record<string, any> | null;
  onconfirm?: (payload: Record<string, any> | null) => void;
}

export interface NetworkNode {
  id: string;
  name: string;
  url: string;
  default_tag_slug: string;
  /** Admin'de tanımlı tartışma eşleşmesi (kaynak tartışma → bu sitedeki tartışma) */
  mapped?: { url: string; title: string } | null;
}

export interface ExtractedImage {
  url: string;
  alt?: string;
  id?: number;
}

export interface TargetDiscussionItem {
  id: string;
  title: string;
  slug: string;
  comment_count: number;
  created_at?: string;
  last_posted_at?: string;
  url: string;
}

export interface TargetWatermarkItem {
  id: string;
  name: string;
  filename: string;
  folder?: string | null;
  type: 'portrait' | 'landscape' | 'other';
  url: string;
  label?: string;
  is_personal?: boolean;
  bg_color?: string | null;
  text_color?: string | null;
  border_color?: string | null;
}

export interface TargetUserItem {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
}

export interface TargetCategoryItem {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

export default class CrosspostModal extends Modal<CrosspostModalAttrs> {
  currentStep: 1 | 2 | 3 = 1;
  /** Eşleşen tartışma varsa sade onay ekranı */
  quickConfirm: boolean = false;
  loading: boolean = true;
  submitting: boolean = false;
  nodes: NetworkNode[] = [];
  selectedNodes: Record<string, boolean> = {};
  targetTags: Record<string, string> = {};
  targetDiscussionUrls: Record<string, string> = {};
  targetDiscussionObjects: Record<string, TargetDiscussionItem | null> = {};
  customTitle: string = '';
  customDescription: string = '';
  postMode: Record<string, 'reply' | 'new_discussion'> = {};
  results: Array<{ node: string; success: boolean; duplicate?: boolean; url?: string; message?: string; error?: string }> = [];

  // Hedef Kategori / Marka Durumu (Özellikle Portfolyo ve Etiketler için)
  nodeCategories: Record<string, TargetCategoryItem[]> = {};
  loadingCategories: Record<string, boolean> = {};
  detectedBrand: string = '';

  // Görsel ve Önizleme
  extractedImages: ExtractedImage[] = [];
  /** Aktarılmayacak görseller (URL bazlı) */
  excludedImageUrls: Record<string, boolean> = {};
  postExcerpt: string = '';

  moveImage(fromIdx: number, toIdx: number) {
    if (fromIdx < 0 || fromIdx >= this.extractedImages.length) return;
    if (toIdx < 0 || toIdx >= this.extractedImages.length) return;

    const item = this.extractedImages.splice(fromIdx, 1)[0];
    this.extractedImages.splice(toIdx, 0, item);
    m.redraw();
  }

  // Hedef Konu Arama Durumu
  searchQueries: Record<string, string> = {};
  searchResults: Record<string, TargetDiscussionItem[]> = {};
  searchingNodes: Record<string, boolean> = {};

  // İmza (Watermark) Durumu
  watermarkMode: 'keep_source' | 'target_site' | 'no_watermark' | 'custom' = 'keep_source';
  selectedWatermarkId: string | null = null;
  customWatermarkBase64: string | null = null;
  customWatermarkFileName: string = '';
  targetWatermarks: Record<string, TargetWatermarkItem[]> = {};
  loadingWatermarks: Record<string, boolean> = {};
  applyToAll: boolean = true;
  /** Görsel başına seçilen imza (görsel URL'i => imza id) */
  wmPerImage: Record<string, string> = {};
  /** Görsellerin yönü için boyutları (URL => {w,h}) */
  imageDims: Record<string, { w: number; h: number }> = {};
  /** İmza dosyalarının en/boy oranı (URL => h/w) */
  wmRatios: Record<string, number> = {};
  /** Hedef sitenin imza dağıtım modu (templates | personal | hybrid) */
  targetWmMode: Record<string, string> = {};
  /** Açık site imzası menüsü (görsel URL'i) */
  openWmMenu: string | null = null;
  /** Kaynaktaki imzasız orijinal adresleri (görsel URL'i => orijinal) */
  originalSrc: Record<string, string> = {};
  /** İmzasız orijinali bulutta olmayan görseller (yeni imza basılmaz) */
  originalMissing: Record<string, boolean> = {};
  /** Büyütülmüş önizleme */
  zoomPreview: { src: string; wm: TargetWatermarkItem | null } | null = null;
  /** İmza adımında açık olan fotoğraf */
  activeWmIndex: number = 0;

  // Hedef Kullanıcı (Admin kullanıcı eşleme ve seçme)
  targetUsernames: Record<string, string> = {};
  targetUserObjects: Record<string, TargetUserItem | null> = {};
  userSearchQueries: Record<string, string> = {};
  userSearchResults: Record<string, TargetUserItem[]> = {};
  searchingUsers: Record<string, boolean> = {};
  showUserSearch: Record<string, boolean> = {};

  isPortfolioNode(node: NetworkNode): boolean {
    const url = (node.url || '').toLowerCase();
    const name = (node.name || '').toLowerCase();
    return url.includes('portfolyo') || name.includes('portfolyo');
  }

  detectBrandAndKunye(): { brand: string; title: string } {
    let content = '';
    if (this.attrs.post) content = this.attrs.post.content() || '';
    else if (this.attrs.discussion) content = '';

    // 1. BBCode kunye parametresini ara
    let kunyeText = '';
    const kunyeAttrMatch = content.match(/\bkunye=["']([^"']+)["']/i);
    if (kunyeAttrMatch) {
      kunyeText = kunyeAttrMatch[1].replace(/\\n/g, '\n');
    }

    // 2. [framio-image alt="..."] içindeki künyeyi ara
    if (!kunyeText) {
      const altMatch = content.match(/\[(?:framio-image|spotter-image|ulasimarsiv-image)[^\]]*\balt=["']([^"']+)["']/i);
      if (altMatch && altMatch[1] && (altMatch[1].includes('|') || altMatch[1].includes('-'))) {
        kunyeText = altMatch[1].trim();
      }
    }

    // 3. Düz metin satırlarına bak (görsel etiketleri hariç)
    if (!kunyeText) {
      const cleanBody = content
        .replace(/\[(?:framio-image|spotter-image|ulasimarsiv-image|upl-image-preview)[^\]]*\].*?\[\/(?:framio-image|spotter-image|ulasimarsiv-image|upl-image-preview)\]/gis, '')
        .replace(/\[(?:framio-image|spotter-image|ulasimarsiv-image|upl-image-preview)[^\]]*\]/gi, '')
        .replace(/!\[.*?\]\(.*?\)/gi, '');
      const lines = cleanBody.split('\n').map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (line.includes('|')) {
          kunyeText = lines.slice(lines.indexOf(line)).join('\n');
          break;
        }
      }
    }

    let detectedBrand = '';
    let autoTitle = '';

    const brandKeywords: Array<{ key: string; name: string; patterns: RegExp[] }> = [
      { key: 'setra', name: 'Setra', patterns: [/setra/i, /s\s*\d{3}/i] },
      { key: 'mercedes', name: 'Mercedes-Benz', patterns: [/mercedes/i, /benz/i, /travego/i, /tourismo/i, /actros/i, /arocs/i, /atego/i] },
      { key: 'man', name: 'MAN', patterns: [/\bman\b/i, /lion'?s/i, /tgx/i, /tgs/i] },
      { key: 'neoplan', name: 'Neoplan', patterns: [/neoplan/i, /tourliner/i, /cityliner/i, /skyliner/i] },
      { key: 'temsa', name: 'TEMSA', patterns: [/temsa/i, /maraton/i, /safir/i, /prestij/i] },
      { key: 'otokar', name: 'Otokar', patterns: [/otokar/i, /kent/i, /sultan/i, /doruk/i] },
      { key: 'scania', name: 'Scania', patterns: [/scania/i, /irizar/i] },
      { key: 'volvo', name: 'Volvo', patterns: [/volvo/i, /9700/i, /9900/i, /fh/i] },
      { key: 'ford', name: 'Ford', patterns: [/ford/i, /f-max/i] },
      { key: 'daf', name: 'DAF', patterns: [/\bdaf\b/i, /xf/i, /cf/i] },
      { key: 'iveco', name: 'Iveco', patterns: [/iveco/i, /stralis/i, /s-way/i] },
      { key: 'bmc', name: 'BMC', patterns: [/\bbmc\b/i, /tugra/i, /neocity/i] },
      { key: 'isuzu', name: 'Isuzu', patterns: [/isuzu/i, /novociti/i, /turquoise/i] },
    ];

    if (kunyeText) {
      const lines = kunyeText.split('\n').map((l) => l.trim()).filter(Boolean);
      let company = '';
      let model = '';

      if (lines.length >= 2) {
        const line1 = lines[0];
        const line2 = lines[1];
        if (line1.includes('|')) {
          company = line1.split('|')[0].trim();
        } else {
          company = line1;
        }
        model = line2;
      } else if (lines.length === 1) {
        const singleLine = lines[0];
        // Örn: "Efe Tur | 41 TT 282 - Setra S 516 HD/2"
        if (singleLine.includes('-')) {
          const parts = singleLine.split('-');
          const left = parts[0].trim();
          model = parts.slice(1).join('-').trim();
          if (left.includes('|')) {
            company = left.split('|')[0].trim();
          } else {
            company = left;
          }
        } else if (singleLine.includes('|')) {
          const parts = singleLine.split('|');
          company = parts[0].trim();
          model = parts[1].trim();
        } else {
          company = singleLine;
        }
      }

      if (company && model) {
        autoTitle = `${company} & ${model}`;
      } else if (company) {
        autoTitle = company;
      } else if (model) {
        autoTitle = model;
      }

      for (const b of brandKeywords) {
        if (b.patterns.some((p) => p.test(model) || p.test(kunyeText) || p.test(content))) {
          detectedBrand = b.key;
          break;
        }
      }
    } else {
      // Künye yoksa genel içerikten marka ara
      for (const b of brandKeywords) {
        if (b.patterns.some((p) => p.test(content))) {
          detectedBrand = b.key;
          break;
        }
      }
    }

    return { brand: detectedBrand, title: autoTitle };
  }

  loadCategoriesForNode(nodeId: string) {
    this.loadingCategories[nodeId] = true;
    m.redraw();

    app.request<{ categories: TargetCategoryItem[]; is_portfolio?: boolean }>({
      method: 'GET',
      url: app.forum.attribute('apiUrl') + '/framio/crosspost/target-data',
      params: {
        action: 'categories',
        node_id: nodeId,
      },
    }).then((res) => {
      this.nodeCategories[nodeId] = res.categories || [];
      this.loadingCategories[nodeId] = false;

      // Otomatik eşleme: Künyeden tespit edilen marka varsa, slug veya name içinde ara
      const detected = this.detectedBrand || this.detectBrandAndKunye().brand;
      if (detected && this.nodeCategories[nodeId].length > 0) {
        const found = this.nodeCategories[nodeId].find((cat) => {
          const s = (cat.slug || '').toLowerCase();
          const n = (cat.name || '').toLowerCase();
          return s.includes(detected) || n.includes(detected);
        });
        if (found) {
          this.targetTags[nodeId] = found.slug;
        }
      }
      m.redraw();
    }).catch(() => {
      this.nodeCategories[nodeId] = [];
      this.loadingCategories[nodeId] = false;
      m.redraw();
    });
  }

  oninit(vnode: Mithril.Vnode<CrosspostModalAttrs, this>) {
    super.oninit(vnode);

    const discussion = this.attrs.discussion || (this.attrs.post ? (this.attrs.post.discussion() as Discussion) : null);
    if (discussion) {
      this.customTitle = discussion.title();
    }

    // Gönderideki metin ve görselleri tespit et
    this.inspectPostContent();

    // Künyeden başlık ve marka çıkarımı
    const kunyeInfo = this.detectBrandAndKunye();
    this.detectedBrand = kunyeInfo.brand;
    // Eğer künyeden araç bilgili başlık üretildiyse (Firma & Model) doğrudan onu kullan
    if (kunyeInfo.title) {
      this.customTitle = kunyeInfo.title;
    }

    // Varsayılan imza modunu admin ayarlarından al
    const defaultWm = app.forum.attribute<string>('framioCrosspostWmDefaultMode') || 'keep_source';
    this.watermarkMode = defaultWm as any;

    // Gönderi yazarının kullanıcı adı
    const authorUser = this.attrs.post ? this.attrs.post.user() : (discussion ? discussion.user() : null);
    const authorUsername = authorUser ? authorUser.username() : '';

    this.loading = true;
    app.request<{ nodes: NetworkNode[]; can_crosspost: boolean }>({
      method: 'GET',
      url: app.forum.attribute('apiUrl') + '/framio/crosspost/nodes',
      params: discussion && discussion.id() ? { discussion_id: discussion.id() } : {},
    }).then((response) => {
      this.nodes = response.nodes || [];
      this.nodes.forEach((node) => {
        const isPort = this.isPortfolioNode(node);
        this.selectedNodes[node.id] = true;
        this.targetTags[node.id] = node.default_tag_slug || '';
        this.targetDiscussionUrls[node.id] = '';
        this.targetDiscussionObjects[node.id] = null;
        this.searchQueries[node.id] = '';
        this.searchResults[node.id] = [];
        this.searchingNodes[node.id] = false;
        
        // Portfolyo için daima bağımsız fotoğraf ('new_discussion')
        this.postMode[node.id] = isPort ? 'new_discussion' : (this.isReplyContext() ? 'reply' : 'new_discussion');

        // Eşleşen tartışma: sadece normal forumlar için
        if (!isPort && node.mapped && node.mapped.url) {
          this.postMode[node.id] = 'reply';
          this.targetDiscussionUrls[node.id] = node.mapped.url;
          this.targetDiscussionObjects[node.id] = { id: '', title: node.mapped.title || node.mapped.url, slug: '', comment_count: 0, url: node.mapped.url };
        }

        // Hedef kullanıcı varsayılanı orijinal gönderi yazarı
        this.targetUsernames[node.id] = authorUsername;
        this.targetUserObjects[node.id] = null;
        this.userSearchQueries[node.id] = '';
        this.userSearchResults[node.id] = [];
        this.searchingUsers[node.id] = false;
        this.showUserSearch[node.id] = false;

        // Portfolyo kategorilerini arka planda yükle
        if (isPort) {
          this.loadCategoriesForNode(node.id);
        }
      });

      const mappedNodes = this.nodes.filter((n) => !this.isPortfolioNode(n) && n.mapped && n.mapped.url);
      if (mappedNodes.length) {
        this.quickConfirm = true;
        this.nodes.forEach((n) => { this.selectedNodes[n.id] = !!(n.mapped && n.mapped.url); });
      }
      this.restoreInitialPayload();
      this.loading = false;
      m.redraw();
    }).catch(() => {
      this.loading = false;
      m.redraw();
    });
  }

  isReplyContext(): boolean {
    if (this.attrs.deferred) return !!this.attrs.isReply;
    return !!(this.attrs.post && this.attrs.post.number() > 1);
  }

  /** Ertelenmiş modda önceki seçimi geri yükle */
  restoreInitialPayload() {
    const p = this.attrs.initialPayload;
    if (!p) return;
    this.quickConfirm = false;
    this.nodes.forEach((n) => { this.selectedNodes[n.id] = (p.target_nodes || []).includes(n.id); });
    Object.assign(this.targetTags, p.target_tags || {});
    Object.assign(this.targetUsernames, p.target_usernames || {});
    Object.entries(p.target_discussion_urls || {}).forEach(([id, url]) => {
      if (url) { this.targetDiscussionUrls[id] = url as string; this.postMode[id] = 'reply'; }
    });
    if (p.custom_title) this.customTitle = p.custom_title;
    if (p.custom_description) this.customDescription = p.custom_description;
    if (p.watermark_mode) this.watermarkMode = p.watermark_mode;
    this.selectedWatermarkId = p.watermark_id || null;
    this.excludedImageUrls = {};
    (p.excluded_image_indexes || []).forEach((i: number) => {
      if (this.extractedImages[i]) {
        this.excludedImageUrls[this.extractedImages[i].url] = true;
      }
    });
  }

  inspectPostContent() {
    if (this.attrs.deferred) {
      this.extractedImages = (this.attrs.previewImages || []).map((url) => ({ url }));
      this.postExcerpt = '';
      return;
    }
    let content = '';
    if (this.attrs.post) {
      content = this.attrs.post.content() || '';
    } else if (this.attrs.discussion) {
      // Tartışmanın ilk mesajı
      content = '';
    }

    this.extractedImages = [];
    const seenUrls = new Set<string>();

    // 1. [framio-image id=123 url="..." alt="..."], [spotter-image ...], [ulasimarsiv-image ...]
    const bbRegex = /\[(?:framio-image|spotter-image|ulasimarsiv-image|upl-image-preview)[^\]]*\]/gi;
    let match: RegExpExecArray | null;
    while ((match = bbRegex.exec(content)) !== null) {
      const tag = match[0];
      const idMatch = tag.match(/\bid=['"]?(\d+)['"]?/i);
      const urlMatch = tag.match(/\burl=['"]([^'"]+)['"]/i) || tag.match(/\burl=([^\s\]]+)/i);
      const altMatch = tag.match(/\balt=['"]([^'"]*)['"]/i);

      if (urlMatch && urlMatch[1] && !seenUrls.has(urlMatch[1])) {
        seenUrls.add(urlMatch[1]);
        this.extractedImages.push({
          url: urlMatch[1],
          alt: altMatch ? altMatch[1] : '',
          id: idMatch ? parseInt(idMatch[1], 10) : undefined,
        });
      }
    }

    // 2. ![alt](url)
    const mdRegex = /!\[([^\]]*)\]\(([^)]+)\)/gi;
    while ((match = mdRegex.exec(content)) !== null) {
      const alt = match[1];
      const url = match[2];
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        this.extractedImages.push({ url, alt });
      }
    }

    // Düz metin alıntısı
    const cleanText = content
      .replace(/\[(?:framio-image|spotter-image|ulasimarsiv-image|upl-image-preview)[^\]]*\].*?\[\/(?:framio-image|spotter-image|ulasimarsiv-image|upl-image-preview)\]/gis, '')
      .replace(/\[(?:framio-image|spotter-image|ulasimarsiv-image|upl-image-preview)[^\]]*\]/gi, '')
      .replace(/!\[.*?\]\(.*?\)/gi, '')
      .replace(/[#*`_~>]/g, '')
      .trim();

    this.postExcerpt = cleanText.length > 200 ? cleanText.substring(0, 197) + '...' : cleanText;
  }

  hasWatermarkOptions(): boolean {
    const wmAllowKeepSource = app.forum.attribute<boolean>('framioCrosspostWmAllowKeepSource') !== false;
    const wmAllowTargetSite = app.forum.attribute<boolean>('framioCrosspostWmAllowTargetSite') !== false;
    const wmAllowNoWatermark = !!app.forum.attribute<boolean>('framioCrosspostWmAllowNoWatermark');
    const wmAllowCustomUpload = !!app.forum.attribute<boolean>('framioCrosspostWmAllowCustomUpload');

    const anyEnabled = wmAllowKeepSource || wmAllowTargetSite || wmAllowNoWatermark || wmAllowCustomUpload;
    return this.extractedImages.length > 0 && anyEnabled;
  }

  className() {
    return 'CrosspostModal Modal--medium';
  }

  title() {
    if (this.results.length > 0) {
      return 'Aktarım Sonuçları';
    }

    if (this.quickConfirm) return 'Ortak Paylaşım — Eşleşen Tartışma';
    const postNum = this.attrs.post ? ` (#${this.attrs.post.number()})` : '';
    switch (this.currentStep) {
      case 1:
        return `Mesajı Ağa Aktar${postNum} — Hedef Platform`;
      case 2:
        return `Mesajı Ağa Aktar${postNum} — Konu & Önizleme`;
      case 3:
        return `Mesajı Ağa Aktar${postNum} — İmza Seçimi`;
      default:
        return `Mesajı Ağa Aktar${postNum}`;
    }
  }

  content() {
    if (this.loading) {
      return (
        <div className="Modal-body">
          <LoadingIndicator />
        </div>
      );
    }

    if (this.results.length > 0) {
      return this.renderResults();
    }

    return (
      <div className="Modal-body CrosspostModal-body">
        {/* Stepper Göstergesi */}
        {!this.quickConfirm && this.renderStepper()}

        {this.nodes.length === 0 ? (
          <div className="Alert Alert--warning">
            {app.translator.trans('framio-network-crosspost.forum.no_nodes')}
          </div>
        ) : (
          this.quickConfirm ? this.renderQuickConfirm() : <form onsubmit={(e) => { e.preventDefault(); }}>
            {this.currentStep === 1 && this.renderStep1()}
            {this.currentStep === 2 && this.renderStep2()}
            {this.currentStep === 3 && this.renderStep3()}
          </form>
        )}
      </div>
    );
  }

  renderStepper(): Mithril.Children {
    const hasWm = this.hasWatermarkOptions();
    const steps = [
      { num: 1, title: 'Hedef Platform', icon: 'fas fa-network-wired' },
      { num: 2, title: 'Konu & Önizleme', icon: 'fas fa-eye' },
      ...(hasWm ? [{ num: 3, title: 'İmza Ayarları', icon: 'fas fa-stamp' }] : []),
    ];

    return (
      <div className="CrosspostStepper">
        {steps.map((st) => {
          const isActive = this.currentStep === st.num;
          const isPassed = this.currentStep > st.num;
          return (
            <div className={`CrosspostStepper-item ${isActive ? 'is-active' : ''} ${isPassed ? 'is-passed' : ''}`} key={st.num}>
              <div className="CrosspostStepper-circle">
                {isPassed ? <Icon name="fas fa-check" /> : <Icon name={st.icon} />}
              </div>
              <div className="CrosspostStepper-label">
                <span className="CrosspostStepper-num">Adım {st.num}</span>
                <span className="CrosspostStepper-title">{st.title}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ==========================================
  // ADIM 1: HEDEF VE MOD SEÇİMİ
  // ==========================================
  renderStep1(): Mithril.Children {
    return (
      <div className="CrosspostStep-content">
        <p className="CrosspostModal-desc">
          Bu içeriği paylaşmak istediğiniz hedef ağ platformlarını ve aktarım türünü belirleyin.
        </p>

        {/* Başlık Girişi */}
        <div className="Form-group">
          <label className="CrosspostModal-field-label">
            <Icon name="fas fa-heading" /> Başlık
          </label>
          <input
            type="text"
            className="FormControl"
            value={this.customTitle}
            oninput={(e: Event) => {
              this.customTitle = (e.target as HTMLInputElement).value;
            }}
            placeholder="Konu Başlığı..."
          />
        </div>

        {/* Düğüm Listesi */}
        <div className="CrosspostModal-node-list">
          {this.nodes.map((node) => {
            const isSelected = !!this.selectedNodes[node.id];
            const isPort = this.isPortfolioNode(node);
            const mode = this.postMode[node.id] || 'new_discussion';

            return (
              <div className={`CrosspostModal-node-item ${isSelected ? 'is-selected' : ''}`} key={node.id}>
                <div className="CrosspostModal-node-header">
                  <label>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onchange={(e: Event) => {
                        this.selectedNodes[node.id] = (e.target as HTMLInputElement).checked;
                      }}
                    />
                    <span className="CrosspostModal-node-name">{node.name}</span>
                  </label>
                  <span className="CrosspostModal-node-url">{node.url}</span>
                </div>

                {isSelected && (
                  <div className="CrosspostModal-node-options">
                    {isPort ? (
                      <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px; color: #0369a1; background: #e0f2fe; padding: 8px 12px; border-radius: 6px; font-size: 13px;">
                        <Icon name="fas fa-camera" />
                        <span><strong>Portfolyo Fotoğrafı:</strong> İçerik, ilgili markanın altında bağımsız bir fotoğraf gönderisi olarak paylaşılacaktır.</span>
                      </div>
                    ) : (
                      (this.attrs.post || this.isReplyContext()) && (
                        <div className="CrosspostModal-mode-radios">
                          <label className={`CrosspostModal-radio-pill ${mode === 'new_discussion' ? 'is-active' : ''}`}>
                            <input
                              type="radio"
                              name={`mode_${node.id}`}
                              checked={mode === 'new_discussion'}
                              onchange={() => {
                                this.postMode[node.id] = 'new_discussion';
                              }}
                            />
                            <Icon name="fas fa-plus-circle" />
                            <span>Yeni Konu Başlat</span>
                          </label>
                          <label className={`CrosspostModal-radio-pill ${mode === 'reply' ? 'is-active' : ''}`}>
                            <input
                              type="radio"
                              name={`mode_${node.id}`}
                              checked={mode === 'reply'}
                              onchange={() => {
                                this.postMode[node.id] = 'reply';
                              }}
                            />
                            <Icon name="fas fa-reply" />
                            <span>Mevcut Konuya Yanıt Ekle</span>
                          </label>
                        </div>
                      )
                    )}

                    {!isPort && mode === 'new_discussion' && (
                      <div className="CrosspostModal-node-tag-input">
                        <label>
                          <Icon name="fas fa-tag" /> Hedef Etiket (Slug):
                        </label>
                        <input
                          type="text"
                          className="FormControl"
                          placeholder={app.translator.trans('framio-network-crosspost.forum.target_tag_placeholder')}
                          value={this.targetTags[node.id] || ''}
                          oninput={(e: Event) => {
                            this.targetTags[node.id] = (e.target as HTMLInputElement).value;
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Adım 1 Butonları */}
        <div className="CrosspostModal-actions">
          <Button
            type="button"
            className="Button"
            onclick={() => { this.hide(); }}
          >
            İptal
          </Button>

          <Button
            type="button"
            className="Button Button--primary"
            disabled={!Object.values(this.selectedNodes).some(Boolean)}
            onclick={() => {
              this.currentStep = 2;
              // Reply modundaki düğümler için tartışmaları otomatik yükle
              this.prepareStep2();
            }}
          >
            <span>İleri: Konu & Önizleme</span>
            <Icon name="fas fa-arrow-right" />
          </Button>
        </div>
      </div>
    );
  }

  renderQuickConfirm(): Mithril.Children {
    const mapped = this.nodes.filter((n) => n.mapped && n.mapped.url);
    const others = this.nodes.filter((n) => !(n.mapped && n.mapped.url));
    return (
      <div className="CrosspostStep-content">
        <p className="CrosspostModal-desc">
          Bu tartışmanın diğer sitelerdeki karşılığı tanımlı. İçerik aşağıdaki tartışmalara yanıt olarak aktarılsın mı?
        </p>
        <div className="CrosspostModal-node-list">
          {mapped.map((node) => (
            <div className={`CrosspostModal-node-item ${this.selectedNodes[node.id] ? 'is-selected' : ''}`} key={node.id}>
              <div className="CrosspostModal-node-header">
                <label>
                  <input
                    type="checkbox"
                    checked={!!this.selectedNodes[node.id]}
                    onchange={(e: Event) => { this.selectedNodes[node.id] = (e.target as HTMLInputElement).checked; }}
                  />
                  <span className="CrosspostModal-node-name">{node.name}</span>
                </label>
              </div>
              <div className="CrosspostTargetCard-new-info">
                <Icon name="fas fa-link" />
                <span>
                  <strong>{node.mapped!.title || 'Eşleşen tartışma'}</strong>
                  <br />
                  <a href={node.mapped!.url} target="_blank" rel="noopener noreferrer" style="font-size: 12px;">{node.mapped!.url}</a>
                </span>
              </div>
            </div>
          ))}
        </div>
        {this.extractedImages.length > 1 && <div style="margin-top: 12px;">{this.renderImagePicker()}</div>}
        {this.watermarkMode === 'target_site' && (
          <div className="CrosspostQuickWm">
            <div className="CrosspostQuickWm-title"><Icon name="fas fa-stamp" /> İmza</div>
            {this.renderWatermarkPicker(mapped.find((n) => this.selectedNodes[n.id]) || mapped[0])}
          </div>
        )}
        {others.length > 0 && (
          <div className="helpText" style="margin-top: 8px;">
            {others.map((n) => n.name).join(', ')} için eşleşme yok; oraya da aktarmak için "Farklı Yer Seç"i kullanın.
          </div>
        )}
        <div className="CrosspostModal-actions">
          <Button type="button" className="Button" onclick={() => { this.quickConfirm = false; this.currentStep = 1; }}>
            <Icon name="fas fa-sliders-h" />
            <span>Farklı Yer Seç</span>
          </Button>
          <Button
            type="button"
            className="Button Button--primary"
            loading={this.submitting}
            disabled={!Object.values(this.selectedNodes).some(Boolean) || (this.extractedImages.length > 1 && this.selectedImageCount() === 0)}
            onclick={this.onsubmit.bind(this)}
          >
            <Icon name="fas fa-check" />
            <span>Evet, Buraya Aktar</span>
          </Button>
        </div>
      </div>
    );
  }

  isImageExcluded(img: ExtractedImage): boolean {
    return !!this.excludedImageUrls[img.url];
  }

  toggleImageExcluded(img: ExtractedImage) {
    this.excludedImageUrls[img.url] = !this.isImageExcluded(img);
    m.redraw();
  }

  selectedImageCount(): number {
    return this.extractedImages.filter((img) => !this.isImageExcluded(img)).length;
  }

  /** Birden çok görsel varsa hangilerinin aktarılacağını ve sırasını seçtiren görsel yöneticisi */
  renderImagePicker(): Mithril.Children {
    const imgs = this.extractedImages;
    if (imgs.length === 0) return null;
    const multi = imgs.length > 1;
    const count = this.selectedImageCount();

    return (
      <div className="CrosspostImagePicker">
        <div className="CrosspostImagePicker-head" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span>
            <Icon name="fas fa-images" /> Aktarılacak görseller: <strong>{count} / {imgs.length}</strong>
            {multi && <span style="font-size: 11px; color: #64748b; margin-left: 8px;">(Okları kullanarak kapak görselini ve aktarım sırasını belirleyebilirsiniz)</span>}
          </span>
          {multi && (
            <span className="CrosspostImagePicker-bulk">
              <a onclick={() => { this.excludedImageUrls = {}; }}>Tümü</a>
              {' · '}
              <a onclick={() => { imgs.forEach((img) => { this.excludedImageUrls[img.url] = true; }); }}>Hiçbiri</a>
            </span>
          )}
        </div>

        <div className="CrosspostPreviewBox-thumbnails" style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px;">
          {imgs.map((img, idx) => {
            const off = this.isImageExcluded(img);
            const isCover = idx === 0;

            return (
              <div
                className="CrosspostPreviewBox-thumb-wrapper"
                key={img.url}
                style="display: flex; flex-direction: column; align-items: center; gap: 4px;"
              >
                <div
                  className={`CrosspostPreviewBox-thumb ${multi ? 'is-pickable' : ''} ${off ? 'is-excluded' : 'is-picked'}`}
                  title={off ? 'Aktarılmayacak — eklemek için tıklayın' : (isCover ? 'Kapak Fotoğrafı (İlk Görsel)' : 'Aktarılacak — çıkarmak için tıklayın')}
                  onclick={() => { if (multi) this.toggleImageExcluded(img); }}
                  style={`cursor: pointer; position: relative; width: 88px; height: 64px; border-radius: 6px; overflow: hidden; border: 2px solid ${isCover && !off ? '#0284c7' : (off ? '#cbd5e1' : '#10b981')}; opacity: ${off ? '0.45' : '1'}; transition: all 0.2s;`}
                >
                  <img src={img.url} alt={img.alt || `Görsel ${idx + 1}`} style="width: 100%; height: 100%; object-fit: cover;" />
                  {multi && (
                    <span className="CrosspostImagePicker-check" style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.65); border-radius: 50%; color: white; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px;">
                      <Icon name={off ? 'far fa-circle' : 'fas fa-check-circle'} style={off ? 'color: #94a3b8;' : 'color: #10b981;'} />
                    </span>
                  )}
                  <span className="CrosspostPreviewBox-thumb-id" style="position: absolute; bottom: 4px; left: 4px; background: rgba(0,0,0,0.7); color: white; font-size: 10px; padding: 1px 5px; border-radius: 3px; font-weight: bold;">
                    {idx + 1}
                  </span>
                  {isCover && !off && (
                    <span style="position: absolute; bottom: 4px; right: 4px; background: #0284c7; color: white; font-size: 9px; padding: 1px 4px; border-radius: 3px; font-weight: bold; text-transform: uppercase;">
                      Kapak
                    </span>
                  )}
                </div>

                {multi && (
                  <div className="CrosspostThumb-order-buttons" style="display: flex; gap: 4px;">
                    <button
                      type="button"
                      className="Button Button--icon Button--small"
                      disabled={idx === 0}
                      title="Sola taşı (Öne al)"
                      onclick={(e: Event) => { e.stopPropagation(); this.moveImage(idx, idx - 1); }}
                      style="padding: 2px 7px; font-size: 10px; line-height: 1; border-radius: 4px; background: #f1f5f9; border: 1px solid #cbd5e1; cursor: pointer;"
                    >
                      <Icon name="fas fa-chevron-left" />
                    </button>
                    <button
                      type="button"
                      className="Button Button--icon Button--small"
                      disabled={idx === imgs.length - 1}
                      title="Sağa taşı (Arkaya al)"
                      onclick={(e: Event) => { e.stopPropagation(); this.moveImage(idx, idx + 1); }}
                      style="padding: 2px 7px; font-size: 10px; line-height: 1; border-radius: 4px; background: #f1f5f9; border: 1px solid #cbd5e1; cursor: pointer;"
                    >
                      <Icon name="fas fa-chevron-right" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {multi && count === 0 && <div className="CrosspostImagePicker-warn" style="color: #ef4444; font-size: 12px; margin-top: 6px;">En az bir görsel seçmelisiniz.</div>}
      </div>
    );
  }

  prepareStep2() {
    const selectedNodeIds = Object.keys(this.selectedNodes).filter((id) => this.selectedNodes[id]);
    selectedNodeIds.forEach((nodeId) => {
      const node = this.nodes.find((n) => n.id === nodeId);
      if (node && this.isPortfolioNode(node)) {
        if (!this.nodeCategories[nodeId] || this.nodeCategories[nodeId].length === 0) {
          this.loadCategoriesForNode(nodeId);
        }
      } else if (this.postMode[nodeId] === 'reply') {
        // Eğer arama sonucu boşsa ve henüz aranmadıysa ilk tartışmaları listele
        if (!this.searchResults[nodeId] || this.searchResults[nodeId].length === 0) {
          this.searchDiscussions(nodeId, '');
        }
      }
    });
  }

  renderCategoryOptions(categories: TargetCategoryItem[]): Mithril.Children {
    if (!categories || categories.length === 0) {
      return [
        <optgroup label="Otobüs">
          <option value="otobussetra">Setra</option>
          <option value="otobusmercedesbenz">Mercedes-Benz</option>
          <option value="otobusman">MAN</option>
          <option value="otobusneoplan">Neoplan</option>
          <option value="temsa">TEMSA</option>
          <option value="diger-markalar">Diğer Markalar</option>
        </optgroup>,
        <option value="otobus">Otobüs (Genel)</option>,
        <option value="cekici-tir">Çekici / Tır</option>,
        <option value="kamyon">Kamyon</option>,
      ];
    }

    const parents = categories.filter((c) => !c.parentId);
    const children = categories.filter((c) => !!c.parentId);

    if (parents.length > 0 && children.length > 0) {
      return parents.map((parent) => {
        const subCats = children.filter((c) => c.parentId === parent.id);
        if (subCats.length > 0) {
          return (
            <optgroup label={parent.name} key={parent.id}>
              {subCats.map((sub) => (
                <option value={sub.slug} key={sub.id}>
                  {sub.name}
                </option>
              ))}
              <option value={parent.slug}>{parent.name} (Genel)</option>
            </optgroup>
          );
        }
        return (
          <option value={parent.slug} key={parent.id}>
            {parent.name}
          </option>
        );
      });
    }

    return categories.map((cat) => (
      <option value={cat.slug} key={cat.id}>
        {cat.name}
      </option>
    ));
  }

  searchDiscussions(nodeId: string, query: string) {
    this.searchingNodes[nodeId] = true;
    m.redraw();

    app.request<{ discussions: TargetDiscussionItem[] }>({
      method: 'GET',
      url: app.forum.attribute('apiUrl') + '/framio/crosspost/target-data',
      params: {
        action: 'discussions',
        node_id: nodeId,
        q: query,
      },
    }).then((res) => {
      this.searchResults[nodeId] = res.discussions || [];
      this.searchingNodes[nodeId] = false;
      m.redraw();
    }).catch(() => {
      this.searchResults[nodeId] = [];
      this.searchingNodes[nodeId] = false;
      m.redraw();
    });
  }

  searchUsers(nodeId: string, query: string) {
    this.searchingUsers[nodeId] = true;
    m.redraw();

    app.request<{ users: TargetUserItem[] }>({
      method: 'GET',
      url: app.forum.attribute('apiUrl') + '/framio/crosspost/target-data',
      params: {
        action: 'users',
        node_id: nodeId,
        q: query,
      },
    }).then((res) => {
      this.userSearchResults[nodeId] = res.users || [];
      this.searchingUsers[nodeId] = false;
      m.redraw();
    }).catch(() => {
      this.userSearchResults[nodeId] = [];
      this.searchingUsers[nodeId] = false;
      m.redraw();
    });
  }

  /** Görselin yönü: yükleme ekranındaki gibi yatay fotoğrafa yalnızca yatay imzalar önerilir */
  imageOrientation(url: string): 'landscape' | 'portrait' | null {
    const d = this.imageDims[url];
    if (!d) {
      if (!(url in this.imageDims)) {
        this.imageDims[url] = undefined as any;
        const img = new Image();
        img.onload = () => { this.imageDims[url] = { w: img.naturalWidth, h: img.naturalHeight }; m.redraw(); };
        img.src = url;
      }
      return null;
    }
    return d.w >= d.h ? 'landscape' : 'portrait';
  }

  /** Önizleme için kaynaktaki imzasız orijinal (yoksa mesajdaki görsel) */
  previewSource(img: ExtractedImage): string {
    if (img.id && !(img.url in this.originalSrc)) {
      this.originalSrc[img.url] = '';
      app.request<any>({ method: 'GET', url: app.forum.attribute('apiUrl') + '/framio-media/image/' + img.id })
        .then((res) => {
          const a = (res && res.data && res.data.attributes) || res || {};
          const orig = a.original_url || a.original_path || '';
          if (!orig) return;
          // Kayıtta adres olsa da dosya bulutta olmayabilir (404): yalnızca yüklenebiliyorsa geç
          const probe = new Image();
          probe.onload = () => { this.originalSrc[img.url] = orig; m.redraw(); };
          probe.onerror = () => { this.originalMissing[img.url] = true; m.redraw(); };
          probe.src = orig;
        })
        .catch(() => {});
    }
    return this.originalSrc[img.url] || img.url;
  }

  watermarksForImage(url: string, all: TargetWatermarkItem[]): TargetWatermarkItem[] {
    const orient = this.imageOrientation(url);
    if (!orient) return all;
    return all.filter((wm) => wm.type === orient || wm.type === 'other');
  }

  /** Seçili imza yoksa ya da görselin yönüne uymuyorsa: önce kişisel imza, yoksa ilk site imzası */
  chosenWatermarkFor(url: string, all: TargetWatermarkItem[]): TargetWatermarkItem | null {
    const list = this.watermarksForImage(url, all);
    let chosen = list.find((wm) => wm.id === this.wmPerImage[url]);
    if (!chosen && list.length) {
      chosen = list.find((wm) => wm.is_personal) || list.find((wm) => wm.id === this.selectedWatermarkId) || list[0];
      this.wmPerImage[url] = chosen.id;
    }
    return chosen || null;
  }

  chooseWatermark(url: string, wm: TargetWatermarkItem) {
    this.wmPerImage[url] = wm.id;
    this.selectedWatermarkId = wm.id;
    this.openWmMenu = null;
    // "Tümüne uygula" açıksa aynı yöndeki diğer fotoğraflara da uygula
    if (this.applyToAll) {
      this.extractedImages.forEach((other) => {
        if (other.url !== url && this.imageOrientation(other.url) === this.imageOrientation(url)) this.wmPerImage[other.url] = wm.id;
      });
    }
  }

  renderWmPreview(src: string, wm: TargetWatermarkItem | null, large = false): Mithril.Children {
    const ratio = wm ? this.wmRatios[wm.url] : undefined;
    // Sunucudaki kural: oranı 0.3'ten büyük imza tam tuvaldir (kapla, alta hizala), değilse alt şerittir
    const full = ratio !== undefined && ratio > 0.3;
    const center = wm && /orta/i.test(wm.filename || wm.url);
    return (
      <div
        className={`CrosspostWmPreview ${large ? 'is-large' : ''}`}
        title={large ? '' : 'Büyütmek için tıklayın'}
        onclick={large ? undefined : () => { this.zoomPreview = { src, wm }; }}
      >
        <img className="CrosspostWmPreview-photo" src={src} alt="" decoding="async" />
        {wm && (
          <img
            className={`CrosspostWmPreview-wm ${full ? 'is-full' : center ? 'is-center' : 'is-strip'}`}
            src={wm.url}
            alt=""
            onload={(e: Event) => {
              const el = e.target as HTMLImageElement;
              if (!(wm.url in this.wmRatios) && el.naturalWidth) { this.wmRatios[wm.url] = el.naturalHeight / el.naturalWidth; m.redraw(); }
            }}
          />
        )}
        {!large && <span className="CrosspostWmPreview-zoom"><Icon name="fas fa-search-plus" /></span>}
      </div>
    );
  }

  wmButtonStyle(wm: TargetWatermarkItem, swatch = false): Record<string, string> {
    const st: Record<string, string> = {};
    if (wm.bg_color) st.background = wm.bg_color;
    if (wm.text_color) st.color = wm.text_color;
    if (wm.border_color) st.borderColor = wm.border_color;
    if (swatch && !wm.bg_color && !wm.border_color) st.background = 'var(--control-bg)';
    return st;
  }

  /** Yükleme ekranındaki (WatermarkModal) düğmeler: kişisel imza + yöne uygun site imzası menüsü */
  renderWmControls(url: string, nodeId: string, all: TargetWatermarkItem[], chosen: TargetWatermarkItem | null): Mithril.Children {
    const mode = this.targetWmMode[nodeId] || 'hybrid';
    const options = this.watermarksForImage(url, all);
    const personal = mode !== 'templates' ? options.find((wm) => wm.is_personal) : undefined;
    const templates = mode !== 'personal' ? options.filter((wm) => !wm.is_personal) : [];
    const selectedTemplate = chosen && !chosen.is_personal ? chosen : null;
    const open = this.openWmMenu === url;
    const orient = this.imageOrientation(url);

    return (
      <div className="WmA-options">
        {personal && (
          <div className="WmA-optWrap">
            <button type="button" className={'WmA-opt is-primary' + (chosen && chosen.id === personal.id ? ' is-selected' : '')} onclick={() => this.chooseWatermark(url, personal)}>
              <Icon name="fas fa-signature" />
              <span>Kişisel İmza</span>
            </button>
          </div>
        )}

        {templates.length > 0 && (
          <div className="Watermark-Dropdown-Container WmA-optWrap">
            <button
              type="button"
              className={'WmA-opt is-site' + (selectedTemplate ? ' is-selected' : '')}
              style={selectedTemplate ? this.wmButtonStyle(selectedTemplate) : undefined}
              onclick={(e: Event) => { e.preventDefault(); this.openWmMenu = open ? null : url; }}
            >
              <Icon name="fas fa-stamp" />
              <span>{selectedTemplate ? (selectedTemplate.label || selectedTemplate.name) : 'Site İmzası Seç'}</span>
              <i className={'fas fa-chevron-down WmA-chevron' + (open ? ' is-open' : '')}></i>
            </button>
            {open && (
              <div className="WmA-menu">
                <div className="WmA-menuHead">{orient === 'portrait' ? 'Dikey' : 'Yatay'} fotoğraf imzaları</div>
                {templates.map((wm) => {
                  const on = chosen && chosen.id === wm.id;
                  return (
                    <button type="button" className={'WmA-menuItem' + (on ? ' is-selected' : '')} onclick={() => this.chooseWatermark(url, wm)}>
                      <span className="WmA-menuLabel">
                        <span className="WmA-swatch" style={this.wmButtonStyle(wm, true)}></span>
                        {wm.label || wm.name}
                      </span>
                      {on ? <i className="fas fa-check"></i> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!personal && !templates.length && (
          <div className="Alert Alert--info">Hedef sitede bu yöne uygun imza bulunamadı.</div>
        )}
      </div>
    );
  }

  /** Normal yüklemedeki gibi: her görsel için imzasız önizleme ve yönüne uygun imzalar */
  renderWatermarkPicker(node: NetworkNode | undefined): Mithril.Children {
    if (!node) return null;
    if (this.targetWatermarks[node.id] === undefined && !this.loadingWatermarks[node.id]) {
      this.loadWatermarksForNode(node.id);
    }
    if (this.loadingWatermarks[node.id]) return <div style="padding: 12px; text-align: center;"><LoadingIndicator /></div>;

    const all = this.targetWatermarks[node.id] || [];
    if (!all.length) return <div className="Alert Alert--info">Hedef platformda tanımlı imza dosyası bulunamadı.</div>;

    const images = this.extractedImages.filter((img) => !this.isImageExcluded(img));
    return (
      <div className="CrosspostWmPerImage" onclick={(e: Event) => e.stopPropagation()}>
        {/* Yükleme ekranındaki gibi: tek büyük önizleme, altında fotoğraf şeridi */}
        {(() => {
          const idx = Math.min(this.activeWmIndex, images.length - 1);
          const img = images[idx];
          if (!img) return null;
          const chosen = this.chosenWatermarkFor(img.url, all);
          const orient = this.imageOrientation(img.url);
          return (
            <div className="CrosspostWmPerImage-row" key="active">
              <div className="CrosspostWmPerImage-main">
                {this.renderWmPreview(this.previewSource(img), chosen)}
                {images.length > 1 && (
                  <div className="CrosspostWmStrip">
                    {images.map((other, i) => (
                      <button
                        type="button"
                        className={'CrosspostWmStrip-item' + (i === idx ? ' is-active' : '')}
                        key={other.url}
                        onclick={() => { this.activeWmIndex = i; this.openWmMenu = null; }}
                        title={(i + 1) + '. fotoğraf'}
                      >
                        <img src={other.url} alt="" loading="lazy" />
                        <span className="CrosspostWmStrip-num">{i + 1}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="CrosspostWmPerImage-side">
                <div className="CrosspostWmPerImage-orient">
                  <Icon name={orient === 'portrait' ? 'fas fa-mobile-alt' : 'fas fa-image'} />{' '}
                  {images.length > 1 ? (idx + 1) + '/' + images.length + ' · ' : ''}
                  {orient === 'portrait' ? 'Dikey fotoğraf' : orient === 'landscape' ? 'Yatay fotoğraf' : 'Fotoğraf'}
                </div>
                {this.originalMissing[img.url] ? (
                  <div className="Alert Alert--warning CrosspostWmNoOriginal">
                    Bu fotoğrafın imzasız orijinali kaynakta bulunamadı. Üst üste imza olmaması için mevcut imzasıyla aktarılacak.
                  </div>
                ) : this.renderWmControls(img.url, node.id, all, chosen)}
              </div>
            </div>
          );
        })()}
        {this.zoomPreview && (
          <div className="CrosspostWmZoom" onclick={() => { this.zoomPreview = null; }}>
            {this.renderWmPreview(this.zoomPreview.src, this.zoomPreview.wm, true)}
            <button type="button" className="CrosspostWmZoom-close" aria-label="Kapat"><Icon name="fas fa-times" /></button>
          </div>
        )}
      </div>
    );
  }

  loadWatermarksForNode(nodeId: string, username?: string) {
    this.loadingWatermarks[nodeId] = true;
    m.redraw();

    const targetUser = username !== undefined ? username : (this.targetUsernames[nodeId] || '');

    app.request<{ watermarks: TargetWatermarkItem[]; owner_username?: string; has_personal_watermark?: boolean }>({
      method: 'GET',
      url: app.forum.attribute('apiUrl') + '/framio/crosspost/target-data',
      params: {
        action: 'watermarks',
        node_id: nodeId,
        username: targetUser,
      },
    }).then((res) => {
      this.targetWatermarks[nodeId] = res.watermarks || [];
      this.targetWmMode[nodeId] = (res as any).mode || 'hybrid';
      this.loadingWatermarks[nodeId] = false;

      // Eğer hedef sitede geçerli filigranlar varsa ve henüz seçilmediyse veya önceki geçersiz kaldıysa ilkini seç
      if (this.targetWatermarks[nodeId].length > 0) {
        const currentValid = this.targetWatermarks[nodeId].some((wm) => wm.id === this.selectedWatermarkId);
        if (!currentValid || !this.selectedWatermarkId) {
          this.selectedWatermarkId = this.targetWatermarks[nodeId][0].id;
        }
      } else {
        this.selectedWatermarkId = null;
      }
      m.redraw();
    }).catch(() => {
      this.targetWatermarks[nodeId] = [];
      this.loadingWatermarks[nodeId] = false;
      m.redraw();
    });
  }

  // ==========================================
  // ADIM 2: KONU SEÇİMİ VE İÇERİK ÖNİZLEME
  // ==========================================
  renderStep2(): Mithril.Children {
    const currentUser = app.session.user;
    const isAdmin = currentUser && (currentUser.isAdmin ? currentUser.isAdmin() : (currentUser.data as any)?.attributes?.isAdmin);
    const allowSelectUserSetting = app.forum.attribute<boolean>('framioCrosspostAllowAdminSelectUser') !== false;
    const canAdminSelectUser = !!isAdmin && allowSelectUserSetting;
    const selectedNodes = this.nodes.filter((n) => this.selectedNodes[n.id]);

    return (
      <div className="CrosspostStep-content">
        <p className="CrosspostModal-desc">
          Hedef sitedeki tartışmayı canlı arayarak seçin veya doğrudan bağlantı verin.
        </p>

        {/* Her seçili düğüm için konu arama/bağlantı */}
        <div className="CrosspostModal-target-selection-section">
          {selectedNodes.map((node) => {
            const isPort = this.isPortfolioNode(node);
            const mode = this.postMode[node.id] || 'new_discussion';
            const selectedDiscussion = this.targetDiscussionObjects[node.id];
            const currentUrl = this.targetDiscussionUrls[node.id] || '';
            const isSearching = !!this.searchingNodes[node.id];
            const results = this.searchResults[node.id] || [];
            const targetUsername = this.targetUsernames[node.id] || '';
            const categories = this.nodeCategories[node.id] || [];
            const isLoadingCats = !!this.loadingCategories[node.id];
            const currentTag = this.targetTags[node.id] || '';

            return (
              <div className="CrosspostTargetCard" key={node.id}>
                <div className="CrosspostTargetCard-header">
                  <div className="CrosspostTargetCard-title">
                    <Icon name={isPort ? "fas fa-camera" : "fas fa-server"} />
                    <strong>{node.name}</strong>
                  </div>
                  <span className="CrosspostTargetCard-badge" style={isPort ? "background: #0284c7; color: white;" : ""}>
                    {isPort ? 'Portfolyo Fotoğrafı' : (mode === 'new_discussion' ? 'Yeni Konu' : 'Yanıt Ekle')}
                  </span>
                </div>

                {isPort ? (
                  <div className="CrosspostTargetCard-portfolio-body" style="padding: 16px; background: #f8fafc; border-radius: 8px; margin-top: 10px;">
                    <div className="Form-group" style="margin-bottom: 12px;">
                      <label style="display: flex; align-items: center; gap: 6px; font-weight: 600; margin-bottom: 6px;">
                        <Icon name="fas fa-tags" style="color: #0284c7;" /> Hedef Araç Markası / Kategorisi:
                      </label>
                      {isLoadingCats ? (
                        <div style="padding: 10px 0;"><LoadingIndicator /></div>
                      ) : (
                        <select
                          className="FormControl"
                          value={currentTag}
                          onchange={(e: Event) => {
                            this.targetTags[node.id] = (e.target as HTMLSelectElement).value;
                          }}
                        >
                          <option value="">-- Marka / Kategori Seçin --</option>
                          {this.renderCategoryOptions(categories)}
                        </select>
                      )}
                      <div className="helpText" style="margin-top: 6px; font-size: 12px; color: #64748b;">
                        {this.detectedBrand ? (
                          <span><Icon name="fas fa-magic" style="color: #0284c7;" /> Künye bilgilerinden <strong>"{this.detectedBrand.toUpperCase()}"</strong> markası algılanarak otomatik seçildi. Gerekirse açılır menüden değiştirebilirsiniz.</span>
                        ) : (
                          <span>İçeriğin portfolyoda listeleneceği ilgili markayı veya kategoriyi seçin.</span>
                        )}
                      </div>
                    </div>

                    <div style="padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px;">
                      <div style="display: flex; align-items: center; gap: 6px; color: #0f172a; font-weight: 600; margin-bottom: 4px;">
                        <Icon name="fas fa-check-circle" style="color: #10b981;" />
                        <span>Portfolyo Kayıt Özeti:</span>
                      </div>
                      <div style="color: #334155;">
                        <strong>Başlık:</strong> {this.customTitle.replace(/\[(?:framio-image|spotter-image|ulasimarsiv-image|upl-image-preview)[^\]]*\]/gi, '').trim() || 'Başlıksız'}
                      </div>
                      <div style="color: #64748b; font-size: 12px; margin-top: 4px;">
                        Bu mesaj forumda bir konunun yanıtı olsa bile, portfolyoda seçilen markanın altında bağımsız bir fotoğraf gönderisi olarak yayımlanacaktır.
                      </div>
                    </div>
                  </div>
                ) : mode === 'new_discussion' ? (
                  <div className="CrosspostTargetCard-new-info">
                    <Icon name="fas fa-info-circle" />
                    <span>Bu platformda <strong>"{this.customTitle}"</strong> başlığıyla yeni bir tartışma oluşturulacak.</span>
                  </div>
                ) : (
                  <div className="CrosspostTargetCard-reply-body">
                    {/* Canlı Arama Çubuğu */}
                    <div className="CrosspostSearch-bar">
                      <div className="CrosspostSearch-input-wrapper">
                        <Icon name="fas fa-search" />
                        <input
                          type="text"
                          className="FormControl"
                          placeholder={`${node.name} üzerinde konu ara...`}
                          value={this.searchQueries[node.id] || ''}
                          oninput={(e: Event) => {
                            this.searchQueries[node.id] = (e.target as HTMLInputElement).value;
                          }}
                          onkeydown={(e: KeyboardEvent) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              this.searchDiscussions(node.id, this.searchQueries[node.id] || '');
                            }
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        className="Button Button--primary"
                        loading={isSearching}
                        onclick={() => {
                          this.searchDiscussions(node.id, this.searchQueries[node.id] || '');
                        }}
                      >
                        Ara
                      </Button>
                    </div>

                    {/* Arama Sonuçları */}
                    {isSearching ? (
                      <div style="padding: 20px; text-align: center;">
                        <LoadingIndicator />
                      </div>
                    ) : results.length > 0 ? (
                      <div className="CrosspostDiscussionList">
                        {results.map((disc) => {
                          const isChosen = currentUrl === disc.url || (selectedDiscussion && selectedDiscussion.id === disc.id);
                          return (
                            <div
                              className={`CrosspostDiscussionItem ${isChosen ? 'is-selected' : ''}`}
                              key={disc.id}
                              onclick={() => {
                                this.targetDiscussionUrls[node.id] = disc.url;
                                this.targetDiscussionObjects[node.id] = disc;
                                m.redraw();
                              }}
                            >
                              <div className="CrosspostDiscussionItem-main">
                                <div className="CrosspostDiscussionItem-title">
                                  {isChosen && <Icon name="fas fa-check-circle" style="color: #059669; margin-right: 6px;" />}
                                  {disc.title}
                                </div>
                                <div className="CrosspostDiscussionItem-meta">
                                  <span><Icon name="far fa-comment" /> {disc.comment_count} mesaj</span>
                                  <span className="CrosspostDiscussionItem-url">{disc.url}</span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                className={`Button Button--small ${isChosen ? 'Button--primary' : ''}`}
                              >
                                {isChosen ? 'Seçildi' : 'Seç'}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="CrosspostSearch-empty">
                        <span>Konu bulunamadı. Aşağıdan doğrudan URL veya ID girebilirsiniz.</span>
                      </div>
                    )}

                    {/* Manuel URL / ID Girişi */}
                    <div className="CrosspostManualUrl-row">
                      <label>Veya doğrudan Konu URL / ID:</label>
                      <input
                        type="text"
                        className="FormControl"
                        placeholder="Örn: http://forum.../d/132-nostalji-otobusler veya 132"
                        value={this.targetDiscussionUrls[node.id] || ''}
                        oninput={(e: Event) => {
                          this.targetDiscussionUrls[node.id] = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Hedef Kullanıcı Seçimi (Yönetici İzni & Admin Kontrolü) */}
                {canAdminSelectUser && (
                  <div className="CrosspostTargetUserSection">
                    <div className="CrosspostTargetUserSection-header">
                      <div className="CrosspostTargetUserSection-title">
                        <Icon name="fas fa-user-tag" />
                        <span>Hedef Forumdaki Yazar / Sahip:</span>
                        <strong>{targetUsername ? `@${targetUsername}` : 'Varsayılan Yazar'}</strong>
                      </div>
                      <Button
                        type="button"
                        className="Button Button--link Button--small"
                        onclick={() => {
                          this.showUserSearch[node.id] = !this.showUserSearch[node.id];
                          if (this.showUserSearch[node.id] && (!this.userSearchResults[node.id] || this.userSearchResults[node.id].length === 0)) {
                            this.searchUsers(node.id, this.userSearchQueries[node.id] || '');
                          }
                          m.redraw();
                        }}
                      >
                        <Icon name={this.showUserSearch[node.id] ? 'fas fa-chevron-up' : 'fas fa-user-edit'} />
                        <span>{this.showUserSearch[node.id] ? 'Kapat' : 'Değiştir'}</span>
                      </Button>
                    </div>

                    {this.showUserSearch[node.id] && (
                      <div className="CrosspostTargetUserSearch-dropdown">
                        <div className="CrosspostSearch-input-wrapper">
                          <Icon name="fas fa-search" />
                          <input
                            type="text"
                            className="FormControl"
                            placeholder={`${node.name} üzerinde üye ara...`}
                            value={this.userSearchQueries[node.id] || ''}
                            oninput={(e: Event) => {
                              this.userSearchQueries[node.id] = (e.target as HTMLInputElement).value;
                            }}
                            onkeydown={(e: KeyboardEvent) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                this.searchUsers(node.id, this.userSearchQueries[node.id] || '');
                              }
                            }}
                          />
                          <Button
                            type="button"
                            className="Button Button--primary Button--small"
                            loading={!!this.searchingUsers[node.id]}
                            onclick={() => {
                              this.searchUsers(node.id, this.userSearchQueries[node.id] || '');
                            }}
                          >
                            Ara
                          </Button>
                        </div>

                        {/* Kullanıcı Sonuç Listesi */}
                        {this.searchingUsers[node.id] ? (
                          <div style="padding: 12px; text-align: center;">
                            <LoadingIndicator />
                          </div>
                        ) : (this.userSearchResults[node.id] || []).length > 0 ? (
                          <div className="CrosspostTargetUser-list">
                            {(this.userSearchResults[node.id] || []).map((u) => {
                              const isSelectedUser = targetUsername === u.username;
                              return (
                                <div
                                  className={`CrosspostTargetUser-item ${isSelectedUser ? 'is-selected' : ''}`}
                                  key={u.id}
                                  onclick={() => {
                                    this.targetUsernames[node.id] = u.username;
                                    this.targetUserObjects[node.id] = u;
                                    this.showUserSearch[node.id] = false;
                                    // Eğer hedef sitenin imzaları yüklüyse bu kullanıcı için yeniden yükle
                                    this.loadWatermarksForNode(node.id, u.username);
                                    m.redraw();
                                  }}
                                >
                                  <div className="CrosspostTargetUser-avatar">
                                    {u.avatar_url ? (
                                      <img src={u.avatar_url} alt={u.username} />
                                    ) : (
                                      <Icon name="fas fa-user-circle" />
                                    )}
                                  </div>
                                  <div className="CrosspostTargetUser-info">
                                    <span className="CrosspostTargetUser-name">{u.display_name}</span>
                                    <span className="CrosspostTargetUser-username">@{u.username}</span>
                                  </div>
                                  {isSelectedUser && (
                                    <Icon name="fas fa-check" className="CrosspostTargetUser-check" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="CrosspostSearch-empty" style="padding: 8px 12px; font-size: 12px;">
                            Üye bulunamadı. Kullanıcı adını arama kutusuna yazıp enter'a basın.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Taşınacak İçerik Önizlemesi */}
        <div className="CrosspostPreviewBox">
          <div className="CrosspostPreviewBox-header">
            <Icon name="fas fa-file-alt" />
            <strong>Taşınacak İçerik Önizlemesi</strong>
            {this.extractedImages.length > 0 && (
              <span className="CrosspostPreviewBox-img-count">
                <Icon name="fas fa-camera" /> {this.extractedImages.length} Görsel
              </span>
            )}
          </div>

          {/* Görsel seçimi (birden çok görselde tıklayarak çıkar/ekle) */}
          {this.renderImagePicker()}

          {/* Metin Alıntısı */}
          {this.postExcerpt && (
            <div className="CrosspostPreviewBox-excerpt">
              {this.postExcerpt}
            </div>
          )}
        </div>

        {/* Özel Açıklama Alanı (Portfolyo / Genel - İsteğe Bağlı) */}
        <div className="Form-group" style="margin-top: 16px;">
          <label style="display: flex; justify-content: space-between; align-items: center; font-weight: 600; margin-bottom: 6px;">
            <span style="display: flex; align-items: center; gap: 6px; color: #1e293b;">
              <Icon name="fas fa-comment-alt" style="color: #0284c7;" />
              <span>Açıklama Ekle (İsteğe Bağlı):</span>
            </span>
            <span style="font-size: 11px; font-weight: normal; color: #64748b;">
              Boş bırakılırsa künye veya konu metni kullanılır
            </span>
          </label>
          <textarea
            className="FormControl"
            rows={3}
            placeholder="Fotoğraf, araç veya çekim hakkında portfolyoda görünecek özel bir açıklama yazabilirsiniz..."
            value={this.customDescription}
            oninput={(e: Event) => {
              this.customDescription = (e.target as HTMLTextAreaElement).value;
            }}
          />
        </div>

        {/* Adım 2 Butonları */}
        <div className="CrosspostModal-actions">
          <Button
            type="button"
            className="Button"
            onclick={() => { this.currentStep = 1; }}
          >
            <Icon name="fas fa-arrow-left" />
            <span>Geri: Platform Seçimi</span>
          </Button>

          {this.hasWatermarkOptions() ? (
            <Button
              type="button"
              className="Button Button--primary"
              disabled={this.extractedImages.length > 1 && this.selectedImageCount() === 0}
              onclick={() => {
                this.currentStep = 3;
                this.prepareStep3();
              }}
            >
              <span>İleri: İmza Seçimi</span>
              <Icon name="fas fa-arrow-right" />
            </Button>
          ) : (
            <Button
              type="button"
              className="Button Button--primary"
              loading={this.submitting}
              onclick={this.onsubmit.bind(this)}
            >
              <Icon name="fas fa-network-wired" />
              <span>{this.attrs.deferred ? 'Kaydet' : 'Ağa Aktar'}</span>
            </Button>
          )}
        </div>
      </div>
    );
  }

  prepareStep3() {
    // Hedef sitenin filigranlarını yükle
    const selectedNodes = this.nodes.filter((n) => this.selectedNodes[n.id]);
    selectedNodes.forEach((node) => {
      if (!this.targetWatermarks[node.id]) {
        this.loadWatermarksForNode(node.id);
      }
    });
  }

  // ==========================================
  // ADIM 3: İMZA (WATERMARK) SEÇİMİ
  // ==========================================
  renderStep3(): Mithril.Children {
    const wmAllowKeepSource = app.forum.attribute<boolean>('framioCrosspostWmAllowKeepSource') !== false;
    const wmAllowTargetSite = app.forum.attribute<boolean>('framioCrosspostWmAllowTargetSite') !== false;
    const wmAllowNoWatermark = !!app.forum.attribute<boolean>('framioCrosspostWmAllowNoWatermark');
    const wmAllowCustomUpload = !!app.forum.attribute<boolean>('framioCrosspostWmAllowCustomUpload');

    const selectedNodes = this.nodes.filter((n) => this.selectedNodes[n.id]);
    const firstNode = selectedNodes[0];
    const targetWms = firstNode ? (this.targetWatermarks[firstNode.id] || []) : [];
    const isLoadingWms = firstNode ? !!this.loadingWatermarks[firstNode.id] : false;

    return (
      <div className="CrosspostStep-content">
        <p className="CrosspostModal-desc">
          Aktarılacak <strong>{this.selectedImageCount()} adet görsel</strong> için uygulanacak imza yöntemini seçin.
        </p>

        <div className="CrosspostWmChoiceList">
          {/* 1. Kaynak İmzayı Koru */}
          {wmAllowKeepSource && (
            <div
              className={`CrosspostWmChoiceCard ${this.watermarkMode === 'keep_source' ? 'is-selected' : ''}`}
              onclick={() => { this.watermarkMode = 'keep_source'; }}
            >
              <label>
                <input
                  type="radio"
                  name="wm_mode"
                  checked={this.watermarkMode === 'keep_source'}
                  onchange={() => { this.watermarkMode = 'keep_source'; }}
                />
                <div className="CrosspostWmChoiceCard-info">
                  <div className="CrosspostWmChoiceCard-title">
                    <Icon name="fas fa-image" /> Kaynak Sitedeki İmzayı Koru
                  </div>
                  <div className="CrosspostWmChoiceCard-desc">
                    Fotoğraflar mevcut imzalarıyla olduğu gibi korunarak taşınır.
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* 2. Hedef Sitenin İmzasını Uygula */}
          {wmAllowTargetSite && (
            <div
              className={`CrosspostWmChoiceCard ${this.watermarkMode === 'target_site' ? 'is-selected' : ''}`}
              onclick={() => { this.watermarkMode = 'target_site'; }}
            >
              <label>
                <input
                  type="radio"
                  name="wm_mode"
                  checked={this.watermarkMode === 'target_site'}
                  onchange={() => { this.watermarkMode = 'target_site'; }}
                />
                <div className="CrosspostWmChoiceCard-info">
                  <div className="CrosspostWmChoiceCard-title">
                    <Icon name="fas fa-exchange-alt" /> Hedef Sitenin İmzasını Uygula
                  </div>
                  <div className="CrosspostWmChoiceCard-desc">
                    İmzasız orijinal fotoğraf indirilir ve hedef sitenin imzası basılarak yüklenir.
                  </div>
                </div>
              </label>

              {/* Hedef Sitenin İmzaları: görsel başına önizleme ve yöne göre filtre */}
              {this.watermarkMode === 'target_site' && (
                <div className="CrosspostWmTargetSubList" onclick={(e) => e.stopPropagation()}>
                  {firstNode && this.targetUsernames[firstNode.id] && (
                    <div style="font-size: 12px; color: var(--muted-color, #64748b); margin-bottom: 8px;">
                      <Icon name="fas fa-user-circle" style="margin-right: 5px; color: var(--primary-color, #0ea5e9);" />
                      <strong>@{this.targetUsernames[firstNode.id]}</strong> adına hazırlanmış imza seçenekleri:
                    </div>
                  )}
                  {this.renderWatermarkPicker(firstNode)}
                </div>
              )}
            </div>
          )}

          {/* 3. İmzasız Taşı */}
          {wmAllowNoWatermark && (
            <div
              className={`CrosspostWmChoiceCard ${this.watermarkMode === 'no_watermark' ? 'is-selected' : ''}`}
              onclick={() => { this.watermarkMode = 'no_watermark'; }}
            >
              <label>
                <input
                  type="radio"
                  name="wm_mode"
                  checked={this.watermarkMode === 'no_watermark'}
                  onchange={() => { this.watermarkMode = 'no_watermark'; }}
                />
                <div className="CrosspostWmChoiceCard-info">
                  <div className="CrosspostWmChoiceCard-title">
                    <Icon name="fas fa-ban" /> İmzasız Taşı (Temiz / Orijinal)
                  </div>
                  <div className="CrosspostWmChoiceCard-desc">
                    Fotoğrafların imzasız orijinal halleri doğrudan hedef siteye aktarılır.
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* 4. Kendi İmzanı Yükle */}
          {wmAllowCustomUpload && (
            <div
              className={`CrosspostWmChoiceCard ${this.watermarkMode === 'custom' ? 'is-selected' : ''}`}
              onclick={() => { this.watermarkMode = 'custom'; }}
            >
              <label>
                <input
                  type="radio"
                  name="wm_mode"
                  checked={this.watermarkMode === 'custom'}
                  onchange={() => { this.watermarkMode = 'custom'; }}
                />
                <div className="CrosspostWmChoiceCard-info">
                  <div className="CrosspostWmChoiceCard-title">
                    <Icon name="fas fa-upload" /> Kendi İmzanı Yükle (PNG)
                  </div>
                  <div className="CrosspostWmChoiceCard-desc">
                    Özel bir şeffaf PNG imza dosyası yükleyin ve fotoğraflara bu imza uygulansın.
                  </div>
                </div>
              </label>

              {this.watermarkMode === 'custom' && (
                <div className="CrosspostWmUploadBox" onclick={(e) => e.stopPropagation()}>
                  <input
                    type="file"
                    accept="image/png"
                    onchange={(e: Event) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        this.customWatermarkFileName = file.name;
                        const reader = new FileReader();
                        reader.onload = (re) => {
                          this.customWatermarkBase64 = re.target?.result as string;
                          m.redraw();
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {this.customWatermarkBase64 && (
                    <div className="CrosspostWmUploadPreview">
                      <img src={this.customWatermarkBase64} alt="Özel İmza" />
                      <span>{this.customWatermarkFileName}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tümüne Uygula Checkbox */}
        <div className="CrosspostApplyAllRow">
          <label>
            <input
              type="checkbox"
              checked={this.applyToAll}
              onchange={(e: Event) => {
                this.applyToAll = (e.target as HTMLInputElement).checked;
              }}
            />
            <span>Seçilen imza yöntemini aktarılacak tüm görsellere ({this.selectedImageCount()}) uygula</span>
          </label>
        </div>

        {/* Adım 3 Butonları */}
        <div className="CrosspostModal-actions">
          <Button
            type="button"
            className="Button"
            onclick={() => { this.currentStep = 2; }}
          >
            <Icon name="fas fa-arrow-left" />
            <span>Geri: Konu & Önizleme</span>
          </Button>

          <Button
            type="button"
            className="Button Button--primary"
            loading={this.submitting}
            onclick={this.onsubmit.bind(this)}
          >
            <Icon name="fas fa-network-wired" />
            <span>{this.attrs.deferred ? 'Kaydet' : 'Ağa Aktar (Çapraz Paylaş)'}</span>
          </Button>
        </div>
      </div>
    );
  }

  // ==========================================
  // SONUÇLAR EKRANI
  // ==========================================
  renderResults(): Mithril.Children {
    return (
      <div className="Modal-body CrosspostModal-body">
        <div className="CrosspostModal-results">
          {this.results.map((res, i) => (
            <div
              key={i}
              className={`CrosspostModal-result-item ${res.success ? 'is-success' : 'is-error'}`}
            >
              <div>
                <strong>{res.node}: </strong>
                <span>{res.success ? (res.message || 'Başarılı') : (res.error || 'Hata oluştu')}</span>
              </div>
              {res.url && (
                <a href={res.url} target="_blank" rel="noopener noreferrer">
                  <Icon name="fas fa-external-link-alt" /> {app.translator.trans('framio-network-crosspost.forum.view_crosspost')}
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="CrosspostModal-actions" style="margin-top: 20px;">
          <Button
            type="button"
            className="Button Button--primary"
            onclick={() => { this.hide(); }}
          >
            Kapat
          </Button>
        </div>
      </div>
    );
  }

  onsubmit() {
    const selectedNodeIds = Object.keys(this.selectedNodes).filter((id) => this.selectedNodes[id]);
    if (selectedNodeIds.length === 0) return;

    this.submitting = true;
    this.results = [];

    const discussion = this.attrs.discussion || (this.attrs.post ? (this.attrs.post.discussion() as Discussion) : null);

    const targetUserIds: Record<string, string> = {};
    selectedNodeIds.forEach((nodeId) => {
      if (this.targetUserObjects[nodeId]) {
        targetUserIds[nodeId] = this.targetUserObjects[nodeId]!.id;
      }
    });

    const payload: Record<string, any> = {
      target_nodes: selectedNodeIds,
      target_tags: this.targetTags,
      target_discussion_urls: Object.fromEntries(
        Object.entries(this.targetDiscussionUrls).filter(([id, url]) => url && this.postMode[id] === 'reply')
      ),
      custom_title: this.customTitle,
      custom_description: this.customDescription,
      watermark_mode: this.watermarkMode,
      watermark_id: this.selectedWatermarkId,
      watermark_map: this.watermarkMode === 'target_site' ? this.wmPerImage : {},
      custom_watermark: this.customWatermarkBase64,
      target_usernames: this.targetUsernames,
      target_user_ids: targetUserIds,
    };

    // Seçilen ve sıralanan görseller
    const activeImages = this.extractedImages.filter((img) => !this.isImageExcluded(img));
    payload.ordered_image_urls = activeImages.map((img) => img.url);
    payload.ordered_image_ids = activeImages.filter((img) => img.id).map((img) => img.id);

    // Seçilmeyen görseller
    const excluded = this.extractedImages.map((img, i) => ({ img, i })).filter(({ img }) => this.isImageExcluded(img));
    if (excluded.length) {
      if (this.attrs.deferred) {
        // Henüz kimlik yok: yükleme sırası gönderilir, yayında kimliğe çevrilir
        payload.excluded_image_indexes = excluded.map(({ i }) => i);
      } else {
        payload.excluded_image_ids = excluded.filter(({ img }) => img.id).map(({ img }) => img.id);
        payload.excluded_image_urls = excluded.map(({ img }) => img.url);
      }
    }

    // Ertelenmiş: seçim saklanır, gönderi yayımlanınca aktarılır
    if (this.attrs.deferred) {
      this.submitting = false;
      if (this.attrs.onconfirm) this.attrs.onconfirm(payload);
      app.alerts.show({ type: 'success' }, 'Ortak paylaşım ayarlandı; gönderi yayımlanınca seçilen yerlere aktarılacak.');
      this.hide();
      return;
    }

    if (this.attrs.post) {
      payload.post_id = this.attrs.post.id();
      if (discussion) {
        payload.discussion_id = discussion.id();
      }
    } else if (discussion) {
      payload.discussion_id = discussion.id();
    }

    app.request<{ success: boolean; results: any[] }>({
      method: 'POST',
      url: app.forum.attribute('apiUrl') + '/framio/crosspost/outbound',
      body: payload,
    }).then((resp) => {
      this.submitting = false;
      this.results = resp.results || [];
      app.alerts.show({ type: 'success' }, app.translator.trans('framio-network-crosspost.forum.success_msg'));
      m.redraw();
    }).catch((err) => {
      this.submitting = false;
      app.alerts.show({ type: 'error' }, err.message || 'Gönderim sırasında hata oluştu.');
      m.redraw();
    });
  }
}
