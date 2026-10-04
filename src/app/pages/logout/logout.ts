import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-logout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (errorMessage()) {
      <p>{{ errorMessage() }}</p>
      <button type="button" (click)="logout()">重試</button>
    } @else {
      <p>正在登出...</p>
    }
  `,
})
export class LogoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  public readonly errorMessage = signal('');

  constructor() {
    this.logout();
  }

  logout(): void {
    this.errorMessage.set('');
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.errorMessage.set('登出失敗，請確認網路後重試。');
      },
    });
  }
}
