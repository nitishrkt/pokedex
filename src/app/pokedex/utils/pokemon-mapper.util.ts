import { POKEMON_TYPE_NAMES, PokemonTypeName } from '../constants/pokemon-types.constants';
import {
  PokemonAbilityDto,
  PokemonDetailDto,
  PokemonDto,
  PokemonStatDto,
  PokemonTypeDto,
} from '../models/pokemon-api.model';
import { Pokemon, PokemonAbility, PokemonDetail, PokemonStats } from '../models/pokemon.model';

/** PokéAPI stat names mapped to {@link PokemonStats} keys. */
const STAT_KEYS: Readonly<Record<string, keyof PokemonStats>> = {
  hp: 'hp',
  attack: 'attack',
  defense: 'defense',
  'special-attack': 'specialAttack',
  'special-defense': 'specialDefense',
  speed: 'speed',
};

const bySlot = (a: { slot: number }, b: { slot: number }): number => a.slot - b.slot;

function isPokemonTypeName(name: string): name is PokemonTypeName {
  return (POKEMON_TYPE_NAMES as readonly string[]).includes(name);
}

/**
 * Maps stat rows to {@link PokemonStats}. Unknown stat names are ignored and
 * missing stats default to 0.
 */
export function mapPokemonStats(dtos: readonly PokemonStatDto[]): PokemonStats {
  const stats: PokemonStats = {
    hp: 0,
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
  };
  for (const dto of dtos) {
    const key = dto.stat ? STAT_KEYS[dto.stat.name] : undefined;
    if (key) {
      stats[key] = dto.base_stat;
    }
  }
  return stats;
}

/** Sum of the six base stats. */
export function sumPokemonStats(stats: PokemonStats): number {
  return (
    stats.hp +
    stats.attack +
    stats.defense +
    stats.specialAttack +
    stats.specialDefense +
    stats.speed
  );
}

/**
 * Maps type rows to type names ordered by slot. Names outside the 18 known
 * types (such as PokéAPI's `unknown` and `shadow`) are dropped.
 */
export function mapPokemonTypes(dtos: readonly PokemonTypeDto[]): PokemonTypeName[] {
  return [...dtos]
    .sort(bySlot)
    .map((dto) => dto.type?.name ?? '')
    .filter(isPokemonTypeName);
}

/** Maps a raw PokéAPI Pokémon to a {@link Pokemon}. A missing sprite becomes `null`. */
export function mapPokemon(dto: PokemonDto): Pokemon {
  const stats = mapPokemonStats(dto.pokemonstats);
  const sprite = dto.pokemonsprites[0]?.sprites;
  return {
    id: dto.id,
    name: dto.name,
    height: dto.height ?? 0,
    weight: dto.weight ?? 0,
    types: mapPokemonTypes(dto.pokemontypes),
    stats,
    totalStats: sumPokemonStats(stats),
    spriteUrl: typeof sprite === 'string' && sprite !== '' ? sprite : null,
  };
}

/**
 * Maps ability rows ordered by slot (hidden abilities come last). Rows with
 * no linked ability are dropped; a missing English effect becomes `null`.
 */
export function mapPokemonAbilities(dtos: readonly PokemonAbilityDto[]): PokemonAbility[] {
  return [...dtos].sort(bySlot).flatMap(({ ability, is_hidden }) =>
    ability
      ? [
          {
            name: ability.name,
            shortEffect: ability.abilityeffecttexts[0]?.short_effect ?? null,
            isHidden: is_hidden,
          },
        ]
      : [],
  );
}

/** Maps a raw PokéAPI Pokémon with abilities to a {@link PokemonDetail}. */
export function mapPokemonDetail(dto: PokemonDetailDto): PokemonDetail {
  return { ...mapPokemon(dto), abilities: mapPokemonAbilities(dto.pokemonabilities) };
}
