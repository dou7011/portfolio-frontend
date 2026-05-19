import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  public errorMessage = '';
  public isLoading = false;

  // 建立表單控制項與驗證規則
  public loginForm = this.fb.group({
    email: ['', Validators.required],
    password: ['', Validators.required]
  });

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    const credentials = this.loginForm.getRawValue() as any;

    this.authService.loginApi(credentials).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.token) {
          localStorage.setItem('auth_token', res.token);
          this.cdr.detectChanges();
          this.router.navigate(['/admin']);
        } else {
          this.errorMessage = res.message || '登入失敗';
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || '登入失敗，請檢查網路狀態';
        this.cdr.detectChanges();
      }
    });
  }
}