import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // 當網址是空的時候 (首頁)，載入 HomeComponent
  { path: '', loadComponent: () => import('./pages/home/home').then((m) => m.HomeComponent) },
  { path: 'login', loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent) },
  {
    path: 'resume',
    loadComponent: () =>
      import('./pages/resume/resume-interactive/resume-interactive').then(
        (m) => m.ResumeInteractiveComponent
      ),
  },
  {
    path: 'resume-formal',
    loadComponent: () =>
      import('./pages/resume/resume-formal/resume-formal').then((m) => m.ResumeFormalComponent),
  },
  {
    path: 'articles',
    loadComponent: () => import('./pages/articles/articles').then((m) => m.ArticlesComponent),
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin/admin').then((m) => m.AdminComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'resume',
        pathMatch: 'full',
      },
      {
        path: 'resume',
        loadComponent: () =>
          import('./pages/admin/resume-edit/resume-edit').then((m) => m.ResumeEditComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/admin/users/users').then((m) => m.UsersComponent),
      },
      {
        path: 'roles',
        loadComponent: () => import('./pages/admin/roles/roles').then((m) => m.RolesComponent),
      },
      {
        path: 'permissions',
        loadComponent: () =>
          import('./pages/admin/permissions/permissions').then((m) => m.PermissionsComponent),
      },
    ],
  },

  // 如果亂打網址，自動導回首頁
  { path: '**', redirectTo: '' },
];