import { effect, inject, Injectable, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { PokemonSelectors } from '../../pokedex/state/pokemon.selectors';
import { SELECTED_TEAM_STORAGE_KEY } from '../constants/team.constants';
import { TeamSummary } from '../models/team.model';
import { TeamSelectors } from '../state/team.selectors';
import { summarizeTeam } from '../utils/team-summary.util';

function readStoredId(): string | null {
  try {
    return localStorage.getItem(SELECTED_TEAM_STORAGE_KEY);
  } catch {
    return null; // storage blocked, e.g. a private window
  }
}

function writeStoredId(id: string | null): void {
  try {
    if (id === null) {
      localStorage.removeItem(SELECTED_TEAM_STORAGE_KEY);
    } else {
      localStorage.setItem(SELECTED_TEAM_STORAGE_KEY, id);
    }
  } catch {
    // Persisting is best effort; the selection still works for this session.
  }
}

/**
 * The selected team: restored from and persisted to localStorage, dropped
 * once the team no longer exists, with its type distribution and total base
 * stats as `computed` values over the team and Pokémon streams.
 */
@Injectable({ providedIn: 'root' })
export class SelectedTeamService {
  private readonly teams = toSignal(inject(TeamSelectors).teams$, { requireSync: true });
  private readonly teamsState = toSignal(inject(TeamSelectors).teamsState$, { requireSync: true });
  private readonly catalog = toSignal(inject(PokemonSelectors).catalog$, { requireSync: true });
  private readonly selectedIdSignal = signal<string | null>(readStoredId());

  /** Id of the selected team, which may not exist (yet); see {@link selectedTeam}. */
  readonly selectedId = this.selectedIdSignal.asReadonly();

  /** The selected team, or `null` when nothing is selected or it is gone. */
  readonly selectedTeam = computed(
    () => this.teams().find((team) => team.id === this.selectedIdSignal()) ?? null,
  );

  /**
   * Summary of the selected team: `null` without a selection, `'loading'`
   * or `'error'` while the Pokémon data is not available.
   */
  readonly summary = computed<TeamSummary | 'loading' | 'error' | null>(() => {
    const team = this.selectedTeam();
    const catalog = this.catalog();
    if (!team) {
      return null;
    }
    return catalog.status === 'success' ? summarizeTeam(team, catalog.data) : catalog.status;
  });

  constructor() {
    effect(() => writeStoredId(this.selectedIdSignal()));

    // Once the list has loaded, forget a selection whose team no longer exists
    // (the mock reuses ids, so a stale id could silently point at a new team).
    effect(() => {
      const id = this.selectedIdSignal();
      if (id !== null && this.teamsState().status === 'success' && !this.selectedTeam()) {
        this.selectedIdSignal.set(null);
      }
    });
  }

  /** Selects a team by id; selecting the selected team again clears it. */
  toggle(id: string): void {
    this.selectedIdSignal.update((current) => (current === id ? null : id));
  }
}
