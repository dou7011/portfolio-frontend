import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuillModule } from 'ngx-quill';
import { ApiError } from '../../../models/api.interface';
import { ArticleData } from '../../../models/article.interface';
import { ArticlesService } from '../../../services/articles.service';
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
  readonly errorMessage = signal('');
  readonly categoryOptions = signal<string[]>(['blog', 'portfolio']);
  readonly isCustomType = signal(false);
  customType = '';

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

  saveArticle(): void {
    if (!this.form.slug.trim() || !this.form.title.trim() || !this.form.content.trim()) {
      this.errorMessage.set('請填寫 slug、標題與文章內容。');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const payload: ArticleData = {
      slug: this.form.slug.trim(),
      title: this.form.title.trim(),
      type: this.form.type.trim() || 'blog',
      cover_image: this.form.cover_image.trim() || undefined,
      excerpt: this.form.excerpt.trim() || undefined,
      content: this.form.content,
      tags: this.parseTags(this.form.tags),
      github_url: this.form.github_url.trim() || undefined,
      demo_url: this.form.demo_url.trim() || undefined,
      is_published: this.form.is_published,
    };

    const request =
      this.mode() === 'edit' && this.articleId() !== null
        ? this.articlesService.updateArticle(this.articleId()!, payload)
        : this.articlesService.createArticle(payload);

    request.subscribe({
      next: (response) => {
        const savedArticle = response.data ?? payload;
        const isNewArticle = this.mode() === 'new';
        this.isSaving.set(false);
        this.toastService.show(isNewArticle ? '文章已成功新增。' : '文章已成功更新。', 'success', isNewArticle ? '新增成功' : '更新成功');
        this.router.navigate(['/admin/articles']);
      },
      error: (error: HttpErrorResponse) => {
        const apiError = error.error as ApiError | undefined;
        this.errorMessage.set(apiError?.message ?? '儲存失敗，請稍後再試。');
        this.isSaving.set(false);
      },
    });
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
}
