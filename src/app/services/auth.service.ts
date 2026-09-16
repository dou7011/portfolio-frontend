import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccess } from '../models/api.interface';
import { AuthUser } from '../models/auth.interface';

export type LoginResponse = ApiSuccess<null>;
export type AuthMeResponse = ApiSuccess<AuthUser>;

@Injectable({
  providedIn: 'root'
})
/**
 * 身分驗證相關 API 與 cookie session 管理。
 */
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  loginApi(credentials: { email: string; password: string }) {
    return this.http.post<{ success: boolean, message: string, data: null }>(
      `${this.apiUrl}/login`, 
      credentials,
      { withCredentials: true }
    );
  }

  /**
   * 清除登入狀態並導回首頁。
   */
  logout(): Observable<void> {
    return this.http.post(`${this.apiUrl}/logout`, null, { withCredentials: true }).pipe(
      map(() => undefined)
    );
  }

  /**
   * 透過 /me 取得當前使用者與最新權限資料。
   */
  verifyPermissions(): Observable<AuthMeResponse> {
    return this.http.get<AuthMeResponse>(`${this.apiUrl}/me`, { withCredentials: true });
  }
}