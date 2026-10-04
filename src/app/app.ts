import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { ToastComponent } from './components/toast/toast.component';
import { ResumeService } from './services/resume.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
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
  protected readonly isAdminRoute = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.startsWith('/admin')),
    ),
    { initialValue: this.router.url.startsWith('/admin') },
  );

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
}
