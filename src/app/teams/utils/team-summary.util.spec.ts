import { makePokemon } from '../../pokedex/testing/pokemon.fixtures';
import { summarizeTeam } from './team-summary.util';

const POKEMON = {
  6: makePokemon(6, 'charizard', ['fire', 'flying']),
  25: makePokemon(25, 'pikachu', ['electric']),
  130: makePokemon(130, 'gyarados', ['water', 'flying']),
};

describe('summarizeTeam', () => {
  it('counts types across members, most common first', () => {
    const { typeDistribution } = summarizeTeam({ pokemonIds: [6, 25, 130] }, POKEMON);
    expect(typeDistribution).toEqual([
      { type: 'flying', count: 2 },
      { type: 'fire', count: 1 },
      { type: 'water', count: 1 },
      { type: 'electric', count: 1 },
    ]);
  });

  it('sums the base stat totals of the members', () => {
    expect(summarizeTeam({ pokemonIds: [6, 25] }, POKEMON).totalBaseStats).toBe(600);
  });

  it('leaves unknown members out and reports them', () => {
    expect(summarizeTeam({ pokemonIds: [25, 9999] }, POKEMON)).toEqual({
      typeDistribution: [{ type: 'electric', count: 1 }],
      totalBaseStats: 300,
      unresolvedCount: 1,
    });
  });

  it('handles a team with no members', () => {
    expect(summarizeTeam({ pokemonIds: [] }, POKEMON)).toEqual({
      typeDistribution: [],
      totalBaseStats: 0,
      unresolvedCount: 0,
    });
  });
});
