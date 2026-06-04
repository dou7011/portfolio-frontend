import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiSuccess } from '../models/api.interface';
import { Permission } from '../models/permission.interface';

export type PermissionsListResponse = ApiSuccess<Permission[]>;

@Injectable({
  providedIn: 'root',
})
/**
 * 權限清單查詢服務。
 */
export class PermissionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/permissions`;

  /**
   * 取得系統所有可用權限。
   */
  getPermissions(): Observable<PermissionsListResponse> {
    return this.http.get<PermissionsListResponse>(`${this.apiUrl}`);
  }
}
