import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { EmptyStateComponent } from '../../../common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../common/components/error-state/error-state.component';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { AsyncState } from '../../../common/models/async-state.model';
import { DisplayNamePipe } from '../../../common/pipes/display-name.pipe';
import { POKEMON_STAT_KEYS, POKEMON_TABLE_COLUMNS } from '../../constants/pokemon-table.constants';
import { PokemonSort, PokemonSortKey, PokemonTableView } from '../../models/pokemon-state.model';
import { TypeBadgeComponent } from '../type-badge/type-badge.component';

/**
 * The Pokédex table in all four states. While loading it renders `pageSize`
 * skeleton rows at the real row height, so nothing below it moves when the
 * data arrives. Empty and error messages render under the header, outside the
 * horizontal scroller, so they stay readable on narrow screens.
 */
@Component({
  selector: 'app-pokemon-table',
  imports: [
    DisplayNamePipe,
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonComponent,
    TypeBadgeComponent,
  ],
  templateUrl: './pokemon-table.component.html',
  styleUrl: './pokemon-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonTableComponent {
  readonly state = input.required<AsyncState<PokemonTableView>>();
  readonly sort = input.required<PokemonSort>();
  readonly selectedId = input<number | null>(null);
  /** Number of skeleton rows while loading. */
  readonly pageSize = input.required<number>();

  readonly sortChange = output<PokemonSortKey>();
  readonly rowSelect = output<number>();
  readonly retry = output<void>();
  readonly clearFilters = output<void>();

  protected readonly columns = POKEMON_TABLE_COLUMNS;
  protected readonly statKeys = POKEMON_STAT_KEYS;

  private readonly region = viewChild.required<ElementRef<HTMLElement>>('region');

  protected readonly view = computed(() => {
    const state = this.state();
    return state.status === 'success' ? state.data : null;
  });

  protected readonly rows = computed(() =>
    (this.view()?.rows ?? []).map((pokemon) => ({
      pokemon,
      stats: this.statKeys.map((key) => ({
        key,
        value: key === 'totalStats' ? pokemon.totalStats : pokemon.stats[key],
      })),
    })),
  );

  /** Ids whose sprite failed to load; they show the placeholder instead. */
  private readonly brokenSprites = signal<ReadonlySet<number>>(new Set());

  protected readonly skeletonRows = computed(() =>
    Array.from({ length: this.pageSize() }, (_, index) => index),
  );

  /** Why a successful load shows no rows: nothing matches, or no data at all. */
  protected readonly emptyKind = computed(() => {
    const view = this.view();
    if (!view || view.total > 0) {
      return null;
    }
    return view.hasData ? 'no-results' : 'no-data';
  });

  protected readonly caption = computed(() => {
    const { key, direction } = this.sort();
    const column = this.columns.find(({ sortKey }) => sortKey === key);
    const name = column?.title ?? column?.label ?? key;
    return `Pokémon, sorted by ${name} ${direction === 'asc' ? 'ascending' : 'descending'}`;
  });

  protected ariaSort(key: PokemonSortKey | undefined): 'ascending' | 'descending' | null {
    const sort = this.sort();
    if (!key || sort.key !== key) {
      return null;
    }
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  // Retry and Clear filters remove their own button, so park focus on the
  // table region instead of letting it fall back to <body>.
  protected onRetry(): void {
    this.region().nativeElement.focus();
    this.retry.emit();
  }

  protected onClearFilters(): void {
    this.region().nativeElement.focus();
    this.clearFilters.emit();
  }

  protected hasSprite(pokemon: { id: number; spriteUrl: string | null }): boolean {
    return pokemon.spriteUrl !== null && !this.brokenSprites().has(pokemon.id);
  }

  protected onSpriteError(id: number): void {
    this.brokenSprites.update((ids) => new Set(ids).add(id));
  }
}
