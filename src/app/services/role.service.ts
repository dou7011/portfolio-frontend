import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiSuccess } from '../models/api.interface';
import { Role } from '../models/role.interface';

export type RolesListResponse = ApiSuccess<Role[]>;
export type RoleDetailResponse = ApiSuccess<Role>;
export type RoleMutationResponse = ApiSuccess<never>;

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissionIds?: number[];
}

export interface UpdateRolePayload {
  name: string;
  description?: string;
  permissionIds?: number[];
}

@Injectable({
  providedIn: 'root',
})
/**
 * 角色管理服務（CRUD）。
 */
export class RoleService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/roles`;

  /**
   * 取得所有角色與其權限清單。
   */
  getRoles(): Observable<RolesListResponse> {
    return this.http.get<RolesListResponse>(`${this.apiUrl}`);
  }

  /**
   * 依 ID 取得單一角色資訊。
   */
  getRoleById(id: number): Observable<RoleDetailResponse> {
    return this.http.get<RoleDetailResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * 建立角色，並可選擇同時指派權限。
   */
  createRole(payload: CreateRolePayload): Observable<RoleMutationResponse> {
    return this.http.post<RoleMutationResponse>(`${this.apiUrl}`, payload);
  }

  /**
   * 更新角色資料，若提供 permissionIds 則全量覆寫綁定。
   */
  updateRole(id: number, payload: UpdateRolePayload): Observable<RoleMutationResponse> {
    return this.http.put<RoleMutationResponse>(`${this.apiUrl}/${id}`, payload);
  }

  /**
   * 刪除指定角色。
   */
  deleteRole(id: number): Observable<RoleMutationResponse> {
    return this.http.delete<RoleMutationResponse>(`${this.apiUrl}/${id}`);
  }
}
