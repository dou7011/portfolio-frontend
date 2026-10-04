import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  ViewChild,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { EMPTY, catchError, retry, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timeout } from 'rxjs';
import { ArticleData } from '../../models/article.interface';
import { ArticlesService } from '../../services/articles.service';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { QuillStylesComponent } from '../../components/quill-styles/quill-styles.component';
import { LoadingIndicatorComponent } from '../../components/loading-indicator/loading-indicator';

interface TocItem {
  id: string;
  text: string;
  level: number;
  weight: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

export function collectTocItems(container: HTMLElement): TocItem[] {
  const headings = Array.from(container.querySelectorAll<HTMLElement>('h1'));
  const usedIds = new Set<string>();

  return headings.map((heading, index) => {
    const level = Number(heading.tagName.charAt(1));
    const text = heading.textContent?.trim() ?? `章節 ${index + 1}`;
    const baseId = slugify(text) || `section-${index + 1}`;

    let id = baseId;
    let suffix = 1;
    while (usedIds.has(id)) {
      id = `${baseId}-${suffix++}`;
    }
    usedIds.add(id);
    heading.id = id;

    let node: Node | null = heading.nextSibling;
    const nextHeading = headings[index + 1];
    let charCount = 0;
    while (node && node !== nextHeading) {
      charCount += (node.textContent ?? '').length;
      node = node.nextSibling;
    }

    return { id, text, level, weight: Math.max(charCount, 40) };
  });
}

@Component({
  selector: 'app-article-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SafeHtmlPipe, QuillStylesComponent, LoadingIndicatorComponent],
  templateUrl: './article-detail.html',
  styleUrl: './article-detail.css',
})
export class ArticleDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly articlesService = inject(ArticlesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  @ViewChild('articleBody') private readonly articleBodyRef?: ElementRef<HTMLDivElement>;
  @ViewChild('galleryThumbTrack') private readonly galleryThumbTrackRef?: ElementRef<HTMLDivElement>;

  readonly article = signal<ArticleData | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly errorType = signal<'not-found' | 'load-error'>('not-found');

  readonly galleryImages = computed(() => this.article()?.galleryImages ?? []);
  readonly activeGalleryIndex = signal(0);
  private touchStartX = 0;

  readonly tocItems = signal<TocItem[]>([]);
  readonly activeTocIndex = signal(0);
  readonly tocProgress = signal<number[]>([]);

  private headingEls: HTMLElement[] = [];
  private sectionStarts: number[] = [];
  private sectionEnds: number[] = [];
  private contentResizeObserver?: ResizeObserver;
  private scrollFrame = 0;
  private readonly onScroll = () => {
    if (this.scrollFrame) return;
    this.scrollFrame = requestAnimationFrame(() => {
      this.scrollFrame = 0;
      this.updateProgress();
    });
  };
  private readonly onResize = () => {
    this.measureSections();
    this.updateProgress();
  };

  constructor() {
    const defaultTitle = this.titleService.getTitle();
    const defaultDescription = this.metaService.getTag('name="description"')?.content ?? '';
    const defaultOgTitle = this.metaService.getTag('property="og:title"')?.content ?? '';
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize, { passive: true });
    this.destroyRef.onDestroy(() => {
      this.titleService.setTitle(defaultTitle);
      this.metaService.updateTag({ name: 'description', content: defaultDescription });
      this.metaService.updateTag({ property: 'og:title', content: defaultOgTitle });
      this.metaService.updateTag({ property: 'og:description', content: defaultDescription });
      this.metaService.updateTag({ property: 'og:type', content: 'website' });
      this.metaService.removeTag('property="og:image"');
      window.removeEventListener('scroll', this.onScroll);
      cancelAnimationFrame(this.scrollFrame);
      window.removeEventListener('resize', this.onResize);
      this.contentResizeObserver?.disconnect();
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap((params) => {
        const slug = params.get('slug');
        this.article.set(null);
        this.isLoading.set(true);
        this.errorMessage.set('');
        this.errorType.set('not-found');
        this.tocItems.set([]);
        this.tocProgress.set([]);
        this.activeTocIndex.set(0);
        this.activeGalleryIndex.set(0);
        this.headingEls = [];
        this.sectionStarts = [];
        this.sectionEnds = [];

        if (!slug) {
          this.handleError('找不到指定的文章。', 'not-found');
          return EMPTY;
        }

        return this.articlesService.getArticleBySlug(slug).pipe(
          timeout(8000),
          retry({ count: 2, delay: 500 }),
          catchError((error: HttpErrorResponse) => {
            console.error('Failed to load article:', error);
            this.handleError(
              error.status === 404 ? '找不到指定的文章。' : '文章載入失敗，請稍後再試。',
              error.status === 404 ? 'not-found' : 'load-error',
            );
            return EMPTY;
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (response) => {
        if (!response.data) {
          this.handleError('找不到指定的文章。', 'not-found');
          return;
        }

        this.article.set(response.data);
        this.updateSeoMeta(response.data);
        this.activeGalleryIndex.set(0);
        this.isLoading.set(false);
        // 等內文的 innerHTML 實際渲染完成後再掃描標題，避免抓不到剛插入的節點
        afterNextRender(() => this.buildToc(), { injector: this.injector });
      },
    });
  }

  scrollToHeading(id: string, event: Event): void {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setActiveGalleryImage(index: number): void {
    if (index < 0 || index >= this.galleryImages().length) return;
    this.activeGalleryIndex.set(index);
    this.scrollActiveThumbIntoView(index);
  }

  showPrevGalleryImage(): void {
    const total = this.galleryImages().length;
    if (!total) return;
    this.setActiveGalleryImage((this.activeGalleryIndex() - 1 + total) % total);
  }

  showNextGalleryImage(): void {
    const total = this.galleryImages().length;
    if (!total) return;
    this.setActiveGalleryImage((this.activeGalleryIndex() + 1) % total);
  }

  onGalleryTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0]?.clientX ?? 0;
  }

  // 左右滑動切換上一張／下一張，滑動距離需超過門檻才視為有效手勢
  onGalleryTouchEnd(event: TouchEvent): void {
    const endX = event.changedTouches[0]?.clientX ?? this.touchStartX;
    const deltaX = endX - this.touchStartX;
    if (Math.abs(deltaX) < 40) return;

    if (deltaX < 0) {
      this.showNextGalleryImage();
    } else {
      this.showPrevGalleryImage();
    }
  }

  private scrollActiveThumbIntoView(index: number): void {
    const track = this.galleryThumbTrackRef?.nativeElement;
    const thumb = track?.children[index] as HTMLElement | undefined;
    thumb?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  private buildToc(): void {
    const container = this.articleBodyRef?.nativeElement;
    if (!container) {
      this.tocItems.set([]);
      return;
    }

    const items = collectTocItems(container);
    const headings = Array.from(container.querySelectorAll<HTMLElement>('h1'));

    this.headingEls = headings;
    this.tocItems.set(items);
    this.tocProgress.set(items.map(() => 0));
    this.activeTocIndex.set(0);

    if (!items.length) return;

    this.measureSections();
    this.updateProgress();

    // 內文圖片是非同步載入,高度會在渲染後才變動,需監聽容器尺寸變化重新量測區間
    this.contentResizeObserver?.disconnect();
    this.contentResizeObserver = new ResizeObserver(() => {
      this.measureSections();
      this.updateProgress();
    });
    this.contentResizeObserver.observe(container);
  }

  private measureSections(): void {
    const container = this.articleBodyRef?.nativeElement;
    if (!container || !this.headingEls.length) return;

    this.sectionStarts = this.headingEls.map((el) => el.getBoundingClientRect().top + window.scrollY);
    const containerBottom = container.getBoundingClientRect().bottom + window.scrollY;
    this.sectionEnds = this.sectionStarts.map((start, index) =>
      index < this.sectionStarts.length - 1 ? this.sectionStarts[index + 1] : containerBottom,
    );
  }

  private updateProgress(): void {
    if (!this.sectionStarts.length) return;

    // 捲到底時強制填滿，避免內容底部離最大捲動距離太近而永遠補不到 100%
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const isAtBottom = window.scrollY >= maxScroll - 4;

    if (isAtBottom) {
      this.tocProgress.set(this.sectionStarts.map(() => 1));
      this.activeTocIndex.set(this.sectionStarts.length - 1);
      return;
    }

    const readLine = window.scrollY + 140;
    let activeIndex = 0;

    const progress = this.sectionStarts.map((start, index) => {
      const end = this.sectionEnds[index];
      const length = Math.max(end - start, 1);

      if (readLine <= start) return 0;
      if (readLine >= end) {
        activeIndex = index;
        return 1;
      }

      activeIndex = index;
      return (readLine - start) / length;
    });

    this.tocProgress.set(progress);
    this.activeTocIndex.set(activeIndex);
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

  private updateSeoMeta(article: ArticleData): void {
    const title = `${article.title} | Ho-Tai's Portfolio`;
    const plainContent = (article.content ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const description = (article.excerpt?.trim() || plainContent).slice(0, 160);

    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:type', content: 'article' });
    if (article.cover_image?.trim()) {
      this.metaService.updateTag({ property: 'og:image', content: article.cover_image.trim() });
    }
  }

}
