import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ResumeService } from '../../../services/resume.service';
import { ResumeData } from '../../../models/resume.interface';
import { SafeHtmlPipe } from '../../../pipes/safe-html.pipe';
import { QuillStylesComponent } from '../../../components/quill-styles/quill-styles.component';
import { LoadingIndicatorComponent } from '../../../components/loading-indicator/loading-indicator';
import { ResumeLoadErrorComponent } from '../../../components/resume-load-error/resume-load-error';
import { retry, timeout } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiError } from '../../../models/api.interface';

@Component({
  selector: 'app-resume-formal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, SafeHtmlPipe, QuillStylesComponent, LoadingIndicatorComponent, ResumeLoadErrorComponent],
  templateUrl: './resume-formal.html',
  styleUrl: './resume-formal.css',
})
export class ResumeFormalComponent implements OnInit {
  private resumeService = inject(ResumeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private autoExportPending = false;
  private requestVersion = 0;
  private readonly labels = {
    zh: {
      skills: '技術棧',
      experience: '工作經歷',
      education: '學歷',
      certifications: '專業證照',
      projects: '專案作品',
      loading: '讀取履歷資料中...',
      fallbackError: '載入資料失敗，請稍後再試。',
      credentialPrefix: 'ID',
      exportPdfLabel: '匯出 PDF',
      interactiveLink: '切換到互動式履歷'
    },
    en: {
      skills: 'Technical Stack',
      experience: 'Work Experience',
      education: 'Education',
      certifications: 'Certifications',
      projects: 'Projects',
      loading: 'Loading resume data...',
      fallbackError: 'Failed to load data. Please try again later.',
      credentialPrefix: 'ID',
      exportPdfLabel: 'Export PDF',
      interactiveLink: 'View interactive resume'
    }
  } as const;
  
  public resumeData = signal<ResumeData | null>(null);
  public errorMessage = signal('');
  public isLoading = signal(false);
  public currentLang = signal<'zh' | 'en'>('zh');
  public isExporting = signal(false);

  public uiText() {
    return this.labels[this.currentLang()];
  }

  ngOnInit(): void {
    // 互動式履歷的「匯出 PDF」會帶 lang 與 print 參數導到此頁，載入完成後自動開啟列印
    const query = this.route.snapshot.queryParamMap;
    const lang = query.get('lang');
    if (lang === 'zh' || lang === 'en') {
      this.currentLang.set(lang);
    }
    this.autoExportPending = query.get('print') === '1';
    this.fetchResumeData(this.currentLang());
  }

  public toggleLang(): void {
    const nextLang: 'zh' | 'en' = this.currentLang() === 'zh' ? 'en' : 'zh';
    this.currentLang.set(nextLang);
    this.fetchResumeData(nextLang);
  }

  /**
   * 以瀏覽器列印功能輸出（選擇「另存為 PDF」），文字保持向量、可選取，中文字型也不會缺字。
   */
  public async exportPdf(): Promise<void> {
    if (!this.resumeData() || this.isExporting()) return;

    this.isExporting.set(true);
    const originalTitle = document.title;
    // 列印頁首會顯示文件標題；用零寬空白讓標題欄留白，只保留日期（空字串會改顯示網址）
    document.title = '\u200B';
    window.addEventListener('afterprint', () => {
      document.title = originalTitle;
      this.isExporting.set(false);
    }, { once: true });

    await this.waitForPrintAssets();
    window.print();
  }

  private async waitForPrintAssets(): Promise<void> {
    const pending: Promise<unknown>[] = [document.fonts?.ready ?? Promise.resolve()];
    document.querySelectorAll<HTMLImageElement>('.resume-wrapper img').forEach((img) => {
      if (img.complete) return;
      pending.push(new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      }));
    });
    // 最多等 3 秒，避免單一資源卡住導致無法列印
    await Promise.race([Promise.all(pending), new Promise((resolve) => setTimeout(resolve, 3000))]);
  }

  private runAutoExport(): void {
    this.autoExportPending = false;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { print: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    // 等資料渲染到畫面後再列印
    setTimeout(() => void this.exportPdf(), 0);
  }

  public retryLoadResume(): void {
    this.fetchResumeData(this.currentLang());
  }

  public formatEducationEndDate(endDate: string): string {
    return endDate?.trim() || (this.currentLang() === 'en' ? 'Present' : '至今');
  }

  private fetchResumeData(lang: 'zh' | 'en'): void {
    const requestVersion = ++this.requestVersion;
    this.isLoading.set(true);
    this.resumeData.set(null);
    this.errorMessage.set('');
    this.resumeService.getResumeData(lang).pipe(
      timeout(8000),
      retry({ count: 2, delay: 500 }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        if (requestVersion !== this.requestVersion) return;
        this.resumeData.set(res?.data ?? null);
        if (!this.resumeData()) {
          this.errorMessage.set(lang === 'en'
            ? '目前沒有英文履歷資料，請稍後再試或切回中文。'
            : '目前沒有履歷資料，請稍後再試。');
        }
        this.isLoading.set(false);
        if (this.autoExportPending && this.resumeData()) {
          this.runAutoExport();
        }
      },
      error: (err: HttpErrorResponse) => {
        if (requestVersion !== this.requestVersion) return;
        console.error('API 呼叫失敗：', err);
        this.autoExportPending = false;
        const apiError = err.error as ApiError | undefined;
        if (apiError?.message) {
          this.errorMessage.set(apiError.message);
        } else {
          this.errorMessage.set(lang === 'en'
            ? '英文履歷載入失敗，請確認 API 是否支援 lang=en。'
            : '無法連線到伺服器，請確認後端 API 是否已啟動。');
        }
        this.isLoading.set(false);
      }
    });
  }
}
