import { TestBed } from '@angular/core/testing';
import { Observable, Subject, Subscription } from 'rxjs';

import { createAppError } from '../../common/models/app-error.model';
import {
  AsyncState,
  errorState,
  loadingState,
  successState,
} from '../../common/models/async-state.model';
import { PokemonTableView } from '../models/pokemon-state.model';
import { Pokemon, PokemonDetail } from '../models/pokemon.model';
import { PokemonApiService } from '../services/pokemon-api.service';
import { makePokemon } from '../testing/pokemon.fixtures';
import { filterPokemon, paginate, PokemonSelectors, sortPokemon } from './pokemon.selectors';
import { PokemonStore } from './pokemon.store';

const BULBASAUR = makePokemon(1, 'bulbasaur', ['grass', 'poison'], { speed: 45 });
const CHARMANDER = makePokemon(4, 'charmander', ['fire'], { speed: 65 });
const PIKACHU = makePokemon(25, 'pikachu', ['electric'], { speed: 90 });
const RAICHU = makePokemon(26, 'raichu', ['electric'], { speed: 110 });
const ARCANINE = makePokemon(59, 'arcanine', ['fire'], { speed: 90, hp: 90 });
const PICHU = makePokemon(172, 'pichu', ['electric'], { speed: 60 });

/** Pokédex (id) order, as the API returns it. */
const ALL = [BULBASAUR, CHARMANDER, PIKACHU, RAICHU, ARCANINE, PICHU];

const names = (list: readonly Pokemon[]) => list.map((pokemon) => pokemon.name);

/** The success data of a table state, or a failure naming the actual status. */
function view(state: AsyncState<PokemonTableView> | undefined): PokemonTableView {
  if (state?.status !== 'success') {
    throw new Error(`Expected a success state, got ${state?.status}`);
  }
  return state.data;
}

describe('pokemon selector functions', () => {
  describe('filterPokemon', () => {
    it('matches names that contain the term, ignoring case and outer spaces', () => {
      expect(names(filterPokemon(ALL, '  PI ', null))).toEqual(['pikachu', 'pichu']);
    });

    it('treats spaces and hyphens alike, so "mr mime" finds the slug mr-mime', () => {
      const list = [makePokemon(122, 'mr-mime', ['psychic', 'fairy']), PIKACHU];

      expect(names(filterPokemon(list, 'Mr Mime', null))).toEqual(['mr-mime']);
      expect(names(filterPokemon(list, 'mr-mime', null))).toEqual(['mr-mime']);
      expect(names(filterPokemon(list, 'mr   m', null))).toEqual(['mr-mime']);
    });

    it('matches either of a dual-typed Pokémon’s types', () => {
      expect(names(filterPokemon(ALL, '', 'poison'))).toEqual(['bulbasaur']);
    });

    it('combines the name and type filters', () => {
      expect(names(filterPokemon(ALL, 'a', 'fire'))).toEqual(['charmander', 'arcanine']);
    });

    it('returns everything for a blank term and no type', () => {
      expect(filterPokemon(ALL, '   ', null)).toEqual(ALL);
    });
  });

  describe('sortPokemon', () => {
    it('sorts by a stat ascending, breaking ties by id', () => {
      expect(names(sortPokemon(ALL, { key: 'speed', direction: 'asc' }))).toEqual([
        'bulbasaur',
        'pichu',
        'charmander',
        'pikachu',
        'arcanine',
        'raichu',
      ]);
    });

    it('sorts by a stat descending, still breaking ties by ascending id', () => {
      expect(names(sortPokemon(ALL, { key: 'speed', direction: 'desc' }))).toEqual([
        'raichu',
        'pikachu',
        'arcanine',
        'charmander',
        'pichu',
        'bulbasaur',
      ]);
    });

    it('sorts by name and by total', () => {
      expect(names(sortPokemon(ALL, { key: 'name', direction: 'asc' }))).toEqual([
        'arcanine',
        'bulbasaur',
        'charmander',
        'pichu',
        'pikachu',
        'raichu',
      ]);
      expect(sortPokemon(ALL, { key: 'totalStats', direction: 'desc' })[0]).toBe(ARCANINE);
    });

    it('leaves the input array untouched', () => {
      const input = [...ALL];

      sortPokemon(input, { key: 'speed', direction: 'desc' });

      expect(input).toEqual(ALL);
    });
  });

  describe('paginate', () => {
    it('returns the requested slice with totals', () => {
      expect(paginate(ALL, 2, 4)).toEqual({
        rows: [ARCANINE, PICHU],
        total: 6,
        page: 2,
        pageSize: 4,
        pageCount: 2,
      });
    });

    it('clamps a page past the end to the last page, and below 1 to the first', () => {
      expect(paginate(ALL, 9, 4)).toMatchObject({ page: 2, rows: [ARCANINE, PICHU] });
      expect(paginate(ALL, 0, 4)).toMatchObject({ page: 1, rows: ALL.slice(0, 4) });
    });

    it('reports one empty page for an empty list', () => {
      expect(paginate([], 3, 10)).toEqual({
        rows: [],
        total: 0,
        page: 1,
        pageSize: 10,
        pageCount: 1,
      });
    });
  });
});

