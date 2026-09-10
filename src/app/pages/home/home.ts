import { AfterViewInit, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { retry, timeout } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ArticleData } from '../../models/article.interface';
import { ArticlesService } from '../../services/articles.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit, AfterViewInit {
  private readonly articlesService = inject(ArticlesService);
  private readonly destroyRef = inject(DestroyRef);
  public readonly articles = signal<ArticleData[]>([]);
  public readonly isLoadingArticles = signal(false);

  ngOnInit(): void {
    this.loadFeaturedArticles();
  }

  ngAfterViewInit(): void {
    this.bindRevealAnimation();
    this.bindOrbMotion();
    this.bindCardPointerGlow();
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
      { threshold: 0.12 }
    );

    revealElements.forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.transitionDelay = `${Math.min(index * 55, 280)}ms`;
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

  private bindOrbMotion(): void {
    const orb = document.querySelector('.hero-orb') as HTMLElement | null;
    if (window.matchMedia('(pointer: fine)').matches && orb) {
      window.addEventListener(
        'pointermove',
        (event) => {
          const x = (event.clientX / window.innerWidth - 0.5) * 28;
          const y = (event.clientY / window.innerHeight - 0.5) * 20;
          orb.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        },
        { passive: true }
      );
    }
  }

  private bindCardPointerGlow(): void {
    document.querySelectorAll('.project-card').forEach((card) => {
      const node = card as HTMLElement;
      node.onpointermove = (event) => {
        const rect = node.getBoundingClientRect();
        node.style.setProperty('--mx', `${(event as PointerEvent).clientX - rect.left}px`);
        node.style.setProperty('--my', `${(event as PointerEvent).clientY - rect.top}px`);
      };
    });
  }
}