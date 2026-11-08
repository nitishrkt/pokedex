import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { PokemonSelectors } from '../pokedex/state/pokemon.selectors';
import { PokemonStore } from '../pokedex/state/pokemon.store';
import { TeamBuilderFormComponent } from './components/team-builder-form/team-builder-form.component';
import { TeamListComponent } from './components/team-list/team-list.component';
import { TeamSummaryComponent } from './components/team-summary/team-summary.component';
import { SelectedTeamService } from './services/selected-team.service';
import { NewTeam } from './models/team.model';
import { TeamSelectors } from './state/team.selectors';
import { TeamStore } from './state/team.store';

/** Teams page: the team list and the summary of the selected team. */
@Component({
  selector: 'app-teams-page',
  imports: [TeamBuilderFormComponent, TeamListComponent, TeamSummaryComponent],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamsPage implements OnInit {
  private readonly teamStore = inject(TeamStore);
  private readonly pokemonStore = inject(PokemonStore);
  protected readonly selection = inject(SelectedTeamService);

  protected readonly teamsState = toSignal(inject(TeamSelectors).teamsState$, {
    requireSync: true,
  });
  protected readonly catalog = toSignal(inject(PokemonSelectors).catalog$, { requireSync: true });

  ngOnInit(): void {
    this.teamStore.loadTeams();
    // Member sprites, types and stats come from the cached Pokédex.
    this.pokemonStore.loadAll();
  }

  protected retryTeams(): void {
    this.teamStore.loadTeams();
  }

  protected retryPokemon(): void {
    this.pokemonStore.loadAll();
  }

  protected createTeam(team: NewTeam): void {
    this.teamStore.createTeam(team);
  }

  protected deleteTeam(id: string): void {
    this.teamStore.deleteTeam(id);
  }
}
