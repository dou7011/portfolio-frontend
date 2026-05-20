import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. 初步檢查：如果本地連 Token 都沒有，直接省下 API 請求，踢回登入頁
  if (!authService.getToken()) {
    router.navigate(['/']);
    return false;
  }

  // 2. 🌟 實作你的最高安全標準：每次切換路由，都即時打 API 驗證最新權限！
  return authService.verifyPermissions().pipe(
    map(res => {
      if (res.success) {
        return true; // 驗證成功，准許進入管理後台！
      } else {
        return false;
      }
    }),
    catchError(() => {
      return of(false);
    })
  );
};