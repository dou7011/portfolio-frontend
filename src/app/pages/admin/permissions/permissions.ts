import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { PermissionService } from '../../../services/permission.service';
import { Permission } from '../../../models/permission.interface';
import { ApiError } from '../../../models/api.interface';

interface PermissionTableGroup {
  scope: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-permissions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './permissions.html',
  styleUrl: './permissions.css',
})
export class PermissionsComponent implements OnInit {
  private permissionService = inject(PermissionService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private loadRequestId = 0;

  public permissions: Permission[] = [];
  public isLoading = false;
  public pageError = '';

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions(): void {
    const requestId = ++this.loadRequestId;
    this.isLoading = true;
    this.pageError = '';
    this.changeDetector.markForCheck();

    this.permissionService.getPermissions().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        if (requestId !== this.loadRequestId) return;
        this.isLoading = false;
        this.changeDetector.markForCheck();
      }),
    ).subscribe({
      next: (res) => {
        if (requestId !== this.loadRequestId) return;
        this.permissions = res.data ?? [];
        this.changeDetector.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        if (requestId !== this.loadRequestId) return;
        console.error('Failed to load permissions:', err);
        const apiError = err.error as ApiError | undefined;
        this.pageError = apiError?.message ?? '載入權限失敗，請稍後再試。';
        this.changeDetector.markForCheck();
      },
    });
  }

  getPermissionScope(action: string): string {
    const separatorIndex = action.indexOf(':');
    return separatorIndex === -1 ? 'system' : action.slice(0, separatorIndex);
  }

  getPermissionActionName(action: string): string {
    const separatorIndex = action.indexOf(':');
    return separatorIndex === -1 ? action : action.slice(separatorIndex + 1);
  }

  getPermissionGroups(): PermissionTableGroup[] {
    const groups = new Map<string, PermissionTableGroup>();

    for (const permission of this.permissions) {
      const scope = this.getPermissionScope(permission.action);
      const group = groups.get(scope) ?? { scope, permissions: [] };

      group.permissions.push(permission);
      groups.set(scope, group);
    }

    return [...groups.values()];
  }

}
