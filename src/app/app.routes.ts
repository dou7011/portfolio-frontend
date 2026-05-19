import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register'; // 🌟 臨時註冊頁

export const routes: Routes = [
  // 當網址是空的時候 (首頁)，載入 HomeComponent
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }, // 🌟 臨時註冊頁
  // 如果亂打網址，自動導回首頁
  { path: '**', redirectTo: '' } 
];