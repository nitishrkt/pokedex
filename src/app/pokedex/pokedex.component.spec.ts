import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { createAppError } from '../common/models/app-error.model';
import { Pokemon } from './models/pokemon.model';
import { PokedexPage } from './pokedex.component';
import { PokemonApiService } from './services/pokemon-api.service';
import { makePokemon } from './testing/pokemon.fixtures';

describe('PokedexPage', () => {
  let fixture: ComponentFixture<PokedexPage>;
  let requests: Subject<Pokemon[]>[];
  let api: Pick<PokemonApiService, 'getPokemonList$'>;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const bodyRows = (): NodeListOf<HTMLTableRowElement> => element().querySelectorAll('tbody tr');
  const region = (): HTMLElement => element().querySelector('[role="region"]') as HTMLElement;
  const summary = (): string | undefined =>
    element().querySelector('.pokedex-page__summary')?.textContent?.trim();

  beforeEach(async () => {
    requests = [];
    api = {
      getPokemonList$: vi.fn(() => {
        const request = new Subject<Pokemon[]>();
        requests.push(request);
        return request;
      }),
    };
    TestBed.configureTestingModule({ providers: [{ provide: PokemonApiService, useValue: api }] });
    fixture = TestBed.createComponent(PokedexPage);
    await fixture.whenStable();
  });

  it('shows skeleton rows while loading, then the first page of Pokémon', async () => {
    expect(api.getPokemonList$).toHaveBeenCalledOnce();
    expect(region().getAttribute('aria-busy')).toBe('true');
    expect(element().querySelectorAll('.pokemon-table__row--skeleton').length).toBe(10);
    expect(
      element().querySelector<HTMLButtonElement>('button[aria-label="Next page"]')?.disabled,
    ).toBe(true);

    const list = Array.from({ length: 12 }, (_, index) =>
      makePokemon(index + 1, `mon-${index + 1}`),
    );
    requests[0].next(list);
    requests[0].complete();
    await fixture.whenStable();

    expect(region().getAttribute('aria-busy')).toBe('false');
    expect(bodyRows().length).toBe(10);
    expect(summary()).toBe('Showing 12 Pokémon');
    expect(element().querySelector('.paginator__range')?.textContent?.trim()).toBe('1–10 of 12');

    element().querySelector<HTMLButtonElement>('button[aria-label="Next page"]')?.click();
    await fixture.whenStable();
    expect(bodyRows().length).toBe(2);
  });

  it('shows the error state, and Retry loads again with focus on the table', async () => {
    requests[0].error(createAppError('network'));
    await fixture.whenStable();

    expect(element().querySelector('[role="alert"]')?.textContent).toContain("Can't connect");
    element().querySelector<HTMLButtonElement>('.error-state__retry')?.click();
    await fixture.whenStable();

    expect(api.getPokemonList$).toHaveBeenCalledTimes(2);
    expect(element().querySelector('[role="alert"]')).toBeNull();
    expect(element().querySelectorAll('.pokemon-table__row--skeleton').length).toBe(10);
    expect(document.activeElement).toBe(region());

    requests[1].next([makePokemon(25, 'pikachu', ['electric'])]);
    requests[1].complete();
    await fixture.whenStable();
    expect(bodyRows()[0].textContent).toContain('Pikachu');
  });
});
