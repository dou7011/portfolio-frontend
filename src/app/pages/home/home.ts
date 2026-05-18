import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // 引入 CommonModule 才能使用內建管線
import { ResumeService } from '../../services/resume';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './home.html', // 這裡對應你的 HTML 檔名
  styleUrl: './home.css'      // 這裡對應你的 CSS 檔名
})
export class HomeComponent implements OnInit {
  // 1. 注入我們寫好的 Service
  private resumeService = inject(ResumeService);
  
  // 2. 宣告一個變數來裝等等從後端拿到的資料
  public resumeData: any = null;

  // 3. OnInit 是 Angular 的生命週期，代表「元件一載入時要執行的事情」
  ngOnInit(): void {
    this.resumeService.getResumeData().subscribe({
      next: (res) => {
        console.log('成功從 API 拿到資料！', res);
        this.resumeData = res; // 把拿到的資料存進變數裡
      },
      error: (err) => {
        console.error('API 呼叫失敗：', err);
      }
    });
  }
}