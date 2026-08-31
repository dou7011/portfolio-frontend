import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ResumeService } from '../../../services/resume.service';
import { ResumeData } from '../../../models/resume.interface';
import { timeout } from 'rxjs';
import { ApiError } from '../../../models/api.interface';

@Component({
  selector: 'app-resume-formal',
  imports: [CommonModule],
  templateUrl: './resume-formal.html',
  styleUrl: './resume-formal.css',
})
export class ResumeFormalComponent implements OnInit {
  private resumeService = inject(ResumeService);
  private readonly labels = {
    zh: {
      skills: '專業技能',
      experience: '工作經歷',
      education: '學歷',
      certifications: '專業證照',
      loading: '讀取履歷資料中...',
      fallbackError: '載入資料失敗，請稍後再試。',
      credentialPrefix: 'ID'
    },
    en: {
      skills: 'Professional Skills',
      experience: 'Work Experience',
      education: 'Education',
      certifications: 'Certifications',
      loading: 'Loading resume data...',
      fallbackError: 'Failed to load data. Please try again later.',
      credentialPrefix: 'ID'
    }
  } as const;
  
  public resumeData = signal<ResumeData | null>(null);
  public errorMessage = signal('');
  public isLoading = signal(false);
  public currentLang = signal<'zh' | 'en'>('zh');

  public uiText() {
    return this.labels[this.currentLang()];
  }

  ngOnInit(): void {
    this.fetchResumeData(this.currentLang());
  }

  public toggleLang(): void {
    const nextLang: 'zh' | 'en' = this.currentLang() === 'zh' ? 'en' : 'zh';
    this.currentLang.set(nextLang);
    this.fetchResumeData(nextLang);
  }

  private fetchResumeData(lang: 'zh' | 'en'): void {
    this.isLoading.set(true);
    this.resumeData.set(null);
    this.errorMessage.set('');
    this.resumeService.getResumeData(lang).pipe(timeout(8000)).subscribe({
      next: (res) => {
        console.log('API 呼叫成功：', res);
        this.resumeData.set(res?.data ?? null);
        if (!this.resumeData()) {
          this.errorMessage.set(lang === 'en'
            ? '目前沒有英文履歷資料，請稍後再試或切回中文。'
            : '目前沒有履歷資料，請稍後再試。');
        }
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('API 呼叫失敗：', err);
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
