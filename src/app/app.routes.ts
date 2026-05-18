import { Routes } from '@angular/router';
// 注意這裡的引入路徑是你的 home.ts
import { HomeComponent } from './pages/home/home'; 

export const routes: Routes = [
  // 當網址是空的時候 (首頁)，載入 HomeComponent
  { path: '', component: HomeComponent },
  // 如果亂打網址，自動導回首頁
  { path: '**', redirectTo: '' } 
];