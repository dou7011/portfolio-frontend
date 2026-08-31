import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly router = inject(Router);

  protected readonly title = signal('Ho-Tai Lin');
  protected readonly currentYear = new Date().getFullYear();
  protected readonly isDarkMode = signal(false);

  constructor() {
    const savedTheme = localStorage.getItem('portfolio-theme');
    this.setTheme(savedTheme === 'dark' || savedTheme === null);
  }

  protected toggleTheme(): void {
    this.setTheme(!this.isDarkMode());
  }

  private setTheme(isDark: boolean): void {
    this.isDarkMode.set(isDark);
    document.documentElement.dataset['theme'] = isDark ? 'dark' : 'light';
    localStorage.setItem('portfolio-theme', isDark ? 'dark' : 'light');
  }

  protected isAdminRoute(): boolean {
    return this.router.url.startsWith('/admin');
  }
}
