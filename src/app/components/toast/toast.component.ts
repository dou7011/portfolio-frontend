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
      [class.info]="type === 'info'"
      aria-live="polite"
      aria-atomic="true"
    >
      <span class="toast-icon" aria-hidden="true">{{ type === 'success' ? '✓' : type === 'error' ? '!' : 'i' }}</span>
      <div class="toast-copy">
        <strong>{{ title }}</strong>
        <span>{{ message }}</span>
      </div>
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      top: 18px;
      left: 50%;
      z-index: 2000;
      width: min(300px, calc(100vw - 32px));
      transform: translateX(-50%);
      pointer-events: none;
    }

    .toast-container {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--toast-border);
      border-left: 3px solid var(--toast-accent);
      border-radius: 9px;
      background: var(--toast-bg);
      box-shadow: 0 10px 24px var(--toast-shadow);
      color: var(--toast-text);
      backdrop-filter: blur(12px);
      opacity: 0;
      transform: translateY(-8px) scale(0.98);
      transition: opacity 0.22s ease, transform 0.22s ease;
    }

    .toast-container.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    .toast-container.success {
      --toast-bg: color-mix(in srgb, var(--color-success-soft) 88%, var(--color-surface));
      --toast-border: var(--color-success-border);
      --toast-accent: var(--color-success-text);
      --toast-text: var(--color-success-text);
      --toast-shadow: color-mix(in srgb, var(--color-success-text) 16%, transparent);
    }

    .toast-container.error {
      --toast-bg: color-mix(in srgb, var(--color-danger-soft) 88%, var(--color-surface));
      --toast-border: var(--color-danger-border-soft);
      --toast-accent: var(--color-danger-text);
      --toast-text: var(--color-danger-text);
      --toast-shadow: color-mix(in srgb, var(--color-danger-text) 16%, transparent);
    }

    .toast-container.info {
      --toast-bg: color-mix(in srgb, rgba(148, 163, 184, 0.16) 88%, var(--color-surface));
      --toast-border: rgba(148, 163, 184, 0.5);
      --toast-accent: #cbd5e1;
      --toast-text: #e2e8f0;
      --toast-shadow: rgba(148, 163, 184, 0.18);
    }

    .toast-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border: 1px solid currentColor;
      border-radius: 50%;
      background: transparent;
      font-weight: 700;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .toast-copy {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .toast-copy strong {
      font-size: 0.78rem;
      line-height: 1.2;
      font-weight: 700;
    }

    .toast-copy span {
      font-size: 0.7rem;
      color: var(--color-text-sub);
      line-height: 1.4;
      word-break: break-word;
    }

    @media (max-width: 640px) {
      :host {
        top: 12px;
        left: 50%;
        width: min(280px, calc(100vw - 32px));
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .toast-container {
        transition: opacity 0.1s ease;
        transform: none;
      }
    }
  `,
})
export class ToastComponent implements OnInit, OnDestroy {
  private readonly toastService = inject(ToastService);
  private readonly subscription = new Subscription();

  visible = false;
  type: 'success' | 'error' | 'info' = 'success';
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
