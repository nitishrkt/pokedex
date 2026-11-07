import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { POKEAPI_GRAPHQL_URL } from '../../common/constants/api.constants';
import { createAppError } from '../../common/models/app-error.model';
import { escapeLikePattern } from '../../common/utils/escape-like-pattern.util';
import { retryTransient } from '../../common/utils/retry-transient.util';
import { GraphqlClientService } from '../../core/graphql/graphql-client.service';
import { normalizeAppError } from '../../core/graphql/graphql-error.util';
import { LoggerService } from '../../core/logger.service';
import {
  GET_POKEMON_DETAIL_QUERY,
  GET_POKEMON_LIST_QUERY,
  SEARCH_POKEMON_BY_NAME_QUERY,
} from '../constants/pokemon-queries.constants';
import { ENGLISH_LANGUAGE_ID, POKEDEX_MAX_ID } from '../constants/pokemon.constants';
import { PokemonDetailResponse, PokemonListResponse } from '../models/pokemon-api.model';
import { Pokemon, PokemonDetail } from '../models/pokemon.model';
import { mapPokemon, mapPokemonDetail } from '../utils/pokemon-mapper.util';

/** Default number of autocomplete suggestions. */
const DEFAULT_SEARCH_LIMIT = 10;

/**
 * Read-only PokéAPI access. Each call retries transient failures with backoff,
 * then emits once or errors with an AppError.
 */
@Injectable({ providedIn: 'root' })
export class PokemonApiService {
  private readonly graphql = inject(GraphqlClientService);
  private readonly logger = inject(LoggerService);

  /**
   * Loads Pokédex entries (ids 1–1025) ordered by id; pass `POKEDEX_MAX_ID`
   * as `limit` to load all. Errors with an AppError after retries.
   */
  getPokemonList$(limit: number, offset = 0): Observable<Pokemon[]> {
    return this.graphql
      .request$<PokemonListResponse>(POKEAPI_GRAPHQL_URL, GET_POKEMON_LIST_QUERY, {
        limit,
        offset,
        maxId: POKEDEX_MAX_ID,
      })
      .pipe(
        retryTransient(),
        map(({ pokemon }) => pokemon.map(mapPokemon)),
        normalizeAppError(this.logger, 'getPokemonList$'),
      );
  }

  /**
   * Loads one Pokémon with stats and English abilities. Errors with a `client`
   * AppError ("Pokémon not found.") for an unknown id, otherwise as above.
   */
  getPokemonDetail$(id: number): Observable<PokemonDetail> {
    return this.graphql
      .request$<PokemonDetailResponse>(POKEAPI_GRAPHQL_URL, GET_POKEMON_DETAIL_QUERY, {
        id,
        languageId: ENGLISH_LANGUAGE_ID,
      })
      .pipe(
        retryTransient(),
        map(({ pokemon }) => {
          const [dto] = pokemon;
          if (!dto) {
            throw createAppError('client', {
              message: 'Pokémon not found.',
              details: { reason: 'No pokemon with this id', id },
            });
          }
          return mapPokemonDetail(dto);
        }),
        normalizeAppError(this.logger, 'getPokemonDetail$'),
      );
  }

  /**
   * Case-insensitive "name contains" search, ordered by id. `%` and `_` match
   * literally; a blank term matches everything. Errors with an AppError.
   */
  searchPokemonByName$(term: string, limit = DEFAULT_SEARCH_LIMIT): Observable<Pokemon[]> {
    return this.graphql
      .request$<PokemonListResponse>(POKEAPI_GRAPHQL_URL, SEARCH_POKEMON_BY_NAME_QUERY, {
        pattern: `%${escapeLikePattern(term.trim())}%`,
        limit,
        maxId: POKEDEX_MAX_ID,
      })
      .pipe(
        retryTransient(),
        map(({ pokemon }) => pokemon.map(mapPokemon)),
        normalizeAppError(this.logger, 'searchPokemonByName$'),
      );
  }
}
