import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { TEAM_NAME_MAX_LENGTH } from '../../constants/team.constants';
import { NewTeam } from '../../models/team.model';
import { TeamSelectors } from '../../state/team.selectors';
import {
  teamNameLengthValidator,
  teamSizeValidator,
  uniqueTeamNameValidator,
} from '../../utils/team-validators.util';
import { PokemonPickerComponent } from '../pokemon-picker/pokemon-picker.component';

/**
 * Reactive form for a new team: a name (required, 3–30 characters, unique
 * among existing teams) and 1–6 picked Pokémon. Errors show once a field is
 * dirty or touched, or after a submit attempt. Valid submits are emitted and
 * the form resets; saving, and undoing it on failure, is the store's job.
 */
@Component({
  selector: 'app-team-builder-form',
  imports: [PokemonPickerComponent, ReactiveFormsModule],
  templateUrl: './team-builder-form.component.html',
  styleUrl: './team-builder-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamBuilderFormComponent {
  private readonly selectors = inject(TeamSelectors);

  readonly create = output<NewTeam>();

  protected readonly nameMaxLength = TEAM_NAME_MAX_LENGTH;

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, teamNameLengthValidator()],
      asyncValidators: [
        uniqueTeamNameValidator(() =>
          this.selectors.teams$.pipe(map((teams) => teams.map((team) => team.name))),
        ),
      ],
    }),
    pokemonIds: new FormControl<number[]>([], {
      nonNullable: true,
      validators: [teamSizeValidator()],
    }),
  });

  // The form's own status never changes under OnPush without a signal.
  protected readonly status = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  protected get name(): FormControl<string> {
    return this.form.controls.name;
  }

  protected get pokemonIds(): FormControl<number[]> {
    return this.form.controls.pokemonIds;
  }

  /** Whether the control has an error that should be shown yet. */
  protected showErrors(control: FormControl): boolean {
    return control.invalid && (control.dirty || control.touched);
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    // Wait for the unique-name check instead of submitting around it.
    if (this.form.invalid || this.form.pending) {
      return;
    }
    const { name, pokemonIds } = this.form.getRawValue();
    this.create.emit({ name: name.trim(), pokemonIds });
    this.form.reset({ name: '', pokemonIds: [] });
  }
}
