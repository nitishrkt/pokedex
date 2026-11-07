/** Highest National Pokédex number; higher ids are alternate forms (megas, regional variants). */
export const POKEDEX_MAX_ID = 1025;

/** PokéAPI `language.id` for English, used to pick ability effect texts. */
export const ENGLISH_LANGUAGE_ID = 9;

/** Rows-per-page choices for the Pokédex table. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

/** One of {@link PAGE_SIZE_OPTIONS}. */
export type PokemonPageSize = (typeof PAGE_SIZE_OPTIONS)[number];

/** Rows per page before the user picks another size. */
export const DEFAULT_PAGE_SIZE: PokemonPageSize = 10;

/** Table order before the user sorts: Pokédex number, ascending. */
export const DEFAULT_SORT = { key: 'id', direction: 'asc' } as const;

/** Delay between the last keystroke and re-filtering the table. */
export const SEARCH_DEBOUNCE_MS = 300;
