import { MonoTypeOperatorFunction, retry, throwError, timer } from 'rxjs';

import { RETRY_BASE_DELAY_MS, RETRY_COUNT } from '../constants/api.constants';
import { AppErrorKind, isAppError } from '../models/app-error.model';

/** Error kinds that may succeed if the same request is sent again. */
const TRANSIENT_ERROR_KINDS: readonly AppErrorKind[] = ['network', 'server', 'rate-limit'];

/** Options for {@link retryTransient}. */
export interface RetryTransientOptions {
  /** Maximum number of retries after the first attempt. */
  count?: number;
  /** Delay before the first retry; it doubles on each later retry. */
  baseDelayMs?: number;
}

/** True for `network`, `server` and `rate-limit` AppErrors; others would fail the same way again. */
export function isTransientError(error: unknown): boolean {
  return isAppError(error) && TRANSIENT_ERROR_KINDS.includes(error.kind);
}

/**
 * Retries transient AppErrors with exponential backoff (500 ms, 1 s, 2 s), then
 * re-throws the last error. Idempotent queries only: never on a mutation, since
 * a retried create could insert a duplicate.
 */
export function retryTransient<T>(
  options: RetryTransientOptions = {},
): MonoTypeOperatorFunction<T> {
  const { count = RETRY_COUNT, baseDelayMs = RETRY_BASE_DELAY_MS } = options;

  return retry({
    count,
    delay: (error: unknown, retryCount: number) =>
      isTransientError(error)
        ? timer(baseDelayMs * 2 ** (retryCount - 1))
        : throwError(() => error),
  });
}
