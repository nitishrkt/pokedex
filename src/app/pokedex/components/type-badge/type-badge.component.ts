import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
  POKEMON_TYPE_COLORS,
  POKEMON_TYPE_TEXT_COLORS,
  PokemonTypeName,
} from '../../constants/pokemon-types.constants';

/** Pill showing a Pokémon type in its standard colour. */
@Component({
  selector: 'app-type-badge',
  template: '{{ type() }}',
  styleUrl: './type-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.background-color]': 'background()',
    '[style.color]': 'textColor()',
  },
})
export class TypeBadgeComponent {
  readonly type = input.required<PokemonTypeName>();

  protected readonly background = computed(() => POKEMON_TYPE_COLORS[this.type()]);
  protected readonly textColor = computed(() => POKEMON_TYPE_TEXT_COLORS[this.type()]);
}
