import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { LoginComponent } from './pages/login/login';
import { AdminComponent } from './pages/admin/admin/admin';
import { ResumeEditComponent } from './pages/admin/resume-edit/resume-edit';
<<<<<<< HEAD
=======
import { UsersComponent} from './pages/admin/users/users';

>>>>>>> 0a89780 (	modified:   src/app/app.routes.ts)

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // 當網址是空的時候 (首頁)，載入 HomeComponent
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { 
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard],
    children:[
      {
        path: '',
        redirectTo: 'resume',
        pathMatch: 'full'
      },
      {
        path:'resume',
        component: ResumeEditComponent
<<<<<<< HEAD
=======
      },
      {
        path: 'users',
        component: UsersComponent
>>>>>>> 0a89780 (	modified:   src/app/app.routes.ts)
      }
    ]
  },
  
  // 如果亂打網址，自動導回首頁
  { path: '**', redirectTo: '' } 
];