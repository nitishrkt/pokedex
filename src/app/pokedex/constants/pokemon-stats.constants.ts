import { PokemonStats } from '../models/pokemon.model';

/** The six base stats in display order, with their short and full labels. */
export const POKEMON_STAT_LABELS: readonly {
  key: keyof PokemonStats;
  short: string;
  full: string;
}[] = [
  { key: 'hp', short: 'HP', full: 'HP' },
  { key: 'attack', short: 'Atk', full: 'Attack' },
  { key: 'defense', short: 'Def', full: 'Defense' },
  { key: 'specialAttack', short: 'SpA', full: 'Sp. Atk' },
  { key: 'specialDefense', short: 'SpD', full: 'Sp. Def' },
  { key: 'speed', short: 'Spe', full: 'Speed' },
];

/** Radar axis maximum; the highest base stat in the Pokédex is 255. */
export const RADAR_MAX_STAT = 255;
