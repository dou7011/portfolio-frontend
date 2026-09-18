import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

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
      ? this.preserveQuillListType(value)
      : marked.parse(value.replace(/\\n/g, '\n'), { async: false, breaks: true });

    return this.sanitizer.sanitize(SecurityContext.HTML, content) ?? '';
  }

  private preserveQuillListType(content: string): string {
    return content.replace(
      /<li\b([^>]*?)\sdata-list=(["'])(ordered|bullet)\2([^>]*)>/gi,
      (_match, before: string, _quote: string, listType: string, after: string) =>
        `<li${before}${after} class="ql-list-${listType}">`,
    );
  }
}