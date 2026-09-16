import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // The auth cookie is HttpOnly, so /me is the authentication check.
  return authService.verifyPermissions().pipe(
    map(res => {
      if (res.success) {
        return true; // 驗證成功，准許進入管理後台！
      } else {
        return false;
      }
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};