export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export type ApiSuccess<T> = {
  success: true;
  message?: string;
  data?: T;
};

export type ApiError = {
  success: false;
  code: ApiErrorCode;
  message: string;
};
