import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { AsyncState } from '../../../common/models/async-state.model';
import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { TeamEntry } from '../../models/team.model';

/**
 * One team: name, trainer, member sprites and a delete button. Selecting and
 * deleting are disabled while the team is still being created, because it
 * has no server id yet.
 */
@Component({
  selector: 'app-team-card',
  imports: [DatePipe, SkeletonComponent],
  templateUrl: './team-card.component.html',
  styleUrl: './team-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamCardComponent {
  readonly team = input.required<TeamEntry>();
  /** Pokémon by id, for the member sprites. */
  readonly catalog = input.required<AsyncState<Readonly<Record<number, Pokemon>>>>();
  readonly selected = input(false);

  readonly toggleSelect = output<void>();
  readonly remove = output<void>();

  private readonly avatarFailed = signal(false);

  protected readonly members = computed(() => {
    const catalog = this.catalog();
    return this.team().pokemonIds.map((id, index) => ({
      key: `${index}-${id}`,
      pokemon: catalog.status === 'success' ? (catalog.data[id] ?? null) : null,
    }));
  });

  protected readonly avatarUrl = computed(() =>
    this.avatarFailed() ? null : (this.team().trainer?.avatarUrl ?? null),
  );

  protected readonly initials = computed(() => {
    const name = this.team().trainer?.name ?? `Trainer ${this.team().trainerId}`;
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join('');
  });

  protected onAvatarError(): void {
    this.avatarFailed.set(true);
  }
}
