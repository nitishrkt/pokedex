import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import {
  AsyncState,
  errorState,
  loadingState,
  successState,
} from '../../common/models/async-state.model';
import { createAppError } from '../../common/models/app-error.model';
import { Pokemon } from '../../pokedex/models/pokemon.model';
import { PokemonSelectors } from '../../pokedex/state/pokemon.selectors';
import { makePokemon } from '../../pokedex/testing/pokemon.fixtures';
import { SELECTED_TEAM_STORAGE_KEY } from '../constants/team.constants';
import { TeamEntry } from '../models/team.model';
import { TeamSelectors } from '../state/team.selectors';
import { SelectedTeamService } from './selected-team.service';

function entry(id: string, pokemonIds: number[]): TeamEntry {
  return {
    id,
    trainerId: '1',
    name: `Team ${id}`,
    pokemonIds,
    createdAt: '2024-01-01T00:00:00Z',
    trainer: null,
    pending: false,
  };
}

describe('SelectedTeamService', () => {
  const pikachu = makePokemon(25, 'pikachu', ['electric']);
  const charizard = makePokemon(6, 'charizard', ['fire', 'flying']);

  let teams$: BehaviorSubject<readonly TeamEntry[]>;
  let teamsState$: BehaviorSubject<AsyncState<readonly TeamEntry[]>>;
  let catalog$: BehaviorSubject<AsyncState<Record<number, Pokemon>>>;

  function create(): SelectedTeamService {
    TestBed.configureTestingModule({
      providers: [
        { provide: TeamSelectors, useValue: { teams$, teamsState$ } },
        { provide: PokemonSelectors, useValue: { catalog$ } },
      ],
    });
    return TestBed.inject(SelectedTeamService);
  }

  beforeEach(() => {
    localStorage.clear();
    const initial = [entry('1', [25, 6]), entry('2', [25])];
    teams$ = new BehaviorSubject<readonly TeamEntry[]>(initial);
    teamsState$ = new BehaviorSubject<AsyncState<readonly TeamEntry[]>>(successState(initial));
    catalog$ = new BehaviorSubject<AsyncState<Record<number, Pokemon>>>(
      successState({ 25: pikachu, 6: charizard }),
    );
  });

  it('computes the summary of the selected team', () => {
    const service = create();
    expect(service.summary()).toBeNull();

    service.toggle('1');
    expect(service.summary()).toEqual({
      typeDistribution: [
        { type: 'fire', count: 1 },
        { type: 'electric', count: 1 },
        { type: 'flying', count: 1 },
      ],
      totalBaseStats: 600,
      unresolvedCount: 0,
    });
  });

  it('reports loading and error while the Pokémon data is unavailable', () => {
    const service = create();
    service.toggle('1');

    catalog$.next(loadingState());
    expect(service.summary()).toBe('loading');

    catalog$.next(errorState(createAppError('network')));
    expect(service.summary()).toBe('error');
  });

  it('persists the selection to localStorage and clears it again', async () => {
    const service = create();
    service.toggle('2');
    TestBed.tick();
    expect(localStorage.getItem(SELECTED_TEAM_STORAGE_KEY)).toBe('2');

    service.toggle('2');
    TestBed.tick();
    expect(localStorage.getItem(SELECTED_TEAM_STORAGE_KEY)).toBeNull();
  });

  it('restores a stored selection', () => {
    localStorage.setItem(SELECTED_TEAM_STORAGE_KEY, '2');
    expect(create().selectedTeam()?.id).toBe('2');
  });

  it('drops a stored id that matches no loaded team', () => {
    localStorage.setItem(SELECTED_TEAM_STORAGE_KEY, '42');
    const service = create();
    TestBed.tick();

    expect(service.selectedId()).toBeNull();
    expect(localStorage.getItem(SELECTED_TEAM_STORAGE_KEY)).toBeNull();
  });

  it('clears the selection when its team is deleted', () => {
    const service = create();
    service.toggle('1');
    TestBed.tick();

    const rest = [entry('2', [25])];
    teams$.next(rest);
    teamsState$.next(successState(rest));
    TestBed.tick();

    expect(service.selectedId()).toBeNull();
  });
});
