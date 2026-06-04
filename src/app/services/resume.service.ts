import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  /**
   * 取得指定語系的履歷資料。
   */
  getResumeData(lang: 'zh' | 'en' = 'zh'): Observable<ApiSuccess<ResumeData>> {
    return this.http.get<ApiSuccess<ResumeData>>(`${this.apiUrl}/${lang}`);
  }

  /**
   * 更新履歷資料，需包含欲更新語系。
   */
  updateResume(resumeData: Partial<ResumeData> & { lang: 'zh' | 'en' }): Observable<ApiSuccess<never>> {
    return this.http.put<ApiSuccess<never>>(`${this.apiUrl}`, resumeData);
  }
}