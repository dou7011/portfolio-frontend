import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { ResumeInteractiveComponent } from './pages/resume/resume-interactive/resume-interactive';
import { ResumeFormalComponent } from './pages/resume/resume-formal/resume-formal';
import { LoginComponent } from './pages/login/login';
import { AdminComponent } from './pages/admin/admin/admin';
import { ResumeEditComponent } from './pages/admin/resume-edit/resume-edit';
import { UsersComponent } from './pages/admin/users/users';
import { RolesComponent } from './pages/admin/roles/roles';
import { PermissionsComponent } from './pages/admin/permissions/permissions';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // 當網址是空的時候 (首頁)，載入 HomeComponent
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'resume', component: ResumeInteractiveComponent },
  { path: 'resume-formal', component: ResumeFormalComponent },
  { path: 'resumective', component: ResumeInteractiveComponent },
  {  path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'resume',
        pathMatch: 'full',
      },
      {
        path: 'resume',
        component: ResumeEditComponent,
      },
      {
        path: 'users',
        component: UsersComponent,
      },
      {
        path: 'roles',
        component: RolesComponent,
      },
      {
        path: 'permissions',
        component: PermissionsComponent,
      },
    ],
  },

  // 如果亂打網址，自動導回首頁
  { path: '**', redirectTo: '' },
];