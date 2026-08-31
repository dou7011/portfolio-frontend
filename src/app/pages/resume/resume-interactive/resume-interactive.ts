import { AfterViewInit, Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { timeout } from 'rxjs';
import { ApiError } from '../../../models/api.interface';
import { ResumeData } from '../../../models/resume.interface';
import { ResumeService } from '../../../services/resume.service';

@Component({
  selector: 'app-resume-interactive',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './resume-interactive.html',
  styleUrl: './resume-interactive.css',
})
export class ResumeInteractiveComponent implements OnInit, AfterViewInit {
  private resumeService = inject(ResumeService);
  public resumeData = signal<ResumeData | null>(null);
  public errorMessage = signal('');
  public isLoading = signal(false);
  public currentLang = signal<'zh' | 'en'>('zh');

  public uiText() {
    return this.currentLang() === 'zh'
      ? {
          badge: '系統架構與全端開發',
          experience: '工作經歷',
          technical: '技術棧',
          education: '學歷',
          certifications: '專業證照',
          loading: '載入履歷資料中...',
          fallback: '載入資料失敗，請稍後再試。',
          formalLink: '切換到制式履歷',
        }
      : {
          badge: 'System Architecture & Full-Stack',
          experience: 'EXPERIENCE',
          technical: 'TECHNICAL ARSENAL',
          education: 'EDUCATION',
          certifications: 'CERTIFICATIONS',
          loading: 'Loading resume data...',
          fallback: 'Failed to load data. Please try again later.',
          formalLink: 'View formal resume',
        };
  }

  ngOnInit(): void {
    this.fetchResumeData(this.currentLang());
  }

  ngAfterViewInit(): void {
    this.observeRevealElements();
  }

  toggleLang(): void {
    const nextLang: 'zh' | 'en' = this.currentLang() === 'zh' ? 'en' : 'zh';
    this.currentLang.set(nextLang);
    this.fetchResumeData(nextLang);
  }

  private observeRevealElements(): void {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  }

  private fetchResumeData(lang: 'zh' | 'en'): void {
    this.isLoading.set(true);
    this.resumeData.set(null);
    this.errorMessage.set('');

    this.resumeService
      .getResumeData(lang)
      .pipe(timeout(8000))
      .subscribe({
        next: (res) => {
          console.log('API 呼叫成功：', res);
          this.resumeData.set(res?.data ?? null);

          if (!this.resumeData()) {
            this.errorMessage.set(
              lang === 'en'
                ? 'Currently no English resume data is available. Please try again later.'
                : '目前沒有履歷資料，請稍後再試。'
            );
          }

          this.isLoading.set(false);
          requestAnimationFrame(() => this.observeRevealElements());
        },
        error: (err: HttpErrorResponse) => {
          console.error('API 呼叫失敗：', err);
          const apiError = err.error as ApiError | undefined;
          this.errorMessage.set(
            apiError?.message ??
              (lang === 'en'
                ? 'Unable to load the English resume. Please check the API service.'
                : '無法連線到伺服器，請確認後端 API 是否已啟動。')
          );
          this.isLoading.set(false);
        },
      });
  }

  @HostListener('window:mousemove', ['$event'])
  onWindowMouseMove(event: MouseEvent): void {
    const globalGlow = document.querySelector('.mouse-glow') as HTMLElement | null;
    if (!globalGlow) {
      return;
    }

    requestAnimationFrame(() => {
      globalGlow.style.setProperty('--cursor-x', `${event.clientX}px`);
      globalGlow.style.setProperty('--cursor-y', `${event.clientY}px`);
    });
  }

  onCardMouseMove(event: MouseEvent, card: HTMLElement): void {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  }

  onCardMouseLeave(card: HTMLElement): void {
    card.style.setProperty('--mouse-x', '-100%');
    card.style.setProperty('--mouse-y', '-100%');
  }
}
