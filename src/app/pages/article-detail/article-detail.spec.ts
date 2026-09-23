import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { collectTocItems } from './article-detail';

describe('ArticleDetailComponent', () => {
  it('should only include h1 headings in the toc', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <h1>大標題</h1>
      <p>正文</p>
      <h2>副標題</h2>
      <h3>次標題</h3>
      <h1>第二個大標題</h1>
    `;

    const items = collectTocItems(container);

    expect(items.map((item) => item.text)).toEqual([
      '大標題',
      '第二個大標題',
    ]);
  });
});
