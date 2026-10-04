import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { User } from '../../../models/user.interface';
import { Role } from '../../../models/role.interface';
import { ApiError } from '../../../models/api.interface';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class UsersComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private toastService = inject(ToastService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private loadRequestId = 0;

  public users: User[] = [];
  public roles: Role[] = [];
  public isLoading = false;
  public isSubmitting = false;
  public isFormOpen = false;
  public isEditing = false;
  public editingUserId: number | null = null;
  public pageError = '';
  public formMessage = '';

  public userForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(6)]],
    isActive: [1, Validators.required],
    roleIds: [[]],
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    const requestId = ++this.loadRequestId;
    this.isLoading = true;
    this.pageError = '';
    this.changeDetector.markForCheck();

    forkJoin({
      roles: this.roleService.getRoles(),
      users: this.userService.getUsers(),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        if (requestId !== this.loadRequestId) return;
        this.isLoading = false;
        this.changeDetector.markForCheck();
      }),
    ).subscribe({
      next: ({ roles, users }) => {
        if (requestId !== this.loadRequestId) return;
        this.roles = roles.data ?? [];
        this.users = users.data ?? [];
        this.changeDetector.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        if (requestId !== this.loadRequestId) return;
        console.error('Failed to load users and roles:', err);
        const apiError = err.error as ApiError | undefined;
        this.users = [];
        this.roles = [];
        this.pageError = apiError?.message ?? '載入使用者與角色資料失敗，請稍後再試。';
        this.changeDetector.markForCheck();
      }
    });
  }

  openCreateForm(): void {
    this.isEditing = false;
    this.editingUserId = null;
    this.isFormOpen = true;
    this.formMessage = '';
    this.userForm.reset({
      email: '',
      password: '',
      isActive: 1,
      roleIds: [],
    });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
  }

  openEditForm(user: User): void {
    this.isEditing = true;
    this.editingUserId = user.id;
    this.isFormOpen = true;
    this.formMessage = '';
    this.userForm.reset({
      email: user.email,
      password: '',
      isActive: user.is_active,
      roleIds: user.roles?.map((role) => role.id) ?? [],
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
  }

  closeForm(): void {
    this.isFormOpen = false;
    this.isEditing = false;
    this.editingUserId = null;
    this.formMessage = '';
    this.userForm.reset({
      email: '',
      password: '',
      isActive: 1,
      roleIds: [],
    });
  }

  toggleRoleSelection(roleId: number): void {
    const selected = this.userForm.get('roleIds')?.value as number[];
    const current = selected ?? [];

    if (current.includes(roleId)) {
      this.userForm.patchValue({
        roleIds: current.filter((id) => id !== roleId),
      });
      return;
    }

    this.userForm.patchValue({
      roleIds: [...current, roleId],
    });
  }

  submitUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const payload: {
      email: string;
      password: string;
      isActive: 0 | 1;
      roleIds: number[];
    } = {
      email: this.userForm.value.email,
      password: this.userForm.value.password,
      isActive: Number(this.userForm.value.isActive) === 1 ? 1 : 0,
      roleIds: this.userForm.value.roleIds ?? [],
    };

    this.isSubmitting = true;
    this.formMessage = '';

    const request$ = this.isEditing && this.editingUserId !== null
      ? this.userService.updateUser(this.editingUserId, {
          isActive: payload.isActive,
          password: payload.password || undefined,
          roleIds: payload.roleIds,
        })
      : this.userService.createUser(payload);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isSubmitting = false;
        this.changeDetector.markForCheck();
      }),
    ).subscribe({
      next: () => {
        this.formMessage = this.isEditing ? '✅ 使用者更新成功' : '✅ 使用者建立成功';
        this.toastService.show(this.formMessage, 'success');
        this.loadUsers();
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

  deleteUser(user: User): void {
    if (!window.confirm(`確定要刪除 ${user.email} 嗎？`)) {
      return;
    }

    this.userService.deleteUser(user.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.users = this.users.filter((item) => item.id !== user.id);
        this.changeDetector.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        const apiError = err.error as ApiError | undefined;
        this.pageError = apiError?.message ?? '刪除失敗，請稍後再試。';
        this.changeDetector.markForCheck();
      },
    });
  }

  getRoleNames(user: User): string {
    return (user.roles ?? []).map((role) => role.name).join(', ') || '未分配角色';
  }

  getStatusText(value: number): string {
    return value === 1 ? '啟用中' : '停用';
  }
}
