import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  loginApi(credentials: { email: string; password: string }) {
    return this.http.post<{success: boolean, message: string, token: string, user: any}>(`${this.apiUrl}/auth/login`, credentials);
  }

  /**
   * 2. 登出與清空機制
   * 打包了清空 local storage 以及路由導向的邏輯
   */
  logoutApi() {
    localStorage.removeItem('auth_token');
    // 如果未來有存其他個人設定，可以使用 localStorage.clear() 一次清空
    this.router.navigate(['/']); // 登出後踢回首頁
  }

  /**
   * 3. 取得 Token
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * [臨時] 註冊管理員 API
   */
  registerApi(credentials: { email: string; password: string }) {
    return this.http.post<{success: boolean, message: string}>(`${this.apiUrl}/auth/setup`, credentials);
  }
}