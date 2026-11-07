import { AppError } from './app-error.model';

/** Request in flight; the view shows a skeleton or spinner. */
export interface LoadingState {
  readonly status: 'loading';
}

/** Request finished; an empty `data` (e.g. `[]`) is the view's empty state. */
export interface SuccessState<T> {
  readonly status: 'success';
  readonly data: T;
}

/** Request failed; the view shows `error.message` with a Retry action. */
export interface ErrorState {
  readonly status: 'error';
  readonly error: AppError;
}

/**
 * UI state of one async view. There is no `idle`: a view that has nothing
 * to load (no Pokémon selected, empty search) is simply not rendered.
 */
export type AsyncState<T> = LoadingState | SuccessState<T> | ErrorState;

const LOADING: LoadingState = { status: 'loading' };

/** Creates a {@link LoadingState}. */
export function loadingState(): LoadingState {
  return LOADING;
}

/** Creates a {@link SuccessState} holding `data`. */
export function successState<T>(data: T): SuccessState<T> {
  return { status: 'success', data };
}

/** Creates an {@link ErrorState} holding `error`. */
export function errorState(error: AppError): ErrorState {
  return { status: 'error', error };
}
