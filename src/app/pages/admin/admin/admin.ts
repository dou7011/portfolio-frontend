import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive], // 🌟 引入路由相關模組
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent {
  private authService = inject(AuthService);
  public isLogoutModalOpen = false;
  public readonly isDarkMode = signal(false);

  constructor() {
    this.setTheme(localStorage.getItem('portfolio-theme') === 'dark');
  }

  toggleTheme() {
    this.setTheme(!this.isDarkMode());
  }

  private setTheme(isDark: boolean) {
    this.isDarkMode.set(isDark);
    document.documentElement.dataset['theme'] = isDark ? 'dark' : 'light';
    localStorage.setItem('portfolio-theme', isDark ? 'dark' : 'light');
  }

  public menuItems = [
    { name: '履歷管理', path: 'resume' },
    {
      name: '身分管理',
      path: 'identity',
      children: [
        { name: '使用者管理', path: 'users' },
        { name: '角色管理', path: 'roles' },
        { name: '權限管理', path: 'permissions' },
      ],
    },
    // { name: '文章管理', path: 'articles' }, // 之後新增只要解開註解
    // { name: '系統設定', path: 'settings' }
  ];

  onLogout() {
    this.isLogoutModalOpen = true;
  }

  closeLogoutModal() {
    this.isLogoutModalOpen = false;
  }

  confirmLogout() {
    this.isLogoutModalOpen = false;

    this.authService.logout();
  }
}