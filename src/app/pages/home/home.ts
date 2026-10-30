import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { retry, timeout } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ArticleData } from '../../models/article.interface';
import { ArticlesService } from '../../services/articles.service';
import { ResumeService } from '../../services/resume.service';
import { RouterLink } from '@angular/router';
import { LoadingIndicatorComponent } from '../../components/loading-indicator/loading-indicator';
import { ContactRevealComponent } from '../../components/contact-reveal/contact-reveal';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, LoadingIndicatorComponent, ContactRevealComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit, AfterViewInit {
  private readonly articlesService = inject(ArticlesService);
  private readonly resumeService = inject(ResumeService);
  private readonly destroyRef = inject(DestroyRef);
  public readonly articles = signal<ArticleData[]>([]);
  public readonly isLoadingArticles = signal(false);
  public readonly resumeData = this.resumeService.resumeData;
  public readonly pageSections = [
    { id: 'top', label: '首頁' },
    { id: 'about', label: '核心能力' },
    { id: 'featured', label: '文章與專案' },
    { id: 'contact', label: '聯絡我' },
  ];
  public readonly activeSection = signal('top');
  public readonly sectionProgress = signal<number[]>([1, 0, 0, 0]);

  ngOnInit(): void {
    document.documentElement.classList.add('home-sections');
    this.destroyRef.onDestroy(() => document.documentElement.classList.remove('home-sections'));
    this.loadFeaturedArticles();
  }

  ngAfterViewInit(): void {
    this.bindRevealAnimation();
    this.bindOrbMotion();
    this.bindCardPointerGlow();
    this.bindSectionTracking();
  }

  public scrollToSection(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  public getExcerpt(article: ArticleData): string {
    const source = article.excerpt?.trim() || article.content || '';
    return source.length > 140 ? `${source.slice(0, 137).trim()}...` : source;
  }

  public getTags(article: ArticleData): string[] {
    return article.tags?.slice(0, 3) ?? [];
  }

  public hasCoverImage(article: ArticleData): boolean {
    return !!article?.cover_image && article.cover_image.trim().length > 0;
  }

  public getCoverImageUrl(article: ArticleData): string {
    return article?.cover_image?.trim() || '';
  }

  private loadFeaturedArticles(): void {
    this.isLoadingArticles.set(true);
    this.articlesService
      .getArticles({ pageSize: 3, is_published: 1 })
      .pipe(
        timeout(8000),
        retry({ count: 2, delay: 500 }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          const items = Array.isArray(res?.data?.data) ? res.data.data : [];
          this.articles.set(items.filter((article) => article?.is_published !== false));
          this.isLoadingArticles.set(false);
          requestAnimationFrame(() => {
            document.querySelectorAll('.reveal').forEach((element) => {
              element.classList.add('is-visible');
            });
            this.bindRevealAnimation();
            this.bindCardPointerGlow();
          });
        },
        error: (err: HttpErrorResponse) => {
          console.error('Failed to load featured articles', err);
          this.isLoadingArticles.set(false);
          this.articles.set([]);
        }
      });
  }

  private bindRevealAnimation(): void {
    const revealElements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px 15% 0px' }
    );

    revealElements.forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.transitionDelay = `${Math.min(index * 40, 160)}ms`;
      observer.observe(htmlElement);
    });

    const ctaBtn = document.querySelector('a[href="#featured"]');
    ctaBtn?.addEventListener('click', (e) => {
      e.preventDefault(); // 阻止預設的瞬間跳轉行為
      const target = document.querySelector('#featured');
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  }

  private bindSectionTracking(): void {
    const sections = this.pageSections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => !!element);
    let frame = 0;

    // 以視窗中線判斷目前所在區塊，用 rAF 節流避免捲動時過度計算
    const update = () => {
      frame = 0;
      const probe = window.innerHeight / 2;
      const current = sections.find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= probe && rect.bottom > probe;
      });
      if (current) {
        this.activeSection.set(current.id);
      }

      // 區塊中心越靠近可視區中心，導覽文字越清晰（1 = 完整顯示，0 = 隱藏）
      const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-header-h')) || 0;
      const viewCenter = (headerHeight + window.innerHeight) / 2;
      this.sectionProgress.set(
        this.pageSections.map((section) => {
          const element = document.getElementById(section.id);
          if (!element) {
            return 0;
          }
          const rect = element.getBoundingClientRect();
          const distance = Math.abs(rect.top + rect.height / 2 - viewCenter);
          const span = Math.max(rect.height, window.innerHeight - headerHeight);
          return Math.round(Math.max(0, 1 - distance / span) * 1000) / 1000;
        })
      );
    };
    const onScroll = () => {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    });
  }

  private bindOrbMotion(): void {
    const orbs = Array.from(document.querySelectorAll<HTMLElement>('.hero-orb'));
    if (!window.matchMedia('(pointer: fine)').matches || !orbs.length) {
      return;
    }

    const onMove = (event: PointerEvent) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      orbs.forEach((orb, i) => {
        const depth = i === 0 ? 40 : -28;
        orb.style.setProperty('--orb-x', `${x * depth}px`);
        orb.style.setProperty('--orb-y', `${y * depth}px`);
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    this.destroyRef.onDestroy(() => window.removeEventListener('pointermove', onMove));
  }

  private bindCardPointerGlow(): void {
    document.querySelectorAll<HTMLElement>('.project-card').forEach((node) => {
      node.onpointermove = (event) => {
        const rect = node.getBoundingClientRect();
        node.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        node.style.setProperty('--my', `${event.clientY - rect.top}px`);
      };
    });
  }
}