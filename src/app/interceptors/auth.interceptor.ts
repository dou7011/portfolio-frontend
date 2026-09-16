import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const csrfToken = readCookie('portfolio_csrf');
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