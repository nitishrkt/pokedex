import { inject, Injectable } from '@angular/core';
import {
  combineLatest,
  concat,
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  shareReplay,
  skip,
  switchMap,
  take,
} from 'rxjs';

import {
  AsyncState,
  errorState,
  loadingState,
  successState,
} from '../../common/models/async-state.model';
import { PokemonTypeName } from '../constants/pokemon-types.constants';
import { SEARCH_DEBOUNCE_MS } from '../constants/pokemon.constants';
import {
  PokemonPage,
  PokemonQuery,
  PokemonSort,
  PokemonTableView,
} from '../models/pokemon-state.model';
import { Pokemon, PokemonDetail } from '../models/pokemon.model';
import { PokemonStore } from './pokemon.store';

/**
 * Lower-cases, trims and turns hyphens and runs of spaces into one space,
 * so "Mr Mime" and "mr-mime" both match the slug `mr-mime`.
 */
export function normalizeSearch(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, ' ');
}

/** Pokémon whose name contains `search` (see {@link normalizeSearch}) and that have `type`, if given. */
export function filterPokemon(
  list: readonly Pokemon[],
  search: string,
  type: PokemonTypeName | null,
): Pokemon[] {
  const term = normalizeSearch(search);
  return list.filter(
    (pokemon) =>
      normalizeSearch(pokemon.name).includes(term) &&
      (type === null || pokemon.types.includes(type)),
  );
}

function sortValue(pokemon: Pokemon, key: PokemonSort['key']): number | string {
  switch (key) {
    case 'id':
    case 'name':
    case 'totalStats':
      return pokemon[key];
    default:
      return pokemon.stats[key];
  }
}

/** A sorted copy of `list`. Ties keep Pokédex order (id ascending) in both directions. */
export function sortPokemon(list: readonly Pokemon[], { key, direction }: PokemonSort): Pokemon[] {
  const sign = direction === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    const left = sortValue(a, key);
    const right = sortValue(b, key);
    const order =
      typeof left === 'string' && typeof right === 'string'
        ? left.localeCompare(right)
        : Number(left) - Number(right);
    return order * sign || a.id - b.id;
  });
}

/** The rows of one 1-based page; `page` is clamped to `1..pageCount`. */
export function paginate(list: readonly Pokemon[], page: number, pageSize: number): PokemonPage {
  const total = list.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, Math.floor(page)), pageCount);
  const start = (current - 1) * pageSize;
  return { rows: list.slice(start, start + pageSize), total, page: current, pageSize, pageCount };
}

/** A slice of `source$` that emits only when it changes (`===` unless `compare` is given). */
function select<S, T>(
  source$: Observable<S>,
  project: (source: S) => T,
  compare?: (previous: T, current: T) => boolean,
): Observable<T> {
  return source$.pipe(map(project), distinctUntilChanged(compare));
}

/** Same status, and the same error or data by reference. */
function sameAsyncState<T>(previous: AsyncState<T>, current: AsyncState<T>): boolean {
  switch (previous.status) {
    case 'loading':
      return current.status === 'loading';
    case 'error':
      return current.status === 'error' && current.error === previous.error;
    case 'success':
      return current.status === 'success' && current.data === previous.data;
  }
}

/**
 * Derived, read-only streams over {@link PokemonStore}. One injectable so
 * every consumer shares the same replayed chains instead of rebuilding them.
 * Every stream emits synchronously on subscribe, so `toSignal(…, { requireSync: true })` works.
 */
@Injectable({ providedIn: 'root' })
export class PokemonSelectors {
  private readonly state$ = inject(PokemonStore).state$;

  // shareReplay(1) semantics throughout; refCount: true tears a chain down once
  // its last consumer unsubscribes, so nothing outlives the page that used it.

