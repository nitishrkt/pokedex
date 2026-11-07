import { PokemonTypeName } from '../constants/pokemon-types.constants';
import { Pokemon, PokemonStats } from '../models/pokemon.model';

/**
 * Builds a Pokémon for specs. Stats default to 50 each, and `totalStats` is
 * their sum. Spec-only: excluded from the app build in `tsconfig.app.json`.
 */
export function makePokemon(
  id: number,
  name: string,
  types: PokemonTypeName[] = ['normal'],
  stats: Partial<PokemonStats> = {},
): Pokemon {
  const full: PokemonStats = {
    hp: 50,
    attack: 50,
    defense: 50,
    specialAttack: 50,
    specialDefense: 50,
    speed: 50,
    ...stats,
  };
  const totalStats = Object.values(full).reduce((sum, value) => sum + value, 0);
  return { id, name, height: 1, weight: 1, types, stats: full, totalStats, spriteUrl: null };
}
