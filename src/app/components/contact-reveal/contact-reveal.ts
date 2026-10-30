import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, signal } from '@angular/core';

let nextId = 0;

@Component({
  selector: 'app-contact-reveal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  templateUrl: './contact-reveal.html',
  styleUrl: './contact-reveal.css'
})
export class ContactRevealComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private copyTimer = 0;

  public readonly email = input.required<string>();
  public readonly label = input('聯絡我');
  public readonly open = signal(false);
  public readonly copied = signal(false);
  public readonly panelId = `contact-panel-${nextId++}`;

  constructor() {
    const onPointerDown = (event: PointerEvent) => {
      if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
        this.open.set(false);
      }
    };
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.open.set(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeydown);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeydown);
      window.clearTimeout(this.copyTimer);
    });
  }

  // 無 hover 的觸控裝置：點一下展開／收合；桌機維持直接寄信
  public onTrigger(event: MouseEvent): void {
    if (window.matchMedia('(hover: none)').matches) {
      event.preventDefault();
      this.open.update((value) => !value);
    }
  }

  public async copy(): Promise<void> {
    const email = this.email();
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const input = document.createElement('textarea');
      input.value = email;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    this.copied.set(true);
    window.clearTimeout(this.copyTimer);
    this.copyTimer = window.setTimeout(() => this.copied.set(false), 1800);
  }
}
