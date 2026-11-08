import { inject, Injectable } from '@angular/core';
import { distinctUntilChanged, map, Observable, shareReplay } from 'rxjs';

import {
  AsyncState,
  errorState,
  loadingState,
  successState,
} from '../../common/models/async-state.model';
import { TeamEntry } from '../models/team.model';
import { TeamStore } from './team.store';

/**
 * Derived, read-only streams over {@link TeamStore}. Every stream emits
 * synchronously on subscribe, so `toSignal(…, { requireSync: true })` works.
 */
@Injectable({ providedIn: 'root' })
export class TeamSelectors {
  private readonly state$ = inject(TeamStore).state$;

  /** All teams, newest first, including pending ones. Emits only when the list changes. */
  readonly teams$: Observable<readonly TeamEntry[]> = this.state$.pipe(
    map((state) => state.teams),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** Loading until the first load finishes, then the teams or the load error. */
  readonly teamsState$: Observable<AsyncState<readonly TeamEntry[]>> = this.state$.pipe(
    map((state): AsyncState<readonly TeamEntry[]> => {
      if (state.status === 'loaded') {
        return successState(state.teams);
      }
      return state.status === 'error' && state.error ? errorState(state.error) : loadingState();
    }),
    distinctUntilChanged(
      (previous, current) =>
        previous.status === current.status &&
        (previous.status !== 'success' ||
          (current.status === 'success' && previous.data === current.data)) &&
        (previous.status !== 'error' ||
          (current.status === 'error' && previous.error === current.error)),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
