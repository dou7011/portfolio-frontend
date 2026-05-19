import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. 從本地儲存空間拿到金鑰
  const token = localStorage.getItem('portfolio_auth_token');

  // 2. 如果金鑰存在，就複製一份請求，並自動塞入 Authorization Bearer Header
  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  // 3. 如果沒有 Token (例如一般訪客看履歷)，就直接放行原本的請求
  return next(req);
};