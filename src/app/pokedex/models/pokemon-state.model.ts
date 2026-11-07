import { AppError } from '../../common/models/app-error.model';
import { AsyncState } from '../../common/models/async-state.model';
import { PokemonTypeName } from '../constants/pokemon-types.constants';
import { PokemonPageSize } from '../constants/pokemon.constants';
import { Pokemon, PokemonDetail, PokemonStats } from './pokemon.model';

/** A sortable Pokédex column: any base stat, the total, the name or the id. */
export type PokemonSortKey = keyof PokemonStats | 'totalStats' | 'name' | 'id';

export type SortDirection = 'asc' | 'desc';

export interface PokemonSort {
  readonly key: PokemonSortKey;
  readonly direction: SortDirection;
}

/** The Pokédex table's search, filter, sort and pagination settings. */
export interface PokemonQuery {
  /** Raw input text; trimming and debouncing happen in the selectors. */
  readonly search: string;
  /** `null` shows every type. */
  readonly type: PokemonTypeName | null;
  readonly sort: PokemonSort;
  /** 1-based. May exceed the page count; the selectors clamp it. */
  readonly page: number;
  readonly pageSize: PokemonPageSize;
}

/** Progress of the one-off load of the full Pokédex list. */
export type PokemonListStatus = 'idle' | 'loading' | 'loaded' | 'error';

/** Everything {@link PokemonStore} holds. Never mutated; every change is a new object. */
export interface PokemonState {
  readonly entities: Readonly<Record<number, Pokemon>>;
  /** Entity ids in API order (id ascending). */
  readonly ids: readonly number[];
  readonly listStatus: PokemonListStatus;
  /** Set only while `listStatus` is `error`. */
  readonly listError: AppError | null;
  /** Detail requests by Pokémon id; an id never requested has no entry. */
  readonly details: Readonly<Record<number, AsyncState<PokemonDetail>>>;
  readonly query: PokemonQuery;
}

/** One page of the filtered, sorted table. */
export interface PokemonPage {
  readonly rows: readonly Pokemon[];
  /** Rows matching the search and type filter, across all pages. */
  readonly total: number;
  /** 1-based, clamped to `1..pageCount`. */
  readonly page: number;
  readonly pageSize: number;
  /** At least 1, so "page 1 of 1" holds even with no rows. */
  readonly pageCount: number;
}

/** What the Pokédex table renders on success. */
export interface PokemonTableView extends PokemonPage {
  /** False when the API returned no Pokémon at all ("no data", not "no results"). */
  readonly hasData: boolean;
}
