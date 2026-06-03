import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiSuccess } from '../models/api.interface';

// ==========================================
// 定義前後端 100% 對齊的強型別介面
// ==========================================
export interface AuthUser {
  id: number;
  email: string;
  roles: string[];
  permissions: string[];
}

export type LoginResponse = ApiSuccess<{ token: string }>;
export type AuthMeResponse = ApiSuccess<AuthUser>;
export type RegisterResponse = ApiSuccess<never>;

// ==========================================
// 主體實作
// ==========================================
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;
  private tokenKey = 'portfolio_auth_token';

  /**
   * 1. 處理登入
   */
  loginApi(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/auth/login`, 
      credentials
    ).pipe(
      // 拿到 Token 的瞬間立刻存入 localStorage
      tap(res => {
        if (res?.data?.token) {
          localStorage.setItem(this.tokenKey, res.data.token);
        }
      })
    );
  }

  /**
   * 2. 登出與清空機制
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    // 如果未來有存其他個人設定，可以使用 localStorage.clear() 一次清空
    this.router.navigate(['/']); // 登出後踢回首頁
  }

  /**
   * 3. 取得目前存留的 Token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * 實時權限校驗中介
   * 呼叫後端的 /me 路由，拉取該用戶當前最新的權限矩陣
   */
  verifyPermissions(): Observable<AuthMeResponse> {
    return this.http.get<AuthMeResponse>(`${this.apiUrl}/auth/me`);
  }

  /**
   * [臨時] 註冊管理員 API
   */
  registerApi(credentials: { email: string; password: string }): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/setup`, credentials);
  }
}