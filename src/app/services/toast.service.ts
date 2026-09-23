import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// 1. 在這裡擴充型別，加入 'info'
export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  visible: boolean;
  title: string;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly stateSubject = new BehaviorSubject<ToastState>({
    visible: false,
    title: '更新成功',
    message: '',
    type: 'success',
  });

  public readonly state$ = this.stateSubject.asObservable();
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  show(message: string, type: ToastType = 'success', title?: string): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }

    // 2. 調整預設標題的判斷邏輯，讓 'info' 也有合適的預設標題
    let defaultTitle = '通知';
    if (type === 'success') defaultTitle = '更新成功';
    if (type === 'error') defaultTitle = '更新失敗';
    if (type === 'info') defaultTitle = '系統提示';

    this.stateSubject.next({
      visible: true,
      title: title ?? defaultTitle,
      message,
      type,
    });

    this.hideTimer = setTimeout(() => {
      this.hide();
    }, 5000);
  }

  hide(): void {
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      visible: false,
    });
  }
}