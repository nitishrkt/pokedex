import { AppError } from '../../common/models/app-error.model';
import { TeamEntry } from './team.model';

/** Progress of loading the team list. */
export type TeamListStatus = 'idle' | 'loading' | 'loaded' | 'error';

/** Everything {@link TeamStore} holds. Never mutated; every change is a new object. */
export interface TeamState {
  /** Newest first. Optimistic (pending) teams are included. */
  readonly teams: readonly TeamEntry[];
  readonly status: TeamListStatus;
  /** Set only while `status` is `error`. */
  readonly error: AppError | null;
}
