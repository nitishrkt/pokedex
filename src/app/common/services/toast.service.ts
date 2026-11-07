import { DestroyRef, inject, Injectable, signal } from '@angular/core';

import {
  TOAST_DURATION_MS,
  TOAST_ERROR_DURATION_MS,
  TOAST_MAX_VISIBLE,
} from '../constants/toast.constants';
import { Toast, ToastKind } from '../models/toast.model';

/** App-wide notifications, rendered by `app-toast-container`. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastsSignal = signal<readonly Toast[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 1;

  /** Toasts currently on screen, oldest first. */
  readonly toasts = this.toastsSignal.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.timers.forEach((timer) => clearTimeout(timer));
      this.timers.clear();
    });
  }

  /**
   * Shows a toast that dismisses itself after {@link TOAST_DURATION_MS}
   * ({@link TOAST_ERROR_DURATION_MS} for errors). Beyond
   * {@link TOAST_MAX_VISIBLE} toasts, the oldest is dismissed.
   * @returns The toast id, for an early {@link dismiss}.
   */
  show(message: string, kind: ToastKind = 'info'): number {
    const id = this.nextId++;
    this.toastsSignal.update((toasts) => [...toasts, { id, kind, message }]);
    this.startTimer(id, kind);

    const overflow = this.toastsSignal().length - TOAST_MAX_VISIBLE;
    if (overflow > 0) {
      this.toastsSignal()
        .slice(0, overflow)
        .forEach((toast) => this.dismiss(toast.id));
    }
    return id;
  }

  /** Shows a success toast. @returns The toast id. */
  success(message: string): number {
    return this.show(message, 'success');
  }

  /** Shows an error toast, which stays longer than the others. @returns The toast id. */
  error(message: string): number {
    return this.show(message, 'error');
  }

  /** Removes a toast and cancels its auto-dismiss timer. Unknown ids are ignored. */
  dismiss(id: number): void {
    this.clearTimer(id);
    this.toastsSignal.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  /** Stops a toast's auto-dismiss while it is hovered or focused. */
  pause(id: number): void {
    this.clearTimer(id);
  }

  /**
   * Restarts a paused toast's auto-dismiss with its full duration. Ignored
   * for a toast that is gone or already counting down.
   */
  resume(id: number): void {
    const toast = this.toastsSignal().find((candidate) => candidate.id === id);
    if (toast && !this.timers.has(id)) {
      this.startTimer(id, toast.kind);
    }
  }

  private startTimer(id: number, kind: ToastKind): void {
    const duration = kind === 'error' ? TOAST_ERROR_DURATION_MS : TOAST_DURATION_MS;
    this.timers.set(
      id,
      setTimeout(() => this.dismiss(id), duration),
    );
  }

  private clearTimer(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
  }
}
