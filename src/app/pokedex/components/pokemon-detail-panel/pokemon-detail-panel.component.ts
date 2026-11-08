import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';

import { EmptyStateComponent } from '../../../common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../common/components/error-state/error-state.component';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { AsyncState } from '../../../common/models/async-state.model';
import { DisplayNamePipe } from '../../../common/pipes/display-name.pipe';
import { POKEMON_TYPE_COLORS } from '../../constants/pokemon-types.constants';
import { POKEMON_STAT_LABELS } from '../../constants/pokemon-stats.constants';
import { Pokemon, PokemonDetail } from '../../models/pokemon.model';
import { StatsRadarChartComponent } from '../stats-radar-chart/stats-radar-chart.component';
import { TypeBadgeComponent } from '../type-badge/type-badge.component';

/**
 * Slide-in panel with the selected Pokémon. The header, stats and radar come
 * from the already loaded list entry, so they show at once and the chart
 * stays mounted (and animates) when another Pokémon is picked. Only the
 * abilities wait for the detail request, and they have their own loading,
 * empty and error states in a fixed-height block.
 */
@Component({
  selector: 'app-pokemon-detail-panel',
  imports: [
    DisplayNamePipe,
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonComponent,
    StatsRadarChartComponent,
    TypeBadgeComponent,
  ],
  templateUrl: './pokemon-detail-panel.component.html',
  styleUrl: './pokemon-detail-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class PokemonDetailPanelComponent {
  private readonly injector = inject(Injector);

  readonly open = input.required<boolean>();
  /** Kept after closing, so the content does not vanish during the slide-out. */
  readonly pokemon = input<Pokemon | null>(null);
  /** Detail request for `pokemon`; `null` before the first request starts. */
  readonly detail = input<AsyncState<PokemonDetail> | null>(null);

  readonly dismissed = output<void>();
  readonly retry = output<void>();

  protected readonly statLabels = POKEMON_STAT_LABELS;
  protected readonly typeColors = POKEMON_TYPE_COLORS;

  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');
  private previouslyFocused: HTMLElement | null = null;

  constructor() {
    // Move focus into the panel on open and give it back on close.
    effect(() => {
      const open = this.open();
      untracked(() => {
        if (open) {
          this.previouslyFocused = document.activeElement as HTMLElement | null;
          afterNextRender(() => this.closeButton()?.nativeElement.focus(), {
            injector: this.injector,
          });
        } else {
          this.previouslyFocused?.focus();
          this.previouslyFocused = null;
        }
      });
    });
  }

  protected onEscape(): void {
    if (this.open()) {
      this.dismissed.emit();
    }
  }
}
