import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { AppError } from '../../models/app-error.model';

/**
 * Failed-load message with a Retry button. Takes the AppError itself so
 * callers pass `state.error` straight through; only its user-friendly
 * `message` is rendered, never `details`.
 */
@Component({
  selector: 'app-error-state',
  templateUrl: './error-state.component.html',
  styleUrl: './error-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  readonly error = input.required<AppError>();
  readonly heading = input('Something went wrong');
  /** Single-line layout for tight places such as a dropdown. */
  readonly compact = input(false);

  readonly retry = output<void>();
}
