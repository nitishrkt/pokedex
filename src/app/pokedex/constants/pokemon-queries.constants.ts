/*
 * PokéAPI v1beta2 documents. Each was checked against the live endpoint.
 * `sprites(path: "front_default")` selects one URL instead of the whole
 * sprites JSON blob, which keeps the full list near 0.5 MB.
 */

const POKEMON_SUMMARY_FRAGMENT = `
  fragment PokemonSummaryFields on pokemon {
    id
    name
    height
    weight
    pokemontypes(order_by: { slot: asc }) {
      slot
      type {
        name
      }
    }
    pokemonstats {
      base_stat
      stat {
        name
      }
    }
    pokemonsprites {
      sprites(path: "front_default")
    }
  }
`;

/** The task's `GetPokemon` query, adapted to v1beta2 field names. */
export const GET_POKEMON_LIST_QUERY = `
  query GetPokemonList($limit: Int!, $offset: Int!, $maxId: Int!) {
    pokemon(
      limit: $limit
      offset: $offset
      where: { id: { _lte: $maxId } }
      order_by: { id: asc }
    ) {
      ...PokemonSummaryFields
    }
  }
  ${POKEMON_SUMMARY_FRAGMENT}
`;

/**
 * One Pokémon with abilities in a single request. v1beta2 has no
 * `pokemon_by_pk`, so it filters by id; the nested `pokemonabilities`
 * relation replaces the task's separate `GetAbilities` query.
 */
export const GET_POKEMON_DETAIL_QUERY = `
  query GetPokemonDetail($id: Int!, $languageId: Int!) {
    pokemon(where: { id: { _eq: $id } }, limit: 1) {
      ...PokemonSummaryFields
      pokemonabilities(order_by: { slot: asc }) {
        slot
        is_hidden
        ability {
          name
          abilityeffecttexts(where: { language_id: { _eq: $languageId } }, limit: 1) {
            short_effect
          }
        }
      }
    }
  }
  ${POKEMON_SUMMARY_FRAGMENT}
`;

/** Case-insensitive name search for the team picker autocomplete. */
export const SEARCH_POKEMON_BY_NAME_QUERY = `
  query SearchPokemonByName($pattern: String!, $limit: Int!, $maxId: Int!) {
    pokemon(
      limit: $limit
      where: { name: { _ilike: $pattern }, id: { _lte: $maxId } }
      order_by: { id: asc }
    ) {
      ...PokemonSummaryFields
    }
  }
  ${POKEMON_SUMMARY_FRAGMENT}
`;
