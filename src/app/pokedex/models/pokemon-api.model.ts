/*
 * Raw PokéAPI v1beta2 response shapes, matching the documents in
 * `pokemon-queries.constants.ts`. Nullability follows the live schema.
 * Map them to domain models with `pokemon-mapper.util.ts`; never pass them
 * to components.
 */

export interface PokemonTypeDto {
  slot: number;
  type: { name: string } | null;
}

export interface PokemonStatDto {
  base_stat: number;
  stat: { name: string } | null;
}

export interface PokemonSpriteDto {
  /** `sprites(path: "front_default")`: a URL string, or `null` when absent. */
  sprites: string | null;
}

export interface PokemonDto {
  id: number;
  name: string;
  height: number | null;
  weight: number | null;
  pokemontypes: PokemonTypeDto[];
  pokemonstats: PokemonStatDto[];
  pokemonsprites: PokemonSpriteDto[];
}

export interface PokemonAbilityDto {
  slot: number;
  is_hidden: boolean;
  ability: {
    name: string;
    abilityeffecttexts: { short_effect: string }[];
  } | null;
}

export interface PokemonDetailDto extends PokemonDto {
  pokemonabilities: PokemonAbilityDto[];
}

/** `data` of the list and search queries. */
export interface PokemonListResponse {
  pokemon: PokemonDto[];
}

/** `data` of the detail query. The list has one entry, or none if the id is unknown. */
export interface PokemonDetailResponse {
  pokemon: PokemonDetailDto[];
}
