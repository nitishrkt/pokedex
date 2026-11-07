import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable } from 'rxjs';

import { AppError } from '../../common/models/app-error.model';
import { AsyncState } from '../../common/models/async-state.model';
import { toAsyncState } from '../../common/utils/async-state.util';
import { PokemonTypeName } from '../constants/pokemon-types.constants';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  POKEDEX_MAX_ID,
  PokemonPageSize,
} from '../constants/pokemon.constants';
import {
  PokemonQuery,
  PokemonSortKey,
  PokemonState,
  SortDirection,
} from '../models/pokemon-state.model';
import { Pokemon, PokemonDetail } from '../models/pokemon.model';
import { PokemonApiService } from '../services/pokemon-api.service';

const INITIAL_STATE: PokemonState = {
  entities: {},
  ids: [],
  listStatus: 'idle',
  listError: null,
  details: {},
  query: {
    search: '',
    type: null,
    sort: DEFAULT_SORT,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  },
};

/** Stats and the total start highest-first; name and id start A–Z / 1–n. */
function initialSortDirection(key: PokemonSortKey): SortDirection {
  return key === 'name' || key === 'id' ? 'asc' : 'desc';
}

/**
 * Root-level cache of Pokédex data and the table query, held in one
 * BehaviorSubject. Commands update it immutably; read it through
 * `PokemonSelectors`. Root-provided so the cache outlives route changes
 * and the teams feature can reuse it.
 */
@Injectable({ providedIn: 'root' })
export class PokemonStore {
  private readonly api = inject(PokemonApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly state = new BehaviorSubject<PokemonState>(INITIAL_STATE);

  /** Every state change, starting with the current state. Read-only. */
  readonly state$: Observable<PokemonState> = this.state.asObservable();

  /**
   * Loads the whole Pokédex once. A no-op while loading or once loaded;
   * after an error it retries. Failures land in `listError`, never thrown.
   */
  loadAll(): void {
    const { listStatus } = this.state.value;
    if (listStatus === 'loading' || listStatus === 'loaded') {
      return;
    }
    // Set synchronously, so a second call in the same tick hits the guard.
    this.patch({ listStatus: 'loading', listError: null });

    this.api
      .getPokemonList$(POKEDEX_MAX_ID)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => this.setList(list),
        error: (listError: AppError) => this.patch({ listStatus: 'error', listError }),
      });
  }

  /**
   * Loads one Pokémon's detail into `details[id]` as loading, then success
   * or error. Skipped when already loading or loaded; retries after an error.
   */
  loadDetail(id: number): void {
    const current = this.state.value.details[id];
    if (current && current.status !== 'error') {
      return;
    }

    // toAsyncState emits `loading` synchronously, which arms the guard above.
    this.api
      .getPokemonDetail$(id)
      .pipe(toAsyncState(), takeUntilDestroyed(this.destroyRef))
      .subscribe((detail) => this.setDetail(id, detail));
  }

  /** Stores the raw search text and returns to page 1. Debounced in the selectors. */
  setSearch(search: string): void {
    if (search !== this.state.value.query.search) {
      this.patchQuery({ search, page: 1 });
    }
  }

  /** Filters by one type, or by none with `null`, and returns to page 1. */
  setTypeFilter(type: PokemonTypeName | null): void {
    if (type !== this.state.value.query.type) {
      this.patchQuery({ type, page: 1 });
    }
  }

  /**
   * Sorts by `key` and returns to page 1. Without `direction`, the same key
   * flips the direction; a new key starts descending for stats and the total,
   * ascending for name and id. A no-op when the sort would not change.
   */
  setSort(key: PokemonSortKey, direction?: SortDirection): void {
    const current = this.state.value.query.sort;
    const flipped = current.direction === 'asc' ? 'desc' : 'asc';
    const next = direction ?? (current.key === key ? flipped : initialSortDirection(key));
    if (key !== current.key || next !== current.direction) {
      this.patchQuery({ sort: { key, direction: next }, page: 1 });
    }
  }

  /** Goes to a 1-based page. Values past the last page are clamped by the selectors. */
  setPage(page: number): void {
    this.patchQuery({ page: Math.max(1, Math.floor(page)) });
  }

  /** Changes rows per page and returns to page 1. */
  setPageSize(pageSize: PokemonPageSize): void {
    if (pageSize !== this.state.value.query.pageSize) {
      this.patchQuery({ pageSize, page: 1 });
    }
  }

  private setList(list: readonly Pokemon[]): void {
    const entities: Record<number, Pokemon> = {};
    for (const pokemon of list) {
      entities[pokemon.id] = pokemon;
    }
    this.patch({
      entities,
      ids: list.map(({ id }) => id),
      listStatus: 'loaded',
      listError: null,
    });
  }

  private setDetail(id: number, detail: AsyncState<PokemonDetail>): void {
    this.patch({ details: { ...this.state.value.details, [id]: detail } });
  }

  private patchQuery(changes: Partial<PokemonQuery>): void {
    this.patch({ query: { ...this.state.value.query, ...changes } });
  }

  private patch(changes: Partial<PokemonState>): void {
    this.state.next({ ...this.state.value, ...changes });
  }
}
