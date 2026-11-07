/**
 * Failure category: `network` (no response or timeout), `server` (5xx), `rate-limit` (429),
 * `client` (other 4xx, or e.g. unknown id), `graphql` (200 with `errors[]` or no `data`), `unknown`.
 */
export type AppErrorKind = 'network' | 'server' | 'rate-limit' | 'client' | 'graphql' | 'unknown';

/** Every {@link AppErrorKind}, for runtime checks. */
export const APP_ERROR_KINDS: readonly AppErrorKind[] = [
  'network',
  'server',
  'rate-limit',
  'client',
  'graphql',
  'unknown',
];

/**
 * Normalized error emitted by every data-layer Observable. A plain object,
 * not an `Error` subclass, so stores and templates can hold and copy it.
 */
export interface AppError {
  readonly kind: AppErrorKind;
  /** User-friendly text that the UI may show as is. */
  readonly message: string;
  /** HTTP status, when the failure came from an HTTP response. */
  readonly status?: number;
  /** Technical context for logs only. Never render it. */
  readonly details: unknown;
}

/** Default user-facing message for each error kind. */
export const APP_ERROR_MESSAGES: Readonly<Record<AppErrorKind, string>> = {
  network: "Can't connect right now. Check your internet connection and try again.",
  server: 'The server is having trouble right now. Please try again in a moment.',
  'rate-limit': 'Too many requests. Please wait a moment and try again.',
  client: "The request couldn't be completed.",
  graphql: "The server couldn't process this request. Please try again.",
  unknown: 'Something unexpected went wrong. Please try again.',
};

/** Creates an {@link AppError}; `options.message` overrides the kind's default text. */
export function createAppError(
  kind: AppErrorKind,
  options: { message?: string; status?: number; details?: unknown } = {},
): AppError {
  const { message = APP_ERROR_MESSAGES[kind], status, details } = options;
  return { kind, message, status, details };
}

/** Type guard for {@link AppError}. */
export function isAppError(value: unknown): value is AppError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<Record<keyof AppError, unknown>>;
  return (
    typeof candidate.kind === 'string' &&
    APP_ERROR_KINDS.includes(candidate.kind as AppErrorKind) &&
    typeof candidate.message === 'string'
  );
}
