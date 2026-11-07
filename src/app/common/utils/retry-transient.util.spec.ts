import { defer, Observable, of, throwError } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { AppErrorKind, createAppError } from '../models/app-error.model';
import { retryTransient } from './retry-transient.util';

describe('retryTransient', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  });

  /**
   * A cold source that fails with `kind` for the first `failures`
   * subscriptions, then emits 'ok'. `attempts()` counts subscriptions.
   */
  function flaky(kind: AppErrorKind, failures: number) {
    const error = createAppError(kind);
    let attempts = 0;
    const source$: Observable<string> = defer(() =>
      ++attempts <= failures ? throwError(() => error) : of('ok'),
    );
    return { source$, error, attempts: () => attempts };
  }

  it('retries a network error with exponential backoff, then succeeds', () => {
    const { source$, attempts } = flaky('network', 2);

    scheduler.run(({ expectObservable }) => {
      // Retries after 500 ms, then after another 1000 ms.
      expectObservable(source$.pipe(retryTransient())).toBe('1500ms (a|)', { a: 'ok' });
    });

    expect(attempts()).toBe(3);
  });

  it.each<AppErrorKind>(['server', 'rate-limit'])('retries a %s error', (kind) => {
    const { source$, attempts } = flaky(kind, 1);

    scheduler.run(({ expectObservable }) => {
      expectObservable(source$.pipe(retryTransient())).toBe('500ms (a|)', { a: 'ok' });
    });

    expect(attempts()).toBe(2);
  });

  it.each<AppErrorKind>(['graphql', 'client'])('does not retry a %s error', (kind) => {
    const { source$, error, attempts } = flaky(kind, 1);

    scheduler.run(({ expectObservable }) => {
      expectObservable(source$.pipe(retryTransient())).toBe('#', undefined, error);
    });

    expect(attempts()).toBe(1);
  });

  it('gives up after count retries and re-throws the last AppError', () => {
    const { source$, error, attempts } = flaky('server', Infinity);

    scheduler.run(({ expectObservable }) => {
      // 500 + 1000 + 2000 ms of backoff across 3 retries.
      expectObservable(source$.pipe(retryTransient())).toBe('3500ms #', undefined, error);
    });

    expect(attempts()).toBe(4);
  });

  it('honours custom count and base delay', () => {
    const { source$, error, attempts } = flaky('network', Infinity);

    scheduler.run(({ expectObservable }) => {
      expectObservable(source$.pipe(retryTransient({ count: 1, baseDelayMs: 100 }))).toBe(
        '100ms #',
        undefined,
        error,
      );
    });

    expect(attempts()).toBe(2);
  });

  it('does not retry errors that are not AppErrors', () => {
    const error = new Error('boom');
    let attempts = 0;
    const source$ = defer(() => {
      attempts++;
      return throwError(() => error);
    });

    scheduler.run(({ expectObservable }) => {
      expectObservable(source$.pipe(retryTransient())).toBe('#', undefined, error);
    });

    expect(attempts).toBe(1);
  });
});
