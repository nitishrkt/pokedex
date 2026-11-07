/** The 18 Pokémon types, in the games' canonical order. */
export const POKEMON_TYPE_NAMES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

/** A Pokémon type name, as PokéAPI spells it. */
export type PokemonTypeName = (typeof POKEMON_TYPE_NAMES)[number];
