import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 短時間內已驗證過就不再打 API，避免切換子路由時卡頓
  if (authService.isRecentlyVerified()) {
    return true;
  }

  // The auth cookie is HttpOnly, so /me is the authentication check.
  return authService.verifyPermissions().pipe(
    map(res => (res.success ? true : router.createUrlTree(['/login']))),
    catchError((error: unknown) => {
      const unauthorized = error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
      return of(router.createUrlTree([unauthorized ? '/login' : '/']));
    })
  );
};

export const authChildGuard: CanActivateChildFn = (route, state) => authGuard(route, state);