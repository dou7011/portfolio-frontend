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
      ? value
      : marked.parse(value.replace(/\\n/g, '\n'), { async: false, breaks: true });

    return this.sanitizer.sanitize(SecurityContext.HTML, content) ?? '';
  }
}