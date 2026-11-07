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

/** Badge background per type, using the commonly used standard type colours. */
export const POKEMON_TYPE_COLORS: Readonly<Record<PokemonTypeName, string>> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};

const LIGHT_TEXT = '#FFFFFF';
const DARK_TEXT = '#1A1A1A';

/**
 * Badge text colour per type: whichever of light or dark text has the higher
 * contrast on {@link POKEMON_TYPE_COLORS}. Every pair meets WCAG AA (4.5:1).
 */
export const POKEMON_TYPE_TEXT_COLORS: Readonly<Record<PokemonTypeName, string>> = {
  normal: DARK_TEXT,
  fire: DARK_TEXT,
  water: DARK_TEXT,
  electric: DARK_TEXT,
  grass: DARK_TEXT,
  ice: DARK_TEXT,
  fighting: LIGHT_TEXT,
  poison: LIGHT_TEXT,
  ground: DARK_TEXT,
  flying: DARK_TEXT,
  psychic: DARK_TEXT,
  bug: DARK_TEXT,
  rock: DARK_TEXT,
  ghost: LIGHT_TEXT,
  dragon: LIGHT_TEXT,
  dark: LIGHT_TEXT,
  steel: DARK_TEXT,
  fairy: DARK_TEXT,
};
