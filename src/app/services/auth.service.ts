import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;
  private tokenKey = 'portfolio_auth_token';

  loginApi(credentials: { email: string; password: string }) {
    return this.http.post<{ success: boolean, message: string, token: string, user: any }>(
      `${this.apiUrl}/auth/login`, 
      credentials
    ).pipe(
      // 🌟 使用 tap 攔截回應：拿到 Token 的瞬間立刻存入 localStorage
      // tap 不會改變資料流，儲存完後依然會把完整的 response 傳給後面的元件
      tap(res => {
        if (res && res.token) {
          localStorage.setItem(this.tokenKey, res.token);
        }
      })
    );
  }

  /**
   * 2. 登出與清空機制
   * 打包了清空 local storage 以及路由導向的邏輯
   */
  logout() {
    localStorage.removeItem(this.tokenKey);
    // 如果未來有存其他個人設定，可以使用 localStorage.clear() 一次清空
    this.router.navigate(['/']); // 登出後踢回首頁
  }

  /**
   * 3. 取得 Token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  verifyPermissions() {
  // 呼叫後端的 /me 路由 (這支後端 API 我們等一下補)
  return this.http.get<{ success: boolean; user: any }>(`${this.apiUrl}/auth/me`);
}

  /**
   * [臨時] 註冊管理員 API
   */
  registerApi(credentials: { email: string; password: string }) {
    return this.http.post<{success: boolean, message: string}>(`${this.apiUrl}/auth/setup`, credentials);
  }
}