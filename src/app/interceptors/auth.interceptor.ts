import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 僅對自家 API 附加憑證與 CSRF Token，避免洩漏給第三方網域
  if (!req.url.startsWith(`${environment.apiUrl}/`)) {
    return next(req);
  }

  const csrfToken = sessionStorage.getItem('portfolio_csrf') ?? readCookie('portfolio_csrf');
  return next(req.clone({
    withCredentials: true,
    ...(csrfToken ? { setHeaders: { 'X-CSRF-Token': csrfToken } } : {}),
  }));
};

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  const cookie = document.cookie.split('; ').find(value => value.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}