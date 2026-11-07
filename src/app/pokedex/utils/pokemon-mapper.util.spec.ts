import { PokemonDetailDto } from '../models/pokemon-api.model';
import { mapPokemon, mapPokemonDetail } from './pokemon-mapper.util';

/** Bulbasaur as returned by the detail query (trimmed real response). */
function bulbasaurDto(): PokemonDetailDto {
  return {
    id: 1,
    name: 'bulbasaur',
    height: 7,
    weight: 69,
    pokemontypes: [
      { slot: 2, type: { name: 'poison' } },
      { slot: 1, type: { name: 'grass' } },
    ],
    pokemonstats: [
      { base_stat: 45, stat: { name: 'hp' } },
      { base_stat: 49, stat: { name: 'attack' } },
      { base_stat: 49, stat: { name: 'defense' } },
      { base_stat: 65, stat: { name: 'special-attack' } },
      { base_stat: 65, stat: { name: 'special-defense' } },
      { base_stat: 45, stat: { name: 'speed' } },
    ],
    pokemonsprites: [
      { sprites: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png' },
    ],
    pokemonabilities: [
      {
        slot: 3,
        is_hidden: true,
        ability: {
          name: 'chlorophyll',
          abilityeffecttexts: [{ short_effect: 'Doubles Speed during strong sunlight.' }],
        },
      },
      { slot: 1, is_hidden: false, ability: { name: 'overgrow', abilityeffecttexts: [] } },
    ],
  };
}

describe('pokemon mapper', () => {
  it('maps kebab-case stat names to camelCase stats and sums the total', () => {
    const pokemon = mapPokemon(bulbasaurDto());

    expect(pokemon.stats).toEqual({
      hp: 45,
      attack: 49,
      defense: 49,
      specialAttack: 65,
      specialDefense: 65,
      speed: 45,
    });
    expect(pokemon.totalStats).toBe(318);
  });

  it('orders types by slot and drops names outside the 18 types', () => {
    const dto = bulbasaurDto();
    dto.pokemontypes.push({ slot: 3, type: { name: 'shadow' } }, { slot: 4, type: null });

    expect(mapPokemon(dto).types).toEqual(['grass', 'poison']);
  });

  it('keeps the sprite URL and maps a missing sprite to null', () => {
    const dto = bulbasaurDto();
    expect(mapPokemon(dto).spriteUrl).toBe(dto.pokemonsprites[0].sprites);

    expect(mapPokemon({ ...dto, pokemonsprites: [{ sprites: null }] }).spriteUrl).toBeNull();
    expect(mapPokemon({ ...dto, pokemonsprites: [] }).spriteUrl).toBeNull();
  });

  it('defaults missing stats to 0', () => {
    const pokemon = mapPokemon({ ...bulbasaurDto(), pokemonstats: [] });

    expect(pokemon.stats.speed).toBe(0);
    expect(pokemon.totalStats).toBe(0);
  });

  it('maps abilities by slot with a null effect when no English text exists', () => {
    expect(mapPokemonDetail(bulbasaurDto()).abilities).toEqual([
      { name: 'overgrow', shortEffect: null, isHidden: false },
      { name: 'chlorophyll', shortEffect: 'Doubles Speed during strong sunlight.', isHidden: true },
    ]);
  });
});