  /** Pokémon by id; `{}` until loaded. */
  readonly entities$: Observable<Readonly<Record<number, Pokemon>>> = select(
    this.state$,
    (state) => state.entities,
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  /** Detail request state by Pokémon id; an id never requested has no entry. */
  readonly details$: Observable<Readonly<Record<number, AsyncState<PokemonDetail>>>> = select(
    this.state$,
    (state) => state.details,
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  /** Every cached Pokémon in Pokédex order; `[]` until loaded. */
  readonly allPokemon$: Observable<readonly Pokemon[]> = select(
    this.state$,
    ({ entities, ids }) => ({ entities, ids }),
    (previous, current) => previous.entities === current.entities && previous.ids === current.ids,
  ).pipe(
    map(({ entities, ids }) => ids.map((id) => entities[id])),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** The table query exactly as stored, including the raw search text. */
  readonly query$: Observable<PokemonQuery> = select(this.state$, (state) => state.query).pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** The type filter; changes apply at once, without the search debounce. */
  readonly typeFilter$: Observable<PokemonTypeName | null> = select(
    this.query$,
    (query) => query.type,
  );

  /** The sort column and direction, compared by value. */
  readonly sort$: Observable<PokemonSort> = select(
    this.query$,
    (query) => query.sort,
    (previous, current) => previous.key === current.key && previous.direction === current.direction,
  );

  private readonly rawSearch$ = select(this.query$, (query) => query.search);

  /**
   * Pokémon matching the debounced search and the type filter, in id order.
   *
   * The first value is the stored text (first load, or returning to the page),
   * which needs no debounce; only later keystrokes wait 300 ms.
   * `switchMap` drops the filter stream for the previous term, so only the
   * latest term stays subscribed to list and type changes.
   */
  readonly searchResults$: Observable<Pokemon[]> = concat(
    this.rawSearch$.pipe(take(1)),
    this.rawSearch$.pipe(skip(1), debounceTime(SEARCH_DEBOUNCE_MS)),
  ).pipe(
    map(normalizeSearch),
    distinctUntilChanged(),
    switchMap((term) =>
      combineLatest([this.allPokemon$, this.typeFilter$]).pipe(
        map(([list, type]) => filterPokemon(list, term, type)),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** {@link searchResults$} in the current sort order. */
  readonly sorted$: Observable<Pokemon[]> = combineLatest([this.searchResults$, this.sort$]).pipe(
    map(([list, sort]) => sortPokemon(list, sort)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** The visible page of {@link sorted$}. */
  readonly page$: Observable<PokemonPage> = combineLatest([
    this.sorted$,
    select(
      this.query$,
      ({ page, pageSize }) => ({ page, pageSize }),
      (previous, current) =>
        previous.page === current.page && previous.pageSize === current.pageSize,
    ),
  ]).pipe(
    map(([list, { page, pageSize }]) => paginate(list, page, pageSize)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /**
   * The Pokédex table as one view state: `loading` until the list arrives,
   * `error` with the list error, or `success` with the page. On success,
   * `total === 0` means "no results" and `!hasData` means "no data".
   */
  readonly table$: Observable<AsyncState<PokemonTableView>> = combineLatest([
    this.page$,
    // Listed last so state$ notifies it after page$ has re-filtered: a
    // `loaded` status never pairs with the stale, still-empty page.
    select(
      this.state$,
      ({ listStatus, listError, ids }) => ({ listStatus, listError, hasData: ids.length > 0 }),
      (previous, current) =>
        previous.listStatus === current.listStatus &&
        previous.listError === current.listError &&
        previous.hasData === current.hasData,
    ),
  ]).pipe(
    map(([page, { listStatus, listError, hasData }]): AsyncState<PokemonTableView> => {
      if (listStatus === 'loaded') {
        return successState({ ...page, hasData });
      }
      return listStatus === 'error' && listError ? errorState(listError) : loadingState();
    }),
    distinctUntilChanged(sameAsyncState),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /**
   * The cached Pokémon by id as view state, for features that look Pokémon up
   * (teams): `loading` until the list arrives, or `error` so they can offer a retry.
   */
  readonly catalog$: Observable<AsyncState<Readonly<Record<number, Pokemon>>>> = combineLatest([
    this.entities$,
    select(
      this.state$,
      ({ listStatus, listError }) => ({ listStatus, listError }),
      (previous, current) =>
        previous.listStatus === current.listStatus && previous.listError === current.listError,
    ),
  ]).pipe(
    map(([entities, { listStatus, listError }]) => {
      if (listStatus === 'loaded') {
        return successState(entities);
      }
      return listStatus === 'error' && listError ? errorState(listError) : loadingState();
    }),
    distinctUntilChanged(sameAsyncState),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
