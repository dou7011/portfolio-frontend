import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ArticleData } from '../../models/article.interface';
import { Articles } from '../../services/articles.service';

@Component({
  selector: 'app-article-detail',
  imports: [RouterLink],
  templateUrl: './article-detail.html',
  styleUrl: './article-detail.css',
})
export class ArticleDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly articlesService = inject(Articles);

  readonly article = signal<ArticleData | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');

    if (!slug) {
      this.handleError('找不到指定的文章。');
      return;
    }

    this.articlesService.getArticleBySlug(slug).subscribe({
      next: (response) => {
        if (!response.data) {
          this.handleError('找不到指定的文章。');
          return;
        }

        this.article.set(response.data);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load article:', error);
        this.handleError(error.status === 404 ? '找不到指定的文章。' : '文章載入失敗，請稍後再試。');
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

  contentParagraphs(content?: string): string[] {
    return (content || '').split(/\n\s*\n/).filter((paragraph) => paragraph.trim());
  }

  private handleError(message: string): void {
    this.errorMessage.set(message);
    this.isLoading.set(false);
  }

}
