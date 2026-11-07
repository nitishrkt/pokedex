import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { POKEAPI_GRAPHQL_URL } from '../../common/constants/api.constants';
import { AppError, isAppError } from '../../common/models/app-error.model';
import { LoggerService } from '../../core/logger.service';
import {
  GET_POKEMON_DETAIL_QUERY,
  GET_POKEMON_LIST_QUERY,
  SEARCH_POKEMON_BY_NAME_QUERY,
} from '../constants/pokemon-queries.constants';
import { PokemonDto } from '../models/pokemon-api.model';
import { Pokemon } from '../models/pokemon.model';
import { PokemonApiService } from './pokemon-api.service';

const PIKACHU_DTO: PokemonDto = {
  id: 25,
  name: 'pikachu',
  height: 4,
  weight: 60,
  pokemontypes: [{ slot: 1, type: { name: 'electric' } }],
  pokemonstats: [
    { base_stat: 35, stat: { name: 'hp' } },
    { base_stat: 55, stat: { name: 'attack' } },
    { base_stat: 40, stat: { name: 'defense' } },
    { base_stat: 50, stat: { name: 'special-attack' } },
    { base_stat: 50, stat: { name: 'special-defense' } },
    { base_stat: 90, stat: { name: 'speed' } },
  ],
  pokemonsprites: [{ sprites: 'https://example.test/25.png' }],
};

describe('PokemonApiService', () => {
  let service: PokemonApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PokemonApiService);
    httpMock = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(LoggerService), 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  it('requests a page of Pokédex entries and maps them', () => {
    let result: Pokemon[] | undefined;
    service.getPokemonList$(25, 50).subscribe((pokemon) => (result = pokemon));

    const req = httpMock.expectOne(POKEAPI_GRAPHQL_URL);
    expect(req.request.body).toEqual({
      query: GET_POKEMON_LIST_QUERY,
      variables: { limit: 25, offset: 50, maxId: 1025 },
    });
    req.flush({ data: { pokemon: [PIKACHU_DTO] } });

    expect(result).toEqual([
      {
        id: 25,
        name: 'pikachu',
        height: 4,
        weight: 60,
        types: ['electric'],
        stats: {
          hp: 35,
          attack: 55,
          defense: 40,
          specialAttack: 50,
          specialDefense: 50,
          speed: 90,
        },
        totalStats: 320,
        spriteUrl: 'https://example.test/25.png',
      },
    ]);
  });

  it('escapes LIKE wildcards in the search term', () => {
    service.searchPokemonByName$('  50%_off\\ ', 5).subscribe();

    const req = httpMock.expectOne(POKEAPI_GRAPHQL_URL);
    expect(req.request.body).toEqual({
      query: SEARCH_POKEMON_BY_NAME_QUERY,
      variables: { pattern: '%50\\%\\_off\\\\%', limit: 5, maxId: 1025 },
    });
    req.flush({ data: { pokemon: [] } });
  });

  it('errors with a client AppError when the detail id does not exist', () => {
    let error: AppError | undefined;
    service.getPokemonDetail$(99999).subscribe({ error: (e: AppError) => (error = e) });

    const req = httpMock.expectOne(POKEAPI_GRAPHQL_URL);
    expect(req.request.body).toEqual({
      query: GET_POKEMON_DETAIL_QUERY,
      variables: { id: 99999, languageId: 9 },
    });
    req.flush({ data: { pokemon: [] } });

    expect(error).toMatchObject({ kind: 'client', message: 'Pokémon not found.' });
  });

  it('does not retry a graphql error', () => {
    let error: AppError | undefined;
    service.getPokemonList$(10).subscribe({ error: (e: AppError) => (error = e) });

    httpMock.expectOne(POKEAPI_GRAPHQL_URL).flush({ errors: [{ message: 'bad field' }] });

    // httpMock.verify() in afterEach fails if a retry sent a second request.
    expect(error?.kind).toBe('graphql');
  });

  it('re-sends the request after a transient failure', () => {
    vi.useFakeTimers();
    let result: Pokemon[] | undefined;
    service.getPokemonList$(1).subscribe((pokemon) => (result = pokemon));

    httpMock
      .expectOne(POKEAPI_GRAPHQL_URL)
      .flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });
    vi.advanceTimersByTime(500);
    httpMock.expectOne(POKEAPI_GRAPHQL_URL).flush({ data: { pokemon: [PIKACHU_DTO] } });

    expect(result?.map((pokemon) => pokemon.name)).toEqual(['pikachu']);
  });

  it('surfaces a mapper failure on a malformed response as an AppError', () => {
    let error: AppError | undefined;
    service.getPokemonList$(1).subscribe({ error: (e: AppError) => (error = e) });

    // Missing pokemontypes, pokemonstats and pokemonsprites.
    httpMock.expectOne(POKEAPI_GRAPHQL_URL).flush({ data: { pokemon: [{ id: 25 }] } });

    expect(error).toMatchObject({ kind: 'unknown', details: expect.any(TypeError) });
    expect(isAppError(error)).toBe(true);
  });
});
