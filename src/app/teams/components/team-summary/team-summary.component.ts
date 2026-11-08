import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { EmptyStateComponent } from '../../../common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../common/components/error-state/error-state.component';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { createAppError } from '../../../common/models/app-error.model';
import { TypeBadgeComponent } from '../../../pokedex/components/type-badge/type-badge.component';
import { POKEMON_TYPE_COLORS } from '../../../pokedex/constants/pokemon-types.constants';
import { TeamEntry, TeamSummary } from '../../models/team.model';

/** Type distribution and total base stats of the selected team, with its own loading, empty and error states. */
@Component({
  selector: 'app-team-summary',
  imports: [EmptyStateComponent, ErrorStateComponent, SkeletonComponent, TypeBadgeComponent],
  templateUrl: './team-summary.component.html',
  styleUrl: './team-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSummaryComponent {
  readonly team = input<TeamEntry | null>(null);
  /** `null` without a selection; a string while the Pokémon data is not available. */
  readonly summary = input<TeamSummary | 'loading' | 'error' | null>(null);

  readonly retry = output<void>();

  protected readonly typeColors = POKEMON_TYPE_COLORS;
  protected readonly loadError = createAppError('unknown', {
    message: "Couldn't load Pokémon data for this summary.",
  });
}
