import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiSuccess } from '../models/api.interface';
import { AuthUser } from '../models/auth.interface';

export type LoginResponse = ApiSuccess<{ token: string }>;
export type AuthMeResponse = ApiSuccess<AuthUser>;

@Injectable({
  providedIn: 'root'
})
/**
 * 身分驗證相關 API 與本地 Token 管理。
 */
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'portfolio_auth_token';

  loginApi(credentials: { email: string; password: string }) {
    return this.http.post<{ success: boolean, message: string, data: { token: string } }>(
      `${this.apiUrl}/login`, 
      credentials
    ).pipe(
      // 拿到 token 後立即保存，供 interceptor 夾帶授權標頭。
      tap(res => {
        if (res && res.data.token) {
          localStorage.setItem(this.tokenKey, res.data.token);
        }
      })
    );
  }

  /**
   * 清除登入狀態並導回首頁。
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(['/']);
  }

  /**
   * 讀取目前儲存在本地端的 token。
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * 透過 /me 取得當前使用者與最新權限資料。
   */
  verifyPermissions(): Observable<AuthMeResponse> {
    return this.http.get<AuthMeResponse>(`${this.apiUrl}/me`);
  }
}