describe('PokemonSelectors', () => {
  let store: PokemonStore;
  let selectors: PokemonSelectors;
  let subscriptions: Subscription;
  let listRequests: Subject<Pokemon[]>[];
  let detailRequests: Subject<PokemonDetail>[];

  /** Collects every emission until the test ends. */
  function record<T>(source$: Observable<T>): T[] {
    const values: T[] = [];
    subscriptions.add(source$.subscribe((value) => values.push(value)));
    return values;
  }

  /** Each API call returns a new Subject the test settles by hand. */
  function pending<T>(requests: Subject<T>[]): () => Observable<T> {
    return () => {
      const request = new Subject<T>();
      requests.push(request);
      return request;
    };
  }

  /** Answers the latest list request with `list`. */
  function respond(list: Pokemon[]): void {
    const request = listRequests[listRequests.length - 1];
    request.next(list);
    request.complete();
  }

  /** Loads `list` through the store, as the page would on init. */
  function load(list: Pokemon[]): void {
    store.loadAll();
    respond(list);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    subscriptions = new Subscription();
    listRequests = [];
    detailRequests = [];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PokemonApiService,
          useValue: {
            getPokemonList$: pending(listRequests),
            getPokemonDetail$: pending(detailRequests),
          },
        },
      ],
    });
    store = TestBed.inject(PokemonStore);
    selectors = TestBed.inject(PokemonSelectors);
  });

  afterEach(() => {
    subscriptions.unsubscribe();
    vi.useRealTimers();
  });

  describe('searchResults$', () => {
    beforeEach(() => load(ALL));

    it('emits the current results at once, without waiting for the debounce', () => {
      const results = record(selectors.searchResults$);

      expect(results.map(names)).toEqual([names(ALL)]);
    });

    it('applies a search stored before subscribing at once, e.g. on returning to the page', () => {
      store.setSearch('char');

      const results = record(selectors.searchResults$);

      expect(results.map(names)).toEqual([['charmander']]);
    });

    it('emits once, 300 ms after the last of several rapid keystrokes', () => {
      const results = record(selectors.searchResults$);

      store.setSearch('p');
      vi.advanceTimersByTime(100);
      store.setSearch('pi');
      vi.advanceTimersByTime(100);
      store.setSearch('pik');
      vi.advanceTimersByTime(299);
      expect(results).toHaveLength(1);

      vi.advanceTimersByTime(1);
      expect(results.map(names)).toEqual([names(ALL), ['pikachu']]);
    });

    it('does not re-emit when the debounced term is unchanged', () => {
      const results = record(selectors.searchResults$);
      store.setSearch('pik');
      vi.advanceTimersByTime(300);

      store.setSearch('pika');
      store.setSearch('PIK ');
      vi.advanceTimersByTime(300);

      expect(results.map(names)).toEqual([names(ALL), ['pikachu']]);
    });

    it('re-filters at once when the type filter changes', () => {
      const results = record(selectors.searchResults$);
      store.setSearch('a');
      vi.advanceTimersByTime(300);

      store.setTypeFilter('fire');

      expect(results.map(names).at(-1)).toEqual(['charmander', 'arcanine']);
    });
  });

  describe('page$', () => {
    it('reports the filtered, sorted page with its total and page count', () => {
      load(ALL);
      const pages = record(selectors.page$);

      store.setTypeFilter('electric');
      store.setSort('speed');

      expect(pages.at(-1)).toEqual({
        rows: [RAICHU, PIKACHU, PICHU],
        total: 3,
        page: 1,
        pageSize: 10,
        pageCount: 1,
      });
    });

    it('goes back to page 1 when a filter changes, and clamps a page past the end', () => {
      const fillers = Array.from({ length: 17 }, (_, i) => makePokemon(200 + i, `filler${i}`));
      load([...ALL, ...fillers]);
      const pages = record(selectors.page$);

      store.setPage(3);
      expect(pages.at(-1)).toMatchObject({ page: 3, total: 23, pageCount: 3 });
      expect(pages.at(-1)?.rows).toHaveLength(3);

      store.setTypeFilter('electric');
      expect(pages.at(-1)).toMatchObject({ page: 1, total: 3, pageCount: 1 });

      store.setPage(3);
      expect(pages.at(-1)).toMatchObject({ page: 1, rows: [PIKACHU, RAICHU, PICHU] });
    });
  });

  describe('table$', () => {
    it('is loading synchronously on subscribe, then succeeds once with the first page', () => {
      const states = record(selectors.table$);
      expect(states).toEqual([loadingState()]);

      store.loadAll();
      expect(states).toEqual([loadingState()]);

      respond(ALL);
      expect(states.map((state) => state.status)).toEqual(['loading', 'success']);
      expect(view(states[1])).toEqual({
        rows: ALL,
        total: 6,
        page: 1,
        pageSize: 10,
        pageCount: 1,
        hasData: true,
      });
    });

    it('shows the list error, then loading and success on retry', () => {
      const error = createAppError('network');
      const states = record(selectors.table$);

      store.loadAll();
      listRequests[0].error(error);
      expect(states.at(-1)).toEqual(errorState(error));

      store.loadAll();
      expect(states.at(-1)).toEqual(loadingState());

      respond(ALL);
      expect(view(states.at(-1)).total).toBe(6);
    });

    it('applies a search typed while the list is still loading', () => {
      const states = record(selectors.table$);
      store.loadAll();

      store.setSearch('pik');
      vi.advanceTimersByTime(300);
      expect(states.at(-1)).toEqual(loadingState());

      respond(ALL);
      expect(view(states.at(-1)).rows).toEqual([PIKACHU]);
    });

    it('tells "no results" (total 0) apart from "no data" (hasData false)', () => {
      const states = record(selectors.table$);
      load(ALL);
      store.setSearch('missingno');
      vi.advanceTimersByTime(300);

      expect(view(states.at(-1))).toMatchObject({ rows: [], total: 0, hasData: true });
    });

    it('reports no data when the API returns no Pokémon', () => {
      const states = record(selectors.table$);
      load([]);

      expect(view(states.at(-1))).toMatchObject({ total: 0, hasData: false });
    });
  });

  it('entities$ maps ids to Pokémon and ignores query changes', () => {
    const entities = record(selectors.entities$);
    load([PIKACHU, CHARMANDER]);
    store.setSearch('pika');

    expect(entities).toEqual([{}, { 4: CHARMANDER, 25: PIKACHU }]);
  });

  it('details$ goes from no entry, to loading, to success for a requested id', () => {
    const detail: PokemonDetail = { ...PIKACHU, abilities: [] };
    const details = record(selectors.details$);

    store.loadDetail(25);
    detailRequests[0].next(detail);

    expect(details).toEqual([{}, { 25: loadingState() }, { 25: successState(detail) }]);
  });
});
