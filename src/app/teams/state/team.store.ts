import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable } from 'rxjs';

import { AppError } from '../../common/models/app-error.model';
import { ToastService } from '../../common/services/toast.service';
import { DEFAULT_TRAINER_ID } from '../constants/team.constants';
import { TeamState } from '../models/team-state.model';
import { NewTeam, Team, TeamEntry } from '../models/team.model';
import { TeamApiService } from '../services/team-api.service';

const INITIAL_STATE: TeamState = { teams: [], status: 'idle', error: null };

/**
 * Root-level team list with optimistic create and delete, held in one
 * BehaviorSubject. A create shows the team at once as `pending`, then swaps in
 * the server's copy, or removes it and shows an error toast. A delete removes
 * the team at once and puts it back at the same position if the server fails.
 * Read it through `TeamSelectors`.
 */
@Injectable({ providedIn: 'root' })
export class TeamStore {
  private readonly api = inject(TeamApiService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly state = new BehaviorSubject<TeamState>(INITIAL_STATE);

  /** Every state change, starting with the current state. Read-only. */
  readonly state$: Observable<TeamState> = this.state.asObservable();

  /**
   * Loads the teams. A no-op while loading or once loaded; after an error it
   * retries. Failures land in `error`, never thrown. Optimistic teams created
   * meanwhile are kept in front of the loaded ones.
   */
  loadTeams(): void {
    const { status } = this.state.value;
    if (status === 'loading' || status === 'loaded') {
      return;
    }
    this.patch({ status: 'loading', error: null });

    this.api
      .getTeams$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (teams) => {
          const pending = this.state.value.teams.filter((team) => team.pending);
          this.patch({
            teams: [...pending, ...teams.map((team) => ({ ...team, pending: false }))],
            status: 'loaded',
          });
        },
        error: (error: AppError) => this.patch({ status: 'error', error }),
      });
  }

  /**
   * Adds the team to the list immediately, then creates it on the server.
   * On failure the team is removed again and an error toast explains why.
   * The trainer is always {@link DEFAULT_TRAINER_ID}: the app has no login.
   */
  createTeam(input: NewTeam): void {
    const createdAt = new Date().toISOString();
    const tempId = `temp-${crypto.randomUUID()}`;
    const known = this.state.value.teams.find((team) => team.trainerId === DEFAULT_TRAINER_ID);
    const optimistic: TeamEntry = {
      id: tempId,
      trainerId: DEFAULT_TRAINER_ID,
      name: input.name,
      pokemonIds: [...input.pokemonIds],
      createdAt,
      trainer: known?.trainer ?? null,
      pending: true,
    };
    this.patch({ teams: [optimistic, ...this.state.value.teams] });

    this.api
      .createTeam$({ ...input, trainerId: DEFAULT_TRAINER_ID, createdAt })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => this.replaceTeam(tempId, saved),
        error: (error: AppError) => {
          this.removeTeam(tempId);
          this.toast.error(`Couldn't create "${input.name}". ${error.message}`);
        },
      });
  }

  /**
   * Removes the team from the list immediately, then deletes it on the server.
   * On failure it returns to its old position and an error toast explains why.
   * Ignored for a team that is still being created.
   */
  deleteTeam(id: string): void {
    const teams = this.state.value.teams;
    const index = teams.findIndex((team) => team.id === id);
    const team = teams[index];
    if (!team || team.pending) {
      return;
    }
    this.patch({ teams: teams.filter((candidate) => candidate.id !== id) });

    this.api
      .deleteTeam$(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: AppError) => {
          this.restoreTeam(team, index);
          this.toast.error(`Couldn't delete "${team.name}". ${error.message}`);
        },
      });
  }

  private replaceTeam(tempId: string, saved: Team): void {
    this.patch({
      teams: this.state.value.teams.map((team) =>
        team.id === tempId ? { ...saved, pending: false } : team,
      ),
    });
  }

  private removeTeam(id: string): void {
    this.patch({ teams: this.state.value.teams.filter((team) => team.id !== id) });
  }

  private restoreTeam(team: TeamEntry, index: number): void {
    const teams = [...this.state.value.teams];
    teams.splice(Math.min(index, teams.length), 0, team);
    this.patch({ teams });
  }

  private patch(changes: Partial<TeamState>): void {
    this.state.next({ ...this.state.value, ...changes });
  }
}
