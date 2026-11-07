import { PokemonTypeName } from '../constants/pokemon-types.constants';

/** The six base stats, keyed in camelCase. */
export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

/** A Pokémon as shown in the Pokédex table and team picker. */
export interface Pokemon {
  id: number;
  /** PokéAPI slug, e.g. `mr-mime`. Format it for display in the view. */
  name: string;
  /** In decimetres. */
  height: number;
  /** In hectograms. */
  weight: number;
  /** Ordered by slot: primary type first. */
  types: PokemonTypeName[];
  stats: PokemonStats;
  /** Sum of the six base stats. */
  totalStats: number;
  /** Front default sprite, or `null` when PokéAPI has none. */
  spriteUrl: string | null;
}

/** One ability of a Pokémon. */
export interface PokemonAbility {
  /** PokéAPI slug, e.g. `solar-power`. */
  name: string;
  /** English short effect, or `null` when PokéAPI has no English text. */
  shortEffect: string | null;
  isHidden: boolean;
}

/** A Pokémon with its abilities, for the detail panel. */
export interface PokemonDetail extends Pokemon {
  /** Ordered by slot; hidden abilities come last. */
  abilities: PokemonAbility[];
}
