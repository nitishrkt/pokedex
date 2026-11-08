import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { PaginatorComponent } from '../common/components/paginator/paginator.component';
import { PokemonFiltersComponent } from './components/pokemon-filters/pokemon-filters.component';
import { PokemonDetailPanelComponent } from './components/pokemon-detail-panel/pokemon-detail-panel.component';
import { PokemonTableComponent } from './components/pokemon-table/pokemon-table.component';
import { PAGE_SIZE_OPTIONS } from './constants/pokemon.constants';
import { PokemonSelectors } from './state/pokemon.selectors';
import { PokemonStore } from './state/pokemon.store';

/**
 * Pokédex page: wires the filters, table and paginator to the store. Reads
 * the current page only from `table$`, which clamps it to the page count.
 */
@Component({
  selector: 'app-pokedex-page',
  imports: [
    PaginatorComponent,
    PokemonDetailPanelComponent,
    PokemonFiltersComponent,
    PokemonTableComponent,
  ],
  templateUrl: './pokedex.component.html',
  styleUrl: './pokedex.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexPage implements OnInit {
  protected readonly store = inject(PokemonStore);
  private readonly selectors = inject(PokemonSelectors);

  protected readonly table = toSignal(this.selectors.table$, { requireSync: true });
  protected readonly query = toSignal(this.selectors.query$, { requireSync: true });
  private readonly entities = toSignal(this.selectors.entities$, { requireSync: true });
  private readonly details = toSignal(this.selectors.details$, { requireSync: true });

  /** The last clicked row. Kept after the panel closes, so its content can slide out. */
  protected readonly selectedId = signal<number | null>(null);
  protected readonly panelOpen = signal(false);

  /** The list entry for the selection; it feeds the panel's header and radar. */
  protected readonly selectedPokemon = computed(() => {
    const id = this.selectedId();
    return id === null ? null : (this.entities()[id] ?? null);
  });
  protected readonly selectedDetail = computed(() => {
    const id = this.selectedId();
    return id === null ? null : (this.details()[id] ?? null);
  });

  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  /** Paginator inputs; placeholders, and disabled, until the list has loaded. */
  protected readonly pagination = computed(() => {
    const table = this.table();
    if (table.status === 'success') {
      const { page, pageCount, total } = table.data;
      return { page, pageCount, total, disabled: false };
    }
    return { page: 1, pageCount: 1, total: 0, disabled: true };
  });

  /** Result count for the polite live region. */
  protected readonly summary = computed(() => {
    const table = this.table();
    switch (table.status) {
      case 'loading':
        return 'Loading Pokémon…';
      case 'error':
        return '';
      case 'success':
        return `Showing ${table.data.total} Pokémon`;
    }
  });

  constructor() {
    // Fetch abilities whenever the selection changes; the store caches per id.
    effect(() => {
      const id = this.selectedId();
      if (id !== null) {
        this.store.loadDetail(id);
      }
    });
  }

  ngOnInit(): void {
    this.store.loadAll();
  }

  protected selectPokemon(id: number): void {
    this.selectedId.set(id);
    this.panelOpen.set(true);
  }

  protected retryDetail(): void {
    const id = this.selectedId();
    if (id !== null) {
      this.store.loadDetail(id);
    }
  }

  protected clearFilters(): void {
    this.store.setSearch('');
    this.store.setTypeFilter(null);
  }
}
