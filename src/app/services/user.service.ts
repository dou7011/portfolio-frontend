import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiSuccess } from '../models/api.interface';
import { User } from '../models/user.interface';

export type UsersListResponse = ApiSuccess<User[]>;
export type UserDetailResponse = ApiSuccess<User>;
export type UserMutationResponse = ApiSuccess<never>;

export interface CreateUserPayload {
  email: string;
  password: string;
  isActive: 0 | 1;
  roleIds?: number[];
}

export interface UpdateUserPayload {
  isActive: 0 | 1;
  password?: string;
  roleIds?: number[];
}

@Injectable({
  providedIn: 'root',
})
/**
 * 後台使用者管理服務（CRUD）。
 */
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  /**
   * 取得所有使用者清單。
   */
  getUsers(): Observable<UsersListResponse> {
    return this.http.get<UsersListResponse>(`${this.apiUrl}`);
  }

  /**
   * 依 ID 取得單一使用者。
   */
  getUserById(id: number): Observable<UserDetailResponse> {
    return this.http.get<UserDetailResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * 建立使用者，並可選擇同時綁定角色。
   */
  createUser(payload: CreateUserPayload): Observable<UserMutationResponse> {
    return this.http.post<UserMutationResponse>(`${this.apiUrl}`, payload);
  }

  /**
   * 更新使用者狀態、密碼或角色綁定。
   */
  updateUser(id: number, payload: UpdateUserPayload): Observable<UserMutationResponse> {
    return this.http.put<UserMutationResponse>(`${this.apiUrl}/${id}`, payload);
  }

  /**
   * 刪除指定使用者。
   */
  deleteUser(id: number): Observable<UserMutationResponse> {
    return this.http.delete<UserMutationResponse>(`${this.apiUrl}/${id}`);
  }

}
