import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ResumeData } from '../models/resume.interface';
import { ApiSuccess } from '../models/api.interface';

@Injectable({
  providedIn: 'root'
})
/**
 * 履歷內容查詢與更新服務。
 */
export class ResumeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/resume`;
  public readonly resumeData = signal<ResumeData | null>(null);
  private readonly cache = new Map<'zh' | 'en', Observable<ApiSuccess<ResumeData>>>();

  /**
   * 取得指定語系的履歷資料；同語系重複呼叫共用同一次請求，forceRefresh 可略過快取。
   */
  getResumeData(lang: 'zh' | 'en' = 'zh', forceRefresh = false): Observable<ApiSuccess<ResumeData>> {
    let request$ = forceRefresh ? undefined : this.cache.get(lang);
    if (!request$) {
      request$ = this.http.get<ApiSuccess<ResumeData>>(`${this.apiUrl}/${lang}`).pipe(
        tap({ error: () => this.cache.delete(lang) }),
        shareReplay(1),
      );
      this.cache.set(lang, request$);
    }
    return request$.pipe(tap((response) => this.resumeData.set(response?.data ?? null)));
  }

  /**
   * 更新履歷資料，需包含欲更新語系。
   */
  updateResume(resumeData: Partial<ResumeData> & { lang: 'zh' | 'en' }): Observable<ApiSuccess<never>> {
    return this.http.put<ApiSuccess<never>>(`${this.apiUrl}`, resumeData).pipe(tap(() => this.cache.clear()));
  }
}