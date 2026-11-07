import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Message for a successful load with nothing to show. Project an optional
 * action (e.g. a "Clear filters" button) as content.
 */
@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly heading = input.required<string>();
  readonly message = input<string>();
  /** Smaller, icon-less layout for tight places such as a dropdown. */
  readonly compact = input(false);
}
