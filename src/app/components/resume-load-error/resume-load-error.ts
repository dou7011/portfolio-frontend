import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-resume-load-error',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './resume-load-error.html',
  styleUrl: './resume-load-error.css',
})
export class ResumeLoadErrorComponent {
  readonly isEnglish = input(false);
  readonly retry = output<void>();
  readonly toggleLanguage = output<void>();
}
