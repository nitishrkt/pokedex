/** Visual and semantic kind of a toast; `error` is announced assertively. */
export type ToastKind = 'success' | 'error' | 'info';

/** One notification shown by the toast container. */
export interface Toast {
  readonly id: number;
  readonly kind: ToastKind;
  readonly message: string;
}
