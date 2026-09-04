import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ArticleData } from '../../models/article.interface';
import { Articles } from '../../services/articles.service';

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [],
  templateUrl: './articles.html',
  styleUrl: './articles.css',
})
export class ArticlesComponent {
  private readonly articlesService = inject(Articles);

  readonly articles = signal<ArticleData[]>([]);
  readonly typeOptions = signal<{ name: string; count: number }[]>([{ name: 'all', count: 0 }]);
  readonly tagOptions = signal<{ name: string; count: number }[]>([{ name: 'all', count: 0 }]);
  readonly selectedType = signal('all');
  readonly selectedTag = signal('all');
  readonly startDate = signal('');
  readonly endDate = signal('');
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly totalCount = signal(0);
  readonly isLoading = signal(false);
  readonly isTypesExpanded = signal(false);
  readonly isTagsExpanded = signal(false);

  ngOnInit(): void {
    this.loadArticles();
  }

  toggleTypes(): void {
    this.isTypesExpanded.update((value) => !value);
    // 展開時加入面板內部微捲動
    if (this.isTypesExpanded()) {
      requestAnimationFrame(() => {
        const panel = document.querySelector('.glass-panel-content');
        if (panel) panel.scrollBy({ top: 180, behavior: 'smooth' });
      });
    }
  }

  toggleTags(): void {
    this.isTagsExpanded.update((value) => !value);
    // 展開時直接捲動到底部
    if (this.isTagsExpanded()) {
      requestAnimationFrame(() => {
        const panel = document.querySelector('.glass-panel-content');
        if (panel) panel.scrollTo({ top: panel.scrollHeight, behavior: 'smooth' });
      });
    }
  }

  changeType(type: string): void {
    this.selectedType.set(type);
    this.selectedTag.set('all');
    this.page.set(1);
    this.scrollToResults();
    this.loadArticles();
  }

  changeTag(tag: string): void {
    this.selectedTag.set(tag);
    this.page.set(1);
    this.scrollToResults();
    this.loadArticles();
  }

  changeDate(boundary: 'start' | 'end', value: string): void {
    if (boundary === 'start') {
      this.startDate.set(value);
    } else {
      this.endDate.set(value);
    }

    this.selectedTag.set('all');
    this.page.set(1);
    this.scrollToResults();
    this.loadArticles();
  }

  openDatePicker(input: HTMLInputElement): void {
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch {
        // Fallback for browsers blocking showPicker
      }
    }
    input.focus();
    input.click();
  }

  clearDateRange(): void {
    if (!this.startDate() && !this.endDate()) {
      return;
    }

    this.startDate.set('');
    this.endDate.set('');
    this.page.set(1);
    this.scrollToResults();
    this.loadArticles();
  }

  formatFilterDate(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.page.set(page);
    this.scrollToResults();
    this.loadArticles();
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
      date.getDate(),
    ).padStart(2, '0')}`;
  }

  getFallbackType(article: ArticleData): string {
    return article.type || 'PROJECT';
  }

  private loadArticles(): void {
    this.isLoading.set(true);

    this.articlesService
    .getArticles({
      page: this.page(),
      pageSize: 10,
      type: this.selectedType() === 'all' ? undefined : this.selectedType(),
      tag: this.selectedTag() === 'all' ? undefined : this.selectedTag(),
      startTime: this.toStartTime(this.startDate()),
      endTime: this.toEndTime(this.endDate()),
    })
    .subscribe({
      next: (response) => {
        const responseData = response?.data;
        if (!responseData) {
          this.handleLoadError();
          return;
        }

        const { data: items, pagination, aggregations } = responseData;

        this.articles.set(items);
        this.totalPages.set(pagination.totalPages > 0 ? pagination.totalPages : 1);
        
        // 1. 頂部「文章庫 X 篇結果」：綁定實際過濾後的結果
        this.totalCount.set(pagination.totalFiltered); 

        // 2. 左側「全部文章」：綁定不受 Type/Tag 影響的日期總數
        const allTypes = [
          { name: 'all', count: aggregations.totalCategories },
          ...aggregations.categories
        ];

        // 3. 左側「All 標籤」：綁定不受 Tag 影響的分類/日期總數
        const allTags = [
          { name: 'all', count: aggregations.totalTags },
          ...aggregations.tags
        ];

        this.typeOptions.set(allTypes);
        this.tagOptions.set(allTags);
        
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load articles:', error);
        this.handleLoadError();
      },
    });
  }

  private handleLoadError(): void {
    this.articles.set([]);
    this.totalPages.set(1);
    this.isLoading.set(false);
  }

  private scrollToResults(): void {
    const layout = document.querySelector('.layout-wrapper');
    if (!layout) {
      return;
    }

    const sidebar = document.querySelector('.sidebar');
    const sidebarTop = sidebar ? Number.parseFloat(getComputedStyle(sidebar).top) : Number.NaN;
    const offset = Number.isFinite(sidebarTop) ? sidebarTop : 24;
    const top = layout.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
  }

  private toStartTime(value: string): string | undefined {
    return value ? `${value}T00:00:00.000Z` : undefined;
  }

  private toEndTime(value: string): string | undefined {
    return value ? `${value}T23:59:59.999Z` : undefined;
  }
}
