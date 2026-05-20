import { Component, inject } from '@angular/core';
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

  // 🌟 未來要新增選單，只要在這個陣列加一行就好！
  public menuItems = [
    { name: '履歷管理', path: 'resume' },
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