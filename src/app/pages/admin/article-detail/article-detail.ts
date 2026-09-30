import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuillModule } from 'ngx-quill';
import { firstValueFrom } from 'rxjs';
import { ApiError } from '../../../models/api.interface';
import { ArticleData, GalleryImage } from '../../../models/article.interface';
import { ArticlesService } from '../../../services/articles.service';
import { UploadService } from '../../../services/upload.service';
import { ToastService } from '../../../services/toast.service';

interface ArticleFormModel {
  slug: string;
  title: string;
  type: string;
  cover_image: string;
  excerpt: string;
  content: string;
  tags: string;
  github_url: string;
  demo_url: string;
  is_published: boolean;
}

// 圖片集在畫面上的工作狀態：尚未上傳時保留本地檔案與預覽網址
interface GalleryImageItem {
  localId: string;
  url: string;
  label: string;
  file: File | null;
  previewUrl: string;
}

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule, RouterLink],
  templateUrl: './article-detail.html',
  styleUrl: './article-detail.css',
})
export class ArticleDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly articlesService = inject(ArticlesService);
  private readonly toastService = inject(ToastService);

  readonly mode = signal<'new' | 'edit'>('new');
  readonly articleId = signal<number | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly savingStatusText = signal('儲存中...');
  readonly pendingCoverFile = signal<File | null>(null);
  readonly coverImagePreviewUrl = signal('');
  readonly galleryImages = signal<GalleryImageItem[]>([]);
  readonly draggingGalleryIndex = signal<number | null>(null);
  readonly errorMessage = signal('');
  readonly categoryOptions = signal<string[]>(['blog', 'portfolio']);
  readonly isCustomType = signal(false);
  customType = '';

  private uploadService = inject(UploadService);
  private quillInstance: any;

  readonly customTypeValue = '__custom__';

  form: ArticleFormModel = {
    slug: '',
    title: '',
    type: 'blog',
    cover_image: '',
    excerpt: '',
    content: '',
    tags: '',
    github_url: '',
    demo_url: '',
    is_published: false,
  };

  editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ header: 1 }, { header: 2 }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ direction: 'rtl' }],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ align: [] }],
      ['link', 'image', 'video'],
      ['clean'],
    ],
    handlers: {
      image: () => this.customImageHandler()
    }
  };

  ngOnInit(): void {
    this.loadCategoryOptions();

    const slug = this.route.snapshot.paramMap.get('slug');
    const isNewMode = this.route.snapshot.routeConfig?.path === 'new' || this.router.url.endsWith('/new');

    if (isNewMode || !slug) {
      this.mode.set('new');
      this.isLoading.set(false);
      return;
    }

    this.mode.set('edit');
    this.loadArticle(slug);
  }

  loadCategoryOptions(): void {
    this.articlesService.getArticles({ pageSize: 1 }).subscribe({
      next: (response) => {
        const names = response.data?.aggregations?.categories?.map((category) => category.name) ?? [];
        const merged = Array.from(new Set(['blog', 'portfolio', ...names])).filter(Boolean);
        this.categoryOptions.set(merged);
        this.syncCustomTypeState();
      },
      error: () => {
        // 取分類清單失敗時，維持預設的 blog / portfolio 選項
      },
    });
  }

  onTypeSelectChange(value: string): void {
    if (value === this.customTypeValue) {
      this.isCustomType.set(true);
      this.customType = this.form.type && !this.categoryOptions().includes(this.form.type) ? this.form.type : '';
      this.form.type = this.customType;
      return;
    }

    this.isCustomType.set(false);
    this.form.type = value;
  }

  onCustomTypeInput(value: string): void {
    this.customType = value;
    this.form.type = value;
  }

  private syncCustomTypeState(): void {
    if (this.form.type && !this.categoryOptions().includes(this.form.type)) {
      this.isCustomType.set(true);
      this.customType = this.form.type;
    }
  }

  loadArticle(slug: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.articlesService.getArticleBySlug(slug, true).subscribe({
      next: (response) => {
        const article = response.data;
        if (!article) {
          this.errorMessage.set('找不到要編輯的文章。');
          this.isLoading.set(false);
          return;
        }

        this.articleId.set(article.id ?? null);
        this.form = {
          slug: article.slug ?? '',
          title: article.title ?? '',
          type: article.type ?? 'blog',
          cover_image: article.cover_image ?? '',
          excerpt: article.excerpt ?? '',
          content: article.content ?? '',
          tags: Array.isArray(article.tags) ? article.tags.join(', ') : '',
          github_url: article.github_url ?? '',
          demo_url: article.demo_url ?? '',
          is_published: Boolean(article.is_published),
        };
        this.galleryImages.set(
          (Array.isArray(article.galleryImages) ? article.galleryImages : []).map((image) => ({
            localId: crypto.randomUUID(),
            url: image.url,
            label: image.label ?? '',
            file: null,
            previewUrl: '',
          })),
        );
        this.syncCustomTypeState();
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        const apiError = error.error as ApiError | undefined;
        this.errorMessage.set(apiError?.message ?? '文章載入失敗，請稍後再試。');
        this.isLoading.set(false);
      },
    });
  }

  private normalizeEditorContent(value: unknown): string {
    if (this.quillInstance?.getSemanticHTML) {
      const html = this.quillInstance.getSemanticHTML();
      if (typeof html === 'string') {
        return html;
      }
    }

    if (this.quillInstance?.root?.innerHTML) {
      return this.quillInstance.root.innerHTML;
    }

    return typeof value === 'string' ? value : '';
  }

  async saveArticle(): Promise<void> {
    this.errorMessage.set('');
    this.isSaving.set(true);
    this.savingStatusText.set('圖片上傳中...');

    let normalizedContent = this.normalizeEditorContent(this.form.content);
    let uploadedGalleryImages: GalleryImage[] = [];

    try {
      normalizedContent = await this.uploadEmbeddedImages(normalizedContent);
      await this.uploadPendingCoverImage();
      uploadedGalleryImages = await this.uploadPendingGalleryImages();
    } catch (error) {
      console.error('圖片上傳失敗', error);
      this.errorMessage.set('圖片上傳失敗，請稍後再試。');
      this.isSaving.set(false);
      return;
    }

    this.form.content = normalizedContent;

    if (!this.form.slug.trim() || !this.form.title.trim() || !normalizedContent.trim()) {
      this.errorMessage.set('請填寫 slug、標題與文章內容。');
      this.isSaving.set(false);
      return;
    }

    const lengthErrors: string[] = [];
    if (this.form.slug.trim().length > 100) lengthErrors.push('slug 不得超過 100 字元');
    if (this.form.title.length > 200) lengthErrors.push('標題不得超過 200 字元');
    if (this.form.type.trim().length > 50) lengthErrors.push('分類不得超過 50 字元');
    if (normalizedContent.length > 100_000) lengthErrors.push('文章內容不得超過 100,000 字元');
    if (this.form.cover_image.trim().length > 255) lengthErrors.push('封面圖片 URL 不得超過 255 字元');
    if (this.form.excerpt.length > 2_000) lengthErrors.push('摘要不得超過 2,000 字元');
    if (this.form.github_url.trim().length > 255) lengthErrors.push('GitHub URL 不得超過 255 字元');
    if (this.form.demo_url.trim().length > 255) lengthErrors.push('Demo URL 不得超過 255 字元');
    if (uploadedGalleryImages.some((image) => (image.label?.length ?? 0) > 200)) {
      lengthErrors.push('圖片集標籤不得超過 200 字元');
    }

    if (lengthErrors.length > 0) {
      this.errorMessage.set(lengthErrors[0]);
      this.isSaving.set(false);
      return;
    }

    this.savingStatusText.set(this.mode() === 'new' ? '文章建立中...' : '文章更新中...');

    const payload: ArticleData = {
      slug: this.form.slug.trim(),
      title: this.form.title.trim(),
      type: this.form.type.trim() || 'blog',
      cover_image: this.form.cover_image.trim() || undefined,
      excerpt: this.form.excerpt.trim() || undefined,
      content: normalizedContent,
      tags: this.parseTags(this.form.tags),
      github_url: this.form.github_url.trim() || undefined,
      demo_url: this.form.demo_url.trim() || undefined,
      is_published: this.form.is_published,
      galleryImages: uploadedGalleryImages,
    };

    const wasNewArticle = this.mode() === 'new';
    const request =
      this.mode() === 'edit' && this.articleId() !== null
        ? this.articlesService.updateArticle(this.articleId()!, payload)
        : this.articlesService.createArticle(payload);

    request.subscribe({
      next: (response) => {
        const savedArticle = response.data ?? payload;
        this.isSaving.set(false);
        this.toastService.show(wasNewArticle ? '文章已成功新增。' : '文章已成功更新。', 'success', wasNewArticle ? '新增成功' : '更新成功');

        // 建立成功後切換為編輯模式並更新網址，但停留在同一篇文章而非返回列表
        if (wasNewArticle && savedArticle.id != null) {
          this.mode.set('edit');
          this.articleId.set(savedArticle.id);
          this.router.navigate(['/admin/articles', savedArticle.slug, 'edit'], { replaceUrl: true });
        }
      },
      error: (error: HttpErrorResponse) => {
        const apiError = error.error as ApiError | undefined;
        this.errorMessage.set(apiError?.message ?? '儲存失敗，請稍後再試。');
        this.isSaving.set(false);
      },
    });
  }

  private async uploadEmbeddedImages(content: string): Promise<string> {
    const document = new DOMParser().parseFromString(content, 'text/html');
    const embeddedImages = Array.from(document.querySelectorAll('img[src^="data:image/"]'));

    for (const image of embeddedImages) {
      const source = image.getAttribute('src');
      if (!source) continue;

      const blob = await fetch(source).then((response) => response.blob());
      const extension = blob.type.split('/')[1]?.split(';')[0] || 'png';
      const result = await firstValueFrom(
        this.uploadService.uploadImage(new File([blob], `embedded-image.${extension}`, { type: blob.type })),
      );
      const imageUrl = result.data?.url;
      if (!imageUrl) throw new Error('圖片上傳回應缺少 URL');
      image.setAttribute('src', imageUrl);
    }

    return document.body.innerHTML;
  }

  onCoverImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (this.coverImagePreviewUrl()) {
      URL.revokeObjectURL(this.coverImagePreviewUrl());
    }

    this.errorMessage.set('');
    this.pendingCoverFile.set(file);
    this.coverImagePreviewUrl.set(URL.createObjectURL(file));
    input.value = '';
  }

  // 封面圖片實際上傳延後到儲存文章時才執行
  private async uploadPendingCoverImage(): Promise<void> {
    const file = this.pendingCoverFile();
    if (!file) return;

    const result = await firstValueFrom(this.uploadService.uploadImage(file));
    const imageUrl = result.data?.url;
    if (!imageUrl) throw new Error('封面圖片上傳回應缺少 URL');

    this.form.cover_image = imageUrl;
    this.pendingCoverFile.set(null);
    if (this.coverImagePreviewUrl()) {
      URL.revokeObjectURL(this.coverImagePreviewUrl());
      this.coverImagePreviewUrl.set('');
    }
  }

  // 圖片集：選擇檔案後先建立本地預覽，實際上傳延後到儲存文章時才執行
  onGalleryFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (files.length === 0) return;

    this.errorMessage.set('');
    const newItems: GalleryImageItem[] = files.map((file) => ({
      localId: crypto.randomUUID(),
      url: '',
      label: '',
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    this.galleryImages.update((items) => [...items, ...newItems]);
    input.value = '';
  }

  removeGalleryImage(localId: string): void {
    const target = this.galleryImages().find((image) => image.localId === localId);
    if (target?.previewUrl) {
      URL.revokeObjectURL(target.previewUrl);
    }
    this.galleryImages.update((items) => items.filter((image) => image.localId !== localId));
  }

  moveGalleryImage(index: number, direction: -1 | 1): void {
    const items = [...this.galleryImages()];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
    this.galleryImages.set(items);
  }

  onGalleryDragStart(index: number, event: DragEvent): void {
    this.draggingGalleryIndex.set(index);
    event.dataTransfer?.setData('text/plain', String(index));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  // 拖曳經過其他圖片時即時交換位置，放開時的順序就是最終排序
  onGalleryDragOver(index: number, event: DragEvent): void {
    event.preventDefault();
    const fromIndex = this.draggingGalleryIndex();
    if (fromIndex === null || fromIndex === index) return;

    const items = [...this.galleryImages()];
    const [moved] = items.splice(fromIndex, 1);
    items.splice(index, 0, moved);
    this.galleryImages.set(items);
    this.draggingGalleryIndex.set(index);
  }

  onGalleryDrop(event: DragEvent): void {
    event.preventDefault();
  }

  onGalleryDragEnd(): void {
    this.draggingGalleryIndex.set(null);
  }

  private async uploadPendingGalleryImages(): Promise<GalleryImage[]> {
    const items = this.galleryImages();
    const uploaded: GalleryImage[] = [];

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (item.file) {
        const result = await firstValueFrom(this.uploadService.uploadImage(item.file));
        const imageUrl = result.data?.url;
        if (!imageUrl) throw new Error('圖片集上傳回應缺少 URL');

        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
        item.url = imageUrl;
        item.file = null;
        item.previewUrl = '';
      }

      uploaded.push({ url: item.url, label: item.label.trim() || undefined, sort_order: index });
    }

    this.galleryImages.set([...items]);
    return uploaded;
  }

  cancel(): void {
    this.router.navigate(['/admin/articles']);
  }

  openPreview(): void {
    const slug = this.form.slug.trim();
    if (!slug) {
      this.errorMessage.set('請先填寫 slug 才能預覽文章。');
      return;
    }

    window.open(`/articles/${encodeURIComponent(slug)}`, '_blank', 'noopener');
  }

  private parseTags(value: string): string[] {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  onEditorCreated(editorInstance: any) {
    this.quillInstance = editorInstance;
  }

  customImageHandler() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file || !this.quillInstance) return;

      // 先以本地預覽插入內文，實際上傳延後到儲存文章時才執行
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        if (typeof dataUrl !== 'string') return;

        const range = this.quillInstance.getSelection(true);
        this.quillInstance.insertEmbed(range.index, 'image', dataUrl);
        this.quillInstance.setSelection(range.index + 1);
      };
      reader.onerror = () => {
        this.toastService.show('圖片讀取失敗，請重新選擇圖片', 'error');
      };
      reader.readAsDataURL(file);
    };
  }
}
