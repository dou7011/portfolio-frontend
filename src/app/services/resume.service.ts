import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ResumeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/resume`;

  // 🌟 加入 lang 參數，預設為 'zh'
  getResumeData(lang: string = 'zh') {
    // 將 lang 參數拼接到網址後方
    return this.http.get(`${this.apiUrl}?lang=${lang}`);
  }

  
}