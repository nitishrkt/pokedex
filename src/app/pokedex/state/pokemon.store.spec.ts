import { TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';

import { createAppError } from '../../common/models/app-error.model';
import { errorState, loadingState, successState } from '../../common/models/async-state.model';
import { PokemonState } from '../models/pokemon-state.model';
import { Pokemon, PokemonDetail } from '../models/pokemon.model';
import { PokemonApiService } from '../services/pokemon-api.service';
import { makePokemon } from '../testing/pokemon.fixtures';
import { PokemonStore } from './pokemon.store';

const BULBASAUR = makePokemon(1, 'bulbasaur');
const PIKACHU = makePokemon(25, 'pikachu');
const PIKACHU_DETAIL: PokemonDetail = { ...PIKACHU, abilities: [] };

describe('PokemonStore', () => {
  let store: PokemonStore;
  let listRequests: Subject<Pokemon[]>[];
  let detailRequests: Subject<PokemonDetail>[];
  let api: Pick<PokemonApiService, 'getPokemonList$' | 'getPokemonDetail$'>;

  /** The current state; state$ replays it synchronously. */
  function snapshot(): PokemonState {
    let state: PokemonState | undefined;
    store.state$.subscribe((value) => (state = value)).unsubscribe();
    return state as PokemonState;
  }

  /** Each API call returns a new Subject the test settles by hand. */
  function pending<T>(requests: Subject<T>[]): () => Observable<T> {
    return () => {
      const request = new Subject<T>();
      requests.push(request);
      return request;
    };
  }

  beforeEach(() => {
    listRequests = [];
    detailRequests = [];
    api = {
      getPokemonList$: vi.fn(pending(listRequests)),
      getPokemonDetail$: vi.fn(pending(detailRequests)),
    };
    TestBed.configureTestingModule({ providers: [{ provide: PokemonApiService, useValue: api }] });
    store = TestBed.inject(PokemonStore);
  });

  describe('loadAll', () => {
    it('goes from loading to loaded and caches the entities in API order', () => {
      store.loadAll();
      expect(snapshot().listStatus).toBe('loading');

      listRequests[0].next([BULBASAUR, PIKACHU]);
      listRequests[0].complete();

      expect(snapshot()).toMatchObject({
        listStatus: 'loaded',
        listError: null,
        ids: [1, 25],
        entities: { 1: BULBASAUR, 25: PIKACHU },
      });
      expect(api.getPokemonList$).toHaveBeenCalledWith(1025);
    });

    it('makes one request for concurrent calls and none once loaded', () => {
      store.loadAll();
      store.loadAll();
      listRequests[0].next([PIKACHU]);
      listRequests[0].complete();
      store.loadAll();

      expect(api.getPokemonList$).toHaveBeenCalledTimes(1);
    });

    it('stores the error without throwing, and retries on the next call', () => {
      const error = createAppError('network');

      store.loadAll();
      expect(() => listRequests[0].error(error)).not.toThrow();
      expect(snapshot()).toMatchObject({ listStatus: 'error', listError: error, ids: [] });

      store.loadAll();
      expect(snapshot()).toMatchObject({ listStatus: 'loading', listError: null });
      listRequests[1].next([PIKACHU]);
      listRequests[1].complete();

      expect(api.getPokemonList$).toHaveBeenCalledTimes(2);
      expect(snapshot()).toMatchObject({ listStatus: 'loaded', ids: [25] });
    });

    it('drops the in-flight request when the store is destroyed', () => {
      store.loadAll();
      TestBed.resetTestingModule();

      expect(listRequests[0].observed).toBe(false);
    });
  });

  describe('loadDetail', () => {
    it('caches the detail, so a second call makes no request', () => {
      store.loadDetail(25);
      store.loadDetail(25);
      expect(snapshot().details[25]).toEqual(loadingState());

      detailRequests[0].next(PIKACHU_DETAIL);
      detailRequests[0].complete();
      store.loadDetail(25);

      expect(api.getPokemonDetail$).toHaveBeenCalledTimes(1);
      expect(snapshot().details[25]).toEqual(successState(PIKACHU_DETAIL));
    });

    it('re-requests after an error', () => {
      const error = createAppError('server');

      store.loadDetail(25);
      detailRequests[0].error(error);
      expect(snapshot().details[25]).toEqual(errorState(error));

      store.loadDetail(25);
      expect(snapshot().details[25]).toEqual(loadingState());
      expect(api.getPokemonDetail$).toHaveBeenCalledTimes(2);
    });

    it('loads different ids independently', () => {
      store.loadDetail(1);
      store.loadDetail(25);
      detailRequests[1].next(PIKACHU_DETAIL);

      expect(snapshot().details).toEqual({
        1: loadingState(),
        25: successState(PIKACHU_DETAIL),
      });
    });
  });

  describe('query setters', () => {
    it('starts a stat descending, name ascending, and flips on the same key', () => {
      store.setSort('speed');
      expect(snapshot().query.sort).toEqual({ key: 'speed', direction: 'desc' });

      store.setSort('speed');
      expect(snapshot().query.sort).toEqual({ key: 'speed', direction: 'asc' });

      store.setSort('totalStats');
      expect(snapshot().query.sort).toEqual({ key: 'totalStats', direction: 'desc' });

      store.setSort('name');
      expect(snapshot().query.sort).toEqual({ key: 'name', direction: 'asc' });

      store.setSort('hp', 'asc');
      expect(snapshot().query.sort).toEqual({ key: 'hp', direction: 'asc' });
    });

    it('ignores a sort that matches the current one', () => {
      store.setSort('hp', 'desc');
      store.setPage(3);
      const before = snapshot();

      store.setSort('hp', 'desc');

      expect(snapshot()).toBe(before);
    });

    it('returns to page 1 when the search, type, sort or page size changes', () => {
      const changes = [
        () => store.setSearch('pika'),
        () => store.setTypeFilter('electric'),
        () => store.setSort('attack'),
        () => store.setPageSize(50),
      ];

      for (const change of changes) {
        store.setPage(4);
        change();
        expect(snapshot().query.page).toBe(1);
      }
    });

    it('keeps the page when the search is set to the same text', () => {
      store.setSearch('pika');
      store.setPage(3);
      store.setSearch('pika');

      expect(snapshot().query).toMatchObject({ search: 'pika', page: 3 });
    });

    it('never stores a page below 1', () => {
      store.setPage(0);

      expect(snapshot().query.page).toBe(1);
    });
  });
});
