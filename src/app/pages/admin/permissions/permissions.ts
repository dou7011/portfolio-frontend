import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { PermissionService } from '../../../services/permission.service';
import { Permission } from '../../../models/permission.interface';
import { ApiError } from '../../../models/api.interface';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './permissions.html',
  styleUrl: './permissions.css',
})
export class PermissionsComponent implements OnInit {
  private permissionService = inject(PermissionService);

  public permissions: Permission[] = [];
  public isLoading = false;
  public pageError = '';

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions(): void {
    this.isLoading = true;
    this.pageError = '';

    this.permissionService.getPermissions().subscribe({
      next: (res) => {
        this.permissions = res.data ?? [];
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        const apiError = err.error as ApiError | undefined;
        this.pageError = apiError?.message ?? '載入權限失敗，請稍後再試。';
        this.isLoading = false;
      },
    });
  }
}
