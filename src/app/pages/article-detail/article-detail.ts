import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { retry } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timeout } from 'rxjs';
import { ArticleData } from '../../models/article.interface';
import { ArticlesService } from '../../services/articles.service';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

@Component({
  selector: 'app-article-detail',
  imports: [RouterLink, SafeHtmlPipe],
  templateUrl: './article-detail.html',
  styleUrl: './article-detail.css',
})
export class ArticleDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly articlesService = inject(ArticlesService);
  private readonly destroyRef = inject(DestroyRef);

  readonly article = signal<ArticleData | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly errorType = signal<'not-found' | 'load-error'>('not-found');

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');

    if (!slug) {
      this.handleError('找不到指定的文章。', 'not-found');
      return;
    }

    this.articlesService.getArticleBySlug(slug).pipe(
      timeout(8000),
      retry({ count: 2, delay: 500 }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (response) => {
        if (!response.data) {
          this.handleError('找不到指定的文章。', 'not-found');
          return;
        }

        this.article.set(response.data);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load article:', error);
        this.handleError(
          error.status === 404 ? '找不到指定的文章。' : '文章載入失敗，請稍後再試。',
          error.status === 404 ? 'not-found' : 'load-error',
        );
      },
    });
  }

  formatDate(value?: string | null): string {
    if (!value) return '未設定日期';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '未設定日期';

    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(date);
  }

  private handleError(message: string, type: 'not-found' | 'load-error'): void {
    this.errorMessage.set(message);
    this.errorType.set(type);
    this.isLoading.set(false);
  }

}
