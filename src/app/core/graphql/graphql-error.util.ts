import { HttpErrorResponse } from '@angular/common/http';
import { catchError, MonoTypeOperatorFunction, throwError, TimeoutError } from 'rxjs';

import { AppError, createAppError, isAppError } from '../../common/models/app-error.model';
import { LoggerService } from '../logger.service';
import { GraphqlResponse } from './graphql.model';

/** User-facing text for a request that hit `API_REQUEST_TIMEOUT_MS`. */
export const TIMEOUT_ERROR_MESSAGE =
  'The request took too long. Check your connection and try again.';

/**
 * Returns `data`, or throws a `graphql` AppError when `errors[]` is non-empty or
 * `data` is missing. Both APIs report query errors as HTTP 200 with `errors[]`.
 */
export function unwrapGraphqlResponse<TData>(response: GraphqlResponse<TData> | null): TData {
  if (response?.errors?.length) {
    throw createAppError('graphql', { details: { errors: response.errors } });
  }
  if (response?.data === undefined || response.data === null) {
    throw createAppError('graphql', { details: { reason: 'Response has no data', response } });
  }
  return response.data;
}

/**
 * Maps an `HttpErrorResponse` by status: 0 → `network`, 429 → `rate-limit`,
 * 5xx → `server`, other 4xx → `client`, anything else → `unknown`.
 */
export function httpErrorToAppError(error: HttpErrorResponse): AppError {
  const { status } = error;
  const details = { url: error.url, statusText: error.statusText, error: error.error };

  if (status === 0) {
    return createAppError('network', { status, details });
  }
  if (status === 429) {
    return createAppError('rate-limit', { status, details });
  }
  if (status >= 500) {
    return createAppError('server', { status, details });
  }
  if (status >= 400) {
    return createAppError('client', { status, details });
  }
  return createAppError('unknown', { status, details });
}

/**
 * Normalizes anything thrown in a data-layer pipeline. AppErrors pass through,
 * an RxJS `TimeoutError` becomes `network` (so it is retried), and anything
 * unrecognized becomes `unknown`.
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }
  if (error instanceof HttpErrorResponse) {
    return httpErrorToAppError(error);
  }
  if (error instanceof TimeoutError) {
    return createAppError('network', { message: TIMEOUT_ERROR_MESSAGE, details: error });
  }
  return createAppError('unknown', { details: error });
}

/**
 * Final step of an API service pipe: re-throws any error as an AppError.
 * Errors that were not AppErrors yet (such as a mapper `TypeError` from a
 * malformed response) are logged first, since nothing upstream saw them.
 */
export function normalizeAppError<T>(
  logger: LoggerService,
  operation: string,
): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown) => {
    const appError = toAppError(error);
    if (appError !== error) {
      logger.error(`${operation} failed (${appError.kind})`, { details: error });
    }
    return throwError(() => appError);
  });
}

/** Extracts the operation name (`GetPokemonList` in `query GetPokemonList {`) for logs. */
export function getOperationName(document: string): string {
  return /\b(?:query|mutation|subscription)\s+(\w+)/.exec(document)?.[1] ?? 'anonymous';
}
