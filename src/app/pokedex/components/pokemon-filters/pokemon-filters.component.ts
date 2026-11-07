import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

import { DisplayNamePipe } from '../../../common/pipes/display-name.pipe';
import { POKEMON_TYPE_NAMES, PokemonTypeName } from '../../constants/pokemon-types.constants';

/**
 * Name search and type filter for the Pokédex table. Emits on every
 * keystroke; debouncing is the selectors' job, not the input's.
 */
@Component({
  selector: 'app-pokemon-filters',
  imports: [DisplayNamePipe],
  templateUrl: './pokemon-filters.component.html',
  styleUrl: './pokemon-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonFiltersComponent {
  readonly search = input.required<string>();
  /** `null` means all types. */
  readonly type = input.required<PokemonTypeName | null>();

  readonly searchChange = output<string>();
  readonly typeChange = output<PokemonTypeName | null>();

  protected readonly typeNames = POKEMON_TYPE_NAMES;

  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');

  protected clearSearch(): void {
    this.searchChange.emit('');
    // The clear button disappears with the text, so keep focus in the field.
    this.searchInput().nativeElement.focus();
  }

  protected onTypeChange(value: string): void {
    this.typeChange.emit(POKEMON_TYPE_NAMES.find((name) => name === value) ?? null);
  }
}
