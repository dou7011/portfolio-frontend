import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ApiError } from '../../models/api.interface';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder).nonNullable;
  private authService = inject(AuthService);
  private router = inject(Router);

  public errorMessage = '';
  public isLoading = false;

  // email 追加格式驗證
  public loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  ngOnInit() {
    // The auth cookie is HttpOnly, so ask the API whether this browser is signed in.
    this.authService.verifyPermissions().subscribe({
      next: (res) => {
        if (res.success) {
          this.router.navigate(['/']);
        }
      },
      error: (_err: HttpErrorResponse) => undefined,
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    
    const credentials = this.loginForm.getRawValue();

    this.authService.loginApi(credentials).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        const apiError = err.error as ApiError | undefined;
        this.errorMessage = apiError?.message ?? '登入失敗，請檢查網路或後端狀態';
      }
    });
  }
}