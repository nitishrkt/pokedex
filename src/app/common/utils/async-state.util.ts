import { catchError, map, Observable, of, OperatorFunction, startWith, throwIfEmpty } from 'rxjs';

import { createAppError, isAppError } from '../models/app-error.model';
import { AsyncState, errorState, loadingState, successState } from '../models/async-state.model';

/**
 * Maps a request into view state: emits `loading` first, then `success` for
 * each value, or a single `error` holding an AppError. A source that
 * completes without a value is an error too, so the view never stays in
 * `loading`. The returned stream never errors, so it is safe inside
 * `switchMap` and `toSignal`.
 *
 * Errors are expected to be AppErrors already (every API service normalizes
 * them); anything else becomes an `unknown` AppError so its details are
 * never shown.
 */
export function toAsyncState<T>(): OperatorFunction<T, AsyncState<T>> {
  return (source: Observable<T>) =>
    source.pipe(
      throwIfEmpty(() =>
        createAppError('unknown', { details: 'Source completed without emitting' }),
      ),
      map((data): AsyncState<T> => successState(data)),
      startWith(loadingState()),
      catchError((error: unknown) =>
        of(errorState(isAppError(error) ? error : createAppError('unknown', { details: error }))),
      ),
    );
}
