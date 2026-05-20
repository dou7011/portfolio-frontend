import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-resume-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './resume-edit.html',
  styleUrl: './resume-edit.css'
})
export class ResumeEditComponent implements OnInit {
  private fb = inject(FormBuilder);

  public currentLang: 'zh' | 'en' = 'zh';
  public isSaving = false;
  public saveMessage = '';

  // 建立響應式表單
  public resumeForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    title: ['', Validators.required],
    about: ['', Validators.required],
    // 實務上這裡還可以加上 skills, experiences 等陣列型態的 FormArray
  });

  ngOnInit() {
    this.loadResumeData();
  }

  // 切換編輯語系
  switchLang(lang: 'zh' | 'en') {
    if (this.currentLang === lang) return;
    this.currentLang = lang;
    this.loadResumeData();
  }

  // 模擬/實際載入資料
  loadResumeData() {
    // 這裡先放空，等待之後串接 GET /api/resume?lang=xxx
    // 實務上拿到資料後會用 this.resumeForm.patchValue(data) 把資料塞進表單
    this.resumeForm.reset();
    console.log(`載入 ${this.currentLang} 語系資料...`);
  }

  // 儲存表單
  onSubmit() {
    if (this.resumeForm.invalid) {
      this.resumeForm.markAllAsTouched(); // 讓沒填的欄位亮紅框
      return;
    }

    this.isSaving = true;
    this.saveMessage = '';
    const formData = {
      lang: this.currentLang,
      ...this.resumeForm.getRawValue()
    };

    // 準備打 API 更新資料 (目前先用 console.log 示意)
    console.log('準備儲存的資料：', formData);
    
    // 模擬 API 延遲
    setTimeout(() => {
      this.isSaving = false;
      this.saveMessage = '🎉 儲存成功！';
      setTimeout(() => this.saveMessage = '', 3000); // 3秒後隱藏訊息
    }, 800);
  }
}