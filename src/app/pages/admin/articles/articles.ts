import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ArticleData } from '../../../models/article.interface';
import { ApiError } from '../../../models/api.interface';
import { ArticlesService } from '../../../services/articles.service';

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './articles.html',
  styleUrl: './articles.css',
})
export class ArticlesComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly articlesService = inject(ArticlesService);
  private tagResizeObserver?: ResizeObserver;

  @ViewChild('tagList') private tagList?: ElementRef<HTMLDivElement>;

  articles: ArticleData[] = [];
  tagOptions: { name: string; count: number }[] = [];
  page = 1;
  totalPages = 1;
  totalCount = 0;
  isLoading = false;
  pageError = '';
  selectedTag = 'all';
  publishedFilter: 'all' | 'published' | 'draft' = 'all';
  isTagsExpanded = false;
  isTagsOverflowing = false;

  ngOnInit(): void {
    this.loadArticles();
  }

  ngAfterViewInit(): void {
    const tagList = this.tagList?.nativeElement;
    if (!tagList) return;

    this.tagResizeObserver = new ResizeObserver(() => this.updateTagOverflow());
    this.tagResizeObserver.observe(tagList);
    requestAnimationFrame(() => this.updateTagOverflow());
  }

  ngOnDestroy(): void {
    this.tagResizeObserver?.disconnect();
  }

  get publishedCount(): number {
    return this.articles.filter((article) => this.isArticlePublished(article.is_published)).length;
  }

  get draftCount(): number {
    return this.articles.filter((article) => !this.isArticlePublished(article.is_published)).length;
  }

  loadArticles(): void {
    this.isLoading = true;
    this.pageError = '';
    const isPublished = this.getPublishedFilterValue();
    this.articlesService.getArticles({
      page: this.page,
      pageSize: 10,
      tag: (this.selectedTag === 'all' ? undefined : this.selectedTag),
      is_published: isPublished,
    }).subscribe({
      next: (response) => {
        const data = response.data;
        this.articles = data?.data ?? [];
        this.totalCount = data?.pagination.totalFiltered ?? 0;
        this.totalPages = data?.pagination.totalPages || 1;
        this.tagOptions = data?.aggregations.tags ?? [];
        this.isLoading = false;
        requestAnimationFrame(() => this.updateTagOverflow());
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load articles:', error);
        this.articles = [];
        this.isLoading = false;
        this.pageError = this.getErrorMessage(error, '載入文章失敗，請稍後再試。');
      },
    });
  }

  changeTag(tag: string): void {
    this.selectedTag = tag;
    this.page = 1;
    this.loadArticles();
  }

  changePublishedFilter(filter: 'all' | 'published' | 'draft'): void {
    this.selectedTag = 'all';
    this.publishedFilter = filter;
    this.page = 1;
    this.loadArticles();
  }

  toggleTags(): void {
    this.isTagsExpanded = !this.isTagsExpanded;
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) return;
    this.page = page;
    this.loadArticles();
  }

  deleteArticle(id: number): void {
    const article = this.articles.find((item) => item.id === id);
    if (!article || !window.confirm(`確定要刪除文章「${article.title}」嗎？`)) {
      return;
    }

    this.pageError = '';
    this.articlesService.deleteArticle(id).subscribe({
      next: () => {
        this.loadArticles();
      },
      error: (error: HttpErrorResponse) => {
        this.pageError = this.getErrorMessage(error, '刪除文章失敗，請稍後再試。');
      },
    });
  }

  formatDate(value?: string): string {
    if (!value) return '尚未發布';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '尚未發布' : date.toLocaleDateString('zh-TW');
  }

  isArticlePublished(value?: boolean | number | string | null): boolean {
    return value === true || value === 1 || value === '1';
  }

  private getPublishedFilterValue(): number | undefined {
    if (this.publishedFilter === 'all') return undefined;
    return this.publishedFilter === 'published' ? 1 : 0;
  }

  private getErrorMessage(error: HttpErrorResponse, fallback: string): string {
    return (error.error as ApiError | undefined)?.message ?? fallback;
  }

  private updateTagOverflow(): void {
    // 展開時容器已無裁切，維持現狀避免誤判
    if (this.isTagsExpanded) return;

    const tagList = this.tagList?.nativeElement;
    if (!tagList) return;

    this.isTagsOverflowing = tagList.scrollHeight > tagList.clientHeight + 1;
  }
}
