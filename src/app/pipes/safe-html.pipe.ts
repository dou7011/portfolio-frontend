import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

// 直接影片檔（可用原生 <video> 播放）的副檔名
const VIDEO_FILE_EXTENSION_RE = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i;
// 直接圖片檔的副檔名
const IMAGE_FILE_EXTENSION_RE = /\.(jpe?g|png|gif|webp|avif|svg)(\?.*)?$/i;

@Pipe({
  name: 'safeHtml',
  standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';

    const isHtml = /<\/?[a-z][\s\S]*>/i.test(value);
    const content = isHtml
      ? this.preserveQuillFormatting(value)
      : marked.parse(value.replace(/\\n/g, '\n'), { async: false, breaks: true });

    return this.sanitizeWithVideoEmbeds(this.convertBareMediaLinks(content as string));
  }

  private preserveQuillFormatting(content: string): string {
    return this.preserveBlankLines(this.preserveQuillListType(content));
  }

  private preserveQuillListType(content: string): string {
    return content.replace(
      /<(ol|ul)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
      (_match, originalTag: string, attrs: string, items: string) => {
        const normalizedItems = items.replace(
          /<li\b([^>]*?)\sdata-list=(["'])(ordered|bullet)\2([^>]*)>/gi,
          (_liMatch, before: string, _quote: string, listType: string, after: string) =>
            `<li${before}${after} class="ql-list-${listType}">`,
        );
        const listType = /data-list=(['"])bullet\1/i.test(items) ? 'ul' : originalTag.toLowerCase();
        return `<${listType}${attrs}>${normalizedItems}</${listType}>`;
      },
    );
  }

  // Quill 的空白換行會輸出 <p><br></p>，瀏覽器/清理器對空區塊會忽略高度，
  // 這裡改成含 &nbsp; 的內容確保空白行實際佔位並顯示出來。
  private preserveBlankLines(content: string): string {
    return content.replace(/<p>(\s|<br\s*\/?>)*<\/p>/gi, '<p class="ql-blank">&nbsp;</p>');
  }

  // 使用者直接貼上網址時，Quill 會自動轉成 <a href="URL">URL</a> 的純文字連結；
  // 若該網址其實是圖片/影片，這裡改成直接顯示圖片或嵌入播放器，而非單純的文字連結。
  // 只在「連結文字＝網址本身」時才轉換，避免誤動到刻意設定過連結文字的一般超連結。
  private convertBareMediaLinks(content: string): string {
    return content.replace(
      /<a\b([^>]*?)href=(["'])(.*?)\2([^>]*)>\s*\3\s*<\/a>/gi,
      (full: string, _before: string, _quote: string, href: string) => {
        let url: URL;
        try {
          url = new URL(href);
        } catch {
          return full;
        }
        if (url.protocol !== 'https:') return full;

        const embedUrl = this.resolveVideoEmbedUrl(url);
        if (embedUrl) {
          return `<iframe class="ql-video" src="${this.escapeAttr(embedUrl)}"></iframe>`;
        }
        if (VIDEO_FILE_EXTENSION_RE.test(url.pathname)) {
          return `<video class="ql-video-file" controls preload="metadata" src="${this.escapeAttr(url.href)}"></video>`;
        }
        if (IMAGE_FILE_EXTENSION_RE.test(url.pathname)) {
          return `<img src="${this.escapeAttr(url.href)}" alt="" />`;
        }
        return full;
      },
    );
  }

  // Angular 的 HTML 消毒器會整段移除 <iframe>（含 Quill 的影片嵌入），
  // 這裡先把它換成佔位字串、消毒完其餘內文後，再換回白名單網域的安全嵌入標籤，
  // 這樣既能顯示影片，也不會讓任意來源的 iframe 混入頁面。
  // 佔位字串僅能用一般英數字：消毒器內部會把內容跑過瀏覽器的 HTML 剖析/序列化，
  // 控制字元（如 \u0001）在這個過程會被直接拿掉，導致佔位字串比對失敗。
  private sanitizeWithVideoEmbeds(content: string): SafeHtml {
    const token = `qlvideo${Math.random().toString(36).slice(2, 10)}`;
    const embeds: string[] = [];
    const withPlaceholders = content.replace(
      /<iframe\b([^>]*)>\s*<\/iframe>/gi,
      (full: string, attrs: string) => {
        if (!/\bclass=(["'])ql-video\1/i.test(attrs)) return full;
        const srcMatch = attrs.match(/\bsrc=(["'])(.*?)\1/i);
        if (!srcMatch) return '';
        embeds.push(this.buildVideoEmbed(srcMatch[2]));
        return `${token}${embeds.length - 1}end`;
      },
    );

    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, withPlaceholders) ?? '';

    if (embeds.length === 0) return sanitized;

    const restored = sanitized.replace(
      new RegExp(`${token}(\\d+)end`, 'g'),
      (_match, index: string) => embeds[Number(index)] ?? '',
    );
    return this.sanitizer.bypassSecurityTrustHtml(restored);
  }

  private buildVideoEmbed(rawSrc: string): string {
    let url: URL;
    try {
      url = new URL(rawSrc);
    } catch {
      return '';
    }
    if (url.protocol !== 'https:') return '';

    if (VIDEO_FILE_EXTENSION_RE.test(url.pathname)) {
      return `<video class="ql-video-file" controls preload="metadata" src="${this.escapeAttr(url.href)}"></video>`;
    }

    const embedUrl = this.resolveVideoEmbedUrl(url);
    if (embedUrl) {
      return `<iframe class="ql-video" src="${this.escapeAttr(embedUrl)}" frameborder="0" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    }

    // 非白名單網域一律不嵌入，改為可點擊連結
    return `<a class="ql-video-fallback-link" href="${this.escapeAttr(url.href)}" target="_blank" rel="noopener noreferrer">觀看影片 ↗</a>`;
  }

  // 將 YouTube / Vimeo 的各種網址格式（watch、shorts、youtu.be、既有 embed 網址）
  // 正規化成可嵌入 <iframe> 的播放網址；非信任平台一律回傳 null。
  private resolveVideoEmbedUrl(url: URL): string | null {
    return this.toYouTubeEmbedUrl(url) ?? this.toVimeoEmbedUrl(url);
  }

  private toYouTubeEmbedUrl(url: URL): string | null {
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();

    if (host === 'youtu.be') {
      const id = url.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname.startsWith('/embed/')) return url.href;
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (url.pathname.startsWith('/shorts/')) {
        const id = url.pathname.split('/')[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
    }

    return null;
  }

  private toVimeoEmbedUrl(url: URL): string | null {
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();

    if (host === 'player.vimeo.com' && url.pathname.startsWith('/video/')) {
      return url.href;
    }
    if (host === 'vimeo.com') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }

    return null;
  }

  private escapeAttr(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}