import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { EmptyStateComponent } from '../../../common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../common/components/error-state/error-state.component';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { AsyncState } from '../../../common/models/async-state.model';
import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { TeamEntry } from '../../models/team.model';
import { TeamCardComponent } from '../team-card/team-card.component';

/** The team list in all four states: skeleton cards, empty message, error with Retry, teams. */
@Component({
  selector: 'app-team-list',
  imports: [EmptyStateComponent, ErrorStateComponent, SkeletonComponent, TeamCardComponent],
  templateUrl: './team-list.component.html',
  styleUrl: './team-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamListComponent {
  readonly state = input.required<AsyncState<readonly TeamEntry[]>>();
  readonly catalog = input.required<AsyncState<Readonly<Record<number, Pokemon>>>>();
  readonly selectedId = input<string | null>(null);

  readonly toggleSelect = output<string>();
  readonly remove = output<string>();
  readonly retry = output<void>();

  protected readonly skeletonCards = [1, 2, 3];
}
