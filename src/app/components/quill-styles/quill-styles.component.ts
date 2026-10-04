import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

// 僅在用到 Quill 內容的頁面載入樣式，避免首頁等頁面下載；snow 已包含 core 規則。
@Component({
  selector: 'app-quill-styles',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  styles: [`@import 'quill/dist/quill.snow.css';`],
  host: { hidden: '' },
  encapsulation: ViewEncapsulation.None,
})
export class QuillStylesComponent {}
