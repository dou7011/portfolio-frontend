import { Component, inject, OnInit } from '@angular/core'; // 🌟 引入 ChangeDetectorRef
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
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  public errorMessage = '';
  public isLoading = false;

  ngOnInit() {
    // 如果已經有 token，直接轉回首頁
    const token = this.authService.getToken();
    if (token) {
      this.router.navigate(['/']);
    }
  }

  public loginForm = this.fb.group({
    email: ['', Validators.required],
    password: ['', Validators.required]
  });

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    const credentials = this.loginForm.getRawValue() as any;

    // 🌟 這裡呼叫你剛改好的 service.login()
    this.authService.loginApi(credentials).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || '登入失敗，請檢查網路或後端狀態';
      }
    });
  }
}