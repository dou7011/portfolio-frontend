import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error';

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

    this.stateSubject.next({
      visible: true,
      title: title ?? (type === 'success' ? '更新成功' : '更新失敗'),
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
