import { EMPTY, Observable, of, Subject, switchMap, throwError } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { createAppError } from '../models/app-error.model';
import { errorState, loadingState, successState } from '../models/async-state.model';
import { toAsyncState } from './async-state.util';

describe('toAsyncState', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  });

  it('emits loading, then success with the value', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|', { a: [1, 2] });

      expectObservable(source$.pipe(toAsyncState())).toBe('l-s|', {
        l: loadingState(),
        s: successState([1, 2]),
      });
    });
  });

  it('emits loading, then error with the AppError, and completes without erroring', () => {
    const error = createAppError('network');

    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold<number>('--#', undefined, error);

      expectObservable(source$.pipe(toAsyncState())).toBe('l-(e|)', {
        l: loadingState(),
        e: errorState(error),
      });
    });
  });

  it('turns a source that completes without a value into an unknown error', () => {
    const states: unknown[] = [];

    EMPTY.pipe(toAsyncState()).subscribe((state) => states.push(state));

    expect(states).toEqual([
      loadingState(),
      { status: 'error', error: expect.objectContaining({ kind: 'unknown' }) },
    ]);
  });

  it('wraps a non-AppError as an unknown AppError', () => {
    const states: unknown[] = [];

    throwError(() => new TypeError('boom'))
      .pipe(toAsyncState())
      .subscribe((state) => states.push(state));

    expect(states[1]).toMatchObject({
      status: 'error',
      error: { kind: 'unknown', message: expect.any(String) },
    });
  });

  it('keeps an outer switchMap alive after an inner request fails', () => {
    const ids$ = new Subject<number>();
    const states: unknown[] = [];
    let outerErrored = false;

    ids$
      .pipe(
        switchMap((id) => {
          const request$: Observable<string> =
            id === 1 ? throwError(() => createAppError('server')) : of(`pokemon-${id}`);
          return request$.pipe(toAsyncState());
        }),
      )
      .subscribe({ next: (state) => states.push(state), error: () => (outerErrored = true) });

    ids$.next(1);
    ids$.next(2);

    expect(outerErrored).toBe(false);
    expect(states).toEqual([
      loadingState(),
      errorState(createAppError('server')),
      loadingState(),
      successState('pokemon-2'),
    ]);
  });
});
