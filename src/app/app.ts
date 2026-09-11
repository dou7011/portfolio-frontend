import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { ToastComponent } from './components/toast/toast.component';
import { ResumeService } from './services/resume.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly resumeService = inject(ResumeService);

  protected readonly title = signal('Ho-Tai Lin');
  protected readonly currentYear = new Date().getFullYear();
  protected readonly isDarkMode = signal(false);
  protected readonly resumeData = this.resumeService.resumeData;

  constructor() {
    const savedTheme = localStorage.getItem('portfolio-theme');
    this.setTheme(savedTheme === 'dark' || savedTheme === null);
  }

  ngOnInit(): void {
    this.resumeService.getResumeData('zh').subscribe({
      error: (error) => console.error('Failed to load resume contact details', error),
    });
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
