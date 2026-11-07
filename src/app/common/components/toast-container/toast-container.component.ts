import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService } from '../../services/toast.service';

/**
 * Renders {@link ToastService} toasts in one polite live region that is
 * always in the DOM, so screen readers announce each toast added to it.
 * Auto-dismiss pauses while a toast is hovered or focused.
 */
@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
}
