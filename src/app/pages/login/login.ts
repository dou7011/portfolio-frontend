import { Component, inject } from '@angular/core';
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
        // 🌟 只要進到 next，就代表後端回傳 200 OK，也就是絕對登入成功了！
        this.isLoading = false;
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        // 🌟 當故意打錯密碼，後端回傳 401 時，100% 會直接噴進這裡！
        this.isLoading = false;
        // 抓取後端傳回來的錯誤訊息，如果後端崩潰沒回應，就顯示後面的預設提示
        this.errorMessage = err.error?.message || '登入失敗，請檢查網路或後端狀態';
        console.error('登入出錯啦：', err);
      }
    });
  }
}