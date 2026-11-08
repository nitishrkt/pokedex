import { POKEMON_TYPE_NAMES } from '../../pokedex/constants/pokemon-types.constants';
import { Pokemon } from '../../pokedex/models/pokemon.model';
import { Team, TeamSummary, TypeCount } from '../models/team.model';

/**
 * Type distribution and total base stats of a team. Members missing from
 * `pokemonById` (list not loaded, or an unknown id) are counted in
 * `unresolvedCount` and left out of the other numbers.
 */
export function summarizeTeam(
  team: Pick<Team, 'pokemonIds'>,
  pokemonById: Readonly<Record<number, Pokemon>>,
): TeamSummary {
  const counts = new Map<TypeCount['type'], number>();
  let totalBaseStats = 0;
  let unresolvedCount = 0;

  for (const id of team.pokemonIds) {
    const pokemon = pokemonById[id];
    if (!pokemon) {
      unresolvedCount++;
      continue;
    }
    totalBaseStats += pokemon.totalStats;
    for (const type of pokemon.types) {
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
  }

  const typeDistribution = POKEMON_TYPE_NAMES.filter((type) => counts.has(type))
    .map((type) => ({ type, count: counts.get(type) ?? 0 }))
    .sort((a, b) => b.count - a.count);

  return { typeDistribution, totalBaseStats, unresolvedCount };
}
