import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import { RoleService } from '../../../services/role.service';
import { PermissionService } from '../../../services/permission.service';
import { Role } from '../../../models/role.interface';
import { Permission } from '../../../models/permission.interface';
import { ApiError } from '../../../models/api.interface';
import { ToastService } from '../../../services/toast.service';

interface PermissionGroup {
  key: string;
  label: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-roles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
})
export class RolesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private roleService = inject(RoleService);
  private permissionService = inject(PermissionService);
  private toastService = inject(ToastService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private loadRequestId = 0;

  public roles: Role[] = [];
  public permissions: Permission[] = [];
  public permissionGroups: PermissionGroup[] = [];
  public expandedPermissionGroups = new Set<string>();
  public isLoading = false;
  public isSubmitting = false;
  public isFormOpen = false;
  public isEditing = false;
  public editingRoleId: number | null = null;
  public pageError = '';
  public formMessage = '';

  public roleForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    permissionIds: [[]],
  });

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    const requestId = ++this.loadRequestId;
    this.isLoading = true;
    this.pageError = '';
    this.changeDetector.markForCheck();

    forkJoin({
      permissions: this.permissionService.getPermissions(),
      roles: this.roleService.getRoles(),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        if (requestId !== this.loadRequestId) return;
        this.isLoading = false;
        this.changeDetector.markForCheck();
      }),
    ).subscribe({
      next: ({ permissions, roles }) => {
        if (requestId !== this.loadRequestId) return;
        this.permissions = permissions.data ?? [];
        this.permissionGroups = this.groupPermissions(this.permissions);
        this.roles = roles.data ?? [];
        this.changeDetector.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        if (requestId !== this.loadRequestId) return;
        console.error('Failed to load roles and permissions:', err);
        const apiError = err.error as ApiError | undefined;
        this.roles = [];
        this.permissions = [];
        this.permissionGroups = [];
        this.pageError = apiError?.message ?? '載入角色與權限資料失敗，請稍後再試。';
        this.changeDetector.markForCheck();
      }
    });
  }

  openCreateForm(): void {
    this.isEditing = false;
    this.editingRoleId = null;
    this.isFormOpen = true;
    this.formMessage = '';
    this.roleForm.reset({
      name: '',
      description: '',
      permissionIds: [],
    });
  }

  openEditForm(role: Role): void {
    this.isEditing = true;
    this.editingRoleId = role.id;
    this.isFormOpen = true;
    this.formMessage = '';
    this.roleForm.reset({
      name: role.name,
      description: role.description ?? '',
      permissionIds: role.permissions?.map((permission) => permission.id) ?? [],
    });
  }

  closeForm(): void {
    this.isFormOpen = false;
    this.isEditing = false;
    this.editingRoleId = null;
    this.formMessage = '';
    this.roleForm.reset({
      name: '',
      description: '',
      permissionIds: [],
    });
  }

  togglePermissionSelection(permissionId: number): void {
    const selected = this.roleForm.get('permissionIds')?.value as number[];
    const current = selected ?? [];

    if (current.includes(permissionId)) {
      this.roleForm.patchValue({
        permissionIds: current.filter((id) => id !== permissionId),
      });
      return;
    }

    this.roleForm.patchValue({
      permissionIds: [...current, permissionId],
    });
  }

  togglePermissionGroup(group: PermissionGroup): void {
    const selected = this.roleForm.get('permissionIds')?.value as number[];
    const current = selected ?? [];
    const groupPermissionIds = group.permissions.map((permission) => permission.id);
    const allSelected = groupPermissionIds.every((id) => current.includes(id));
    const next = allSelected
      ? current.filter((id) => !groupPermissionIds.includes(id))
      : [...new Set([...current, ...groupPermissionIds])];

    this.roleForm.patchValue({ permissionIds: next });
  }

  togglePermissionGroupExpanded(groupKey: string): void {
    if (this.expandedPermissionGroups.has(groupKey)) {
      this.expandedPermissionGroups.delete(groupKey);
    } else {
      this.expandedPermissionGroups.add(groupKey);
    }
  }

  isPermissionGroupExpanded(groupKey: string): boolean {
    return this.expandedPermissionGroups.has(groupKey);
  }

  countSelectedPermissions(group: PermissionGroup): number {
    const selected = this.roleForm.get('permissionIds')?.value as number[] ?? [];
    return group.permissions.filter((permission) => selected.includes(permission.id)).length;
  }

  isPermissionGroupFullySelected(group: PermissionGroup): boolean {
    return this.countSelectedPermissions(group) === group.permissions.length;
  }

  isPermissionGroupPartiallySelected(group: PermissionGroup): boolean {
    const selectedCount = this.countSelectedPermissions(group);
    return selectedCount > 0 && selectedCount < group.permissions.length;
  }

  getPermissionLabel(permission: Permission): string {
    const separatorIndex = permission.action.indexOf(':');
    return separatorIndex === -1 ? permission.action : permission.action.slice(separatorIndex + 1);
  }

  private groupPermissions(permissions: Permission[]): PermissionGroup[] {
    const groups = new Map<string, PermissionGroup>();

    for (const permission of permissions) {
      const separatorIndex = permission.action.indexOf(':');
      const groupKey = separatorIndex === -1 ? permission.action : permission.action.slice(0, separatorIndex);
      const group = groups.get(groupKey) ?? {
        key: groupKey,
        label: groupKey,
        permissions: [],
      };

      group.permissions.push(permission);
      groups.set(groupKey, group);
    }

    return [...groups.values()];
  }

  submitRole(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    const payload = {
      name: this.roleForm.value.name,
      description: this.roleForm.value.description,
      permissionIds: this.roleForm.value.permissionIds ?? [],
    };

    this.isSubmitting = true;
    this.formMessage = '';

    const request$ = this.isEditing && this.editingRoleId !== null
      ? this.roleService.updateRole(this.editingRoleId, payload)
      : this.roleService.createRole(payload);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isSubmitting = false;
        this.changeDetector.markForCheck();
      }),
    ).subscribe({
      next: () => {
        this.formMessage = this.isEditing ? '✅ 角色更新成功' : '✅ 角色建立成功';
        this.toastService.show(this.formMessage, 'success');
        this.loadRoles();
        setTimeout(() => {
          this.closeForm();
          this.changeDetector.markForCheck();
        }, 800);
        this.changeDetector.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        const apiError = err.error as ApiError | undefined;
        const message = apiError?.message ?? '儲存失敗，請稍後再試。';
        this.formMessage = message;
        this.toastService.show(message, 'error');
        this.changeDetector.markForCheck();
      },
    });
  }

  deleteRole(role: Role): void {
    if (!window.confirm(`確定要刪除角色 ${role.name} 嗎？`)) {
      return;
    }

    this.roleService.deleteRole(role.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.roles = this.roles.filter((item) => item.id !== role.id);
        this.changeDetector.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        const apiError = err.error as ApiError | undefined;
        this.pageError = apiError?.message ?? '刪除失敗，請稍後再試。';
        this.changeDetector.markForCheck();
      },
    });
  }

  countPermissions(role: Role): number {
    return role.permissions?.length ?? 0;
  }

}
