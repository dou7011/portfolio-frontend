import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-logout',
  standalone: true,
  template: `
    @if (errorMessage) {
      <p>{{ errorMessage }}</p>
      <button type="button" (click)="logout()">重試</button>
    } @else {
      <p>正在登出...</p>
    }
  `,
})
export class LogoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  public errorMessage = '';

  constructor() {
    this.logout();
  }

  logout(): void {
    this.errorMessage = '';
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.errorMessage = '登出失敗，請確認網路後重試。';
      },
    });
  }
}
