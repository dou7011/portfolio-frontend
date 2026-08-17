import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="toast-container"
      [class.visible]="visible"
      [class.success]="type === 'success'"
      [class.error]="type === 'error'"
      aria-live="polite"
      aria-atomic="true"
    >
      <span class="toast-icon" aria-hidden="true">{{ type === 'success' ? '✓' : '!' }}</span>
      <div class="toast-copy">
        <strong>{{ title }}</strong>
        <span>{{ message }}</span>
      </div>
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      top: 22px;
      left: 50%;
      z-index: 2000;
      transform: translateX(-50%);
      pointer-events: none;
    }

    .toast-container {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: min(420px, calc(100vw - 32px));
      max-width: min(520px, calc(100vw - 32px));
      padding: 14px 16px;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.65);
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      box-shadow: 0 18px 34px rgba(68, 53, 43, 0.18);
      opacity: 0;
      transform: translateY(-18px);
      transition: opacity 0.38s ease, transform 0.42s ease;
    }

    .toast-container.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .toast-container.success {
      background: linear-gradient(135deg, rgba(245, 250, 246, 0.96), rgba(226, 243, 231, 0.94));
      border-color: rgba(108, 169, 120, 0.3);
      color: #2d5e3e;
    }

    .toast-container.error {
      background: linear-gradient(135deg, rgba(255, 244, 242, 0.96), rgba(252, 232, 227, 0.94));
      border-color: rgba(176, 90, 74, 0.2);
      color: #8b4136;
    }

    .toast-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: rgba(80, 144, 96, 0.12);
      font-weight: 800;
      font-size: 0.9rem;
      flex-shrink: 0;
    }

    .toast-container.error .toast-icon {
      background: rgba(176, 90, 74, 0.12);
    }

    .toast-copy {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }

    .toast-copy strong {
      font-size: 0.8rem;
      line-height: 1.2;
    }

    .toast-copy span {
      font-size: 0.72rem;
      opacity: 0.9;
      line-height: 1.4;
      word-break: break-word;
    }
  `,
})
export class ToastComponent implements OnInit, OnDestroy {
  private readonly toastService = inject(ToastService);
  private readonly subscription = new Subscription();

  visible = false;
  type: 'success' | 'error' = 'success';
  title = '更新成功';
  message = '';

  ngOnInit(): void {
    this.subscription.add(
      this.toastService.state$.subscribe((state) => {
        this.visible = state.visible;
        this.type = state.type;
        this.title = state.title;
        this.message = state.message;
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
