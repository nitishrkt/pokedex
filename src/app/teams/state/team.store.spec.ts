import { TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';

import { createAppError } from '../../common/models/app-error.model';
import { ToastService } from '../../common/services/toast.service';
import { TeamState } from '../models/team-state.model';
import { CreateTeamInput, Team } from '../models/team.model';
import { TeamApiService } from '../services/team-api.service';
import { TeamStore } from './team.store';

function makeTeam(id: string, name: string, pokemonIds = [25]): Team {
  return { id, trainerId: '1', name, pokemonIds, createdAt: '2024-01-01T00:00:00Z', trainer: null };
}

const KANTO = makeTeam('1', 'Kanto');
const JOHTO = makeTeam('2', 'Johto');
const HOENN = makeTeam('3', 'Hoenn');

describe('TeamStore', () => {
  let store: TeamStore;
  let toast: ToastService;
  let listRequests: Subject<Team[]>[];
  let createRequests: Subject<Team>[];
  let deleteRequests: Subject<void>[];
  let createInputs: CreateTeamInput[];

  function snapshot(): TeamState {
    let state: TeamState | undefined;
    store.state$.subscribe((value) => (state = value)).unsubscribe();
    return state as TeamState;
  }

  const names = (): string[] => snapshot().teams.map((team) => team.name);

  function pending<T>(requests: Subject<T>[]): () => Observable<T> {
    return () => {
      const request = new Subject<T>();
      requests.push(request);
      return request;
    };
  }

  /** Loads KANTO and JOHTO so each test starts from a loaded list. */
  function loadTwoTeams(): void {
    store.loadTeams();
    listRequests[0].next([KANTO, JOHTO]);
    listRequests[0].complete();
  }

  beforeEach(() => {
    listRequests = [];
    createRequests = [];
    deleteRequests = [];
    createInputs = [];
    const api: Pick<TeamApiService, 'getTeams$' | 'createTeam$' | 'deleteTeam$'> = {
      getTeams$: vi.fn(pending(listRequests)),
      createTeam$: vi.fn((input: CreateTeamInput) => {
        createInputs.push(input);
        return pending(createRequests)();
      }),
      deleteTeam$: vi.fn(pending(deleteRequests)),
    };
    TestBed.configureTestingModule({ providers: [{ provide: TeamApiService, useValue: api }] });
    store = TestBed.inject(TeamStore);
    toast = TestBed.inject(ToastService);
  });

  describe('loadTeams', () => {
    it('goes from loading to loaded', () => {
      store.loadTeams();
      expect(snapshot().status).toBe('loading');
      loadTwoTeams();
      expect(snapshot()).toMatchObject({ status: 'loaded', error: null });
      expect(names()).toEqual(['Kanto', 'Johto']);
    });

    it('is a no-op while loading and retries after an error', () => {
      store.loadTeams();
      store.loadTeams();
      expect(listRequests.length).toBe(1);

      const error = createAppError('network');
      listRequests[0].error(error);
      expect(snapshot()).toMatchObject({ status: 'error', error });

      store.loadTeams();
      expect(listRequests.length).toBe(2);
      expect(snapshot().status).toBe('loading');
    });
  });

  describe('createTeam', () => {
    it('shows the team at once as pending, then swaps in the server copy', () => {
      loadTwoTeams();
      store.createTeam({ name: 'Hoenn', pokemonIds: [252, 255] });

      expect(names()).toEqual(['Hoenn', 'Kanto', 'Johto']);
      expect(snapshot().teams[0]).toMatchObject({ pending: true, pokemonIds: [252, 255] });
      expect(snapshot().teams[0].id).toMatch(/^temp-/);
      expect(createInputs[0]).toMatchObject({ name: 'Hoenn', trainerId: '1' });

      createRequests[0].next(HOENN);
      createRequests[0].complete();

      expect(snapshot().teams[0]).toEqual({ ...HOENN, pending: false });
      expect(snapshot().teams.length).toBe(3);
    });

    it('rolls back and shows an error toast when the server fails', () => {
      loadTwoTeams();
      store.createTeam({ name: 'Hoenn', pokemonIds: [252] });
      expect(names()).toContain('Hoenn');

      createRequests[0].error(createAppError('network', { message: 'Server is down.' }));

      expect(names()).toEqual(['Kanto', 'Johto']);
      expect(toast.toasts()).toEqual([
        expect.objectContaining({
          kind: 'error',
          message: expect.stringContaining('Server is down.'),
        }),
      ]);
    });

    it('keeps a pending team when the list finishes loading afterwards', () => {
      store.loadTeams();
      store.createTeam({ name: 'Hoenn', pokemonIds: [252] });
      listRequests[0].next([KANTO]);

      expect(names()).toEqual(['Hoenn', 'Kanto']);
    });
  });

  describe('deleteTeam', () => {
    it('removes the team at once and keeps it removed on success', () => {
      loadTwoTeams();
      store.deleteTeam('1');
      expect(names()).toEqual(['Johto']);

      deleteRequests[0].next();
      deleteRequests[0].complete();
      expect(names()).toEqual(['Johto']);
      expect(toast.toasts()).toEqual([]);
    });

    it('puts the team back at its old position and toasts when the server fails', () => {
      loadTwoTeams();
      store.deleteTeam('1');
      deleteRequests[0].error(createAppError('server'));

      expect(names()).toEqual(['Kanto', 'Johto']);
      expect(toast.toasts()[0]).toMatchObject({ kind: 'error' });
      expect(toast.toasts()[0].message).toContain('Kanto');
    });

    it('ignores pending and unknown teams', () => {
      loadTwoTeams();
      store.createTeam({ name: 'Hoenn', pokemonIds: [252] });
      store.deleteTeam(snapshot().teams[0].id);
      store.deleteTeam('99');

      expect(deleteRequests.length).toBe(0);
      expect(names()).toEqual(['Hoenn', 'Kanto', 'Johto']);
    });
  });
});
