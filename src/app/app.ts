import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly router = inject(Router);

  protected readonly title = signal('My Portfolio');
  protected readonly currentYear = new Date().getFullYear();

  protected isAdminRoute(): boolean {
    return this.router.url.startsWith('/admin');
  }
}
