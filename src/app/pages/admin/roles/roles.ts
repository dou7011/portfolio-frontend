import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoleService } from '../../../services/role.service';
import { PermissionService } from '../../../services/permission.service';
import { Role } from '../../../models/role.interface';
import { Permission } from '../../../models/permission.interface';
import { ApiError } from '../../../models/api.interface';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
})
export class RolesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private roleService = inject(RoleService);
  private permissionService = inject(PermissionService);
  private toastService = inject(ToastService);

  public roles: Role[] = [];
  public permissions: Permission[] = [];
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
    this.isLoading = true;
    this.pageError = '';

    this.permissionService.getPermissions().subscribe({
      next: (permissionRes) => {
        this.permissions = permissionRes.data ?? [];
      },
      error: () => {
        this.permissions = [];
      },
    });

    this.roleService.getRoles().subscribe({
      next: (res) => {
        this.roles = res.data ?? [];
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        const apiError = err.error as ApiError | undefined;
        this.pageError = apiError?.message ?? '載入角色失敗，請稍後再試。';
        this.isLoading = false;
      },
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

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.formMessage = this.isEditing ? '✅ 角色更新成功' : '✅ 角色建立成功';
        this.toastService.show(this.formMessage, 'success');
        this.loadRoles();
        setTimeout(() => {
          this.closeForm();
        }, 800);
      },
      error: (err: HttpErrorResponse) => {
        const apiError = err.error as ApiError | undefined;
        const message = apiError?.message ?? '儲存失敗，請稍後再試。';
        this.formMessage = message;
        this.toastService.show(message, 'error');
        this.isSubmitting = false;
      },
    });
  }

  deleteRole(role: Role): void {
    if (!window.confirm(`確定要刪除角色 ${role.name} 嗎？`)) {
      return;
    }

    this.roleService.deleteRole(role.id).subscribe({
      next: () => {
        this.roles = this.roles.filter((item) => item.id !== role.id);
      },
      error: (err: HttpErrorResponse) => {
        const apiError = err.error as ApiError | undefined;
        this.pageError = apiError?.message ?? '刪除失敗，請稍後再試。';
      },
    });
  }

  countPermissions(role: Role): number {
    return role.permissions?.length ?? 0;
  }
}
