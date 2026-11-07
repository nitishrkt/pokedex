/**
 * PokéAPI GraphQL endpoint. The task's `https://beta.pokeapi.co/graphql/v1beta`
 * now answers 401; v1beta2 is the maintained one (no `pokemon_v2_` prefixes).
 */
export const POKEAPI_GRAPHQL_URL = 'https://graphql.pokeapi.co/v1beta2';

/** Local json-graphql-server holding teams and trainers (`npm run mock`). */
export const MOCK_GRAPHQL_URL = 'http://localhost:4000/';

/** A request with no response after this long fails as a `network` error. */
export const API_REQUEST_TIMEOUT_MS = 15_000;

/** Maximum number of retries for transient failures (network, 5xx, 429). */
export const RETRY_COUNT = 3;

/** Delay before the first retry; it doubles each time (500 ms, 1 s, 2 s). */
export const RETRY_BASE_DELAY_MS = 500;
