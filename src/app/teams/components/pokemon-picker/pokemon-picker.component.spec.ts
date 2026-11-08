import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';

import { createAppError } from '../../../common/models/app-error.model';
import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { PokemonApiService } from '../../../pokedex/services/pokemon-api.service';
import { makePokemon } from '../../../pokedex/testing/pokemon.fixtures';
import { PokemonPickerComponent } from './pokemon-picker.component';

describe('PokemonPickerComponent', () => {
  let fixture: ComponentFixture<PokemonPickerComponent>;
  let requests: { term: string; response: Subject<Pokemon[]>; unsubscribed: boolean }[];
  let changes: number[][];

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const input = (): HTMLInputElement => element().querySelector('input') as HTMLInputElement;

  async function type(value: string): Promise<void> {
    input().value = value;
    input().dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    vi.useFakeTimers();
    requests = [];
    changes = [];
    const api = {
      // Each call records itself and stays open until the test settles it by hand.
      searchPokemonByName$: (term: string) =>
        new Observable<Pokemon[]>((subscriber) => {
          const entry = { term, response: new Subject<Pokemon[]>(), unsubscribed: false };
          requests.push(entry);
          const inner = entry.response.subscribe(subscriber);
          return () => {
            entry.unsubscribed = true;
            inner.unsubscribe();
          };
        }),
    };
    TestBed.configureTestingModule({ providers: [{ provide: PokemonApiService, useValue: api }] });
    fixture = TestBed.createComponent(PokemonPickerComponent);
    fixture.componentInstance.registerOnChange((ids) => changes.push(ids));
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  it('searches once after the debounce, not on every keystroke', async () => {
    input().value = 'p';
    input().dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(100);
    input().value = 'pi';
    input().dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(300);

    expect(requests.map((request) => request.term)).toEqual(['pi']);
  });

  it('cancels the request for an older term when a newer one starts', async () => {
    await type('pi');
    await type('pik');

    expect(requests.map((request) => request.term)).toEqual(['pi', 'pik']);
    expect(requests[0].unsubscribed).toBe(true);
  });

  it('shows a skeleton while loading, then the options, and adds a chip on click', async () => {
    await type('pika');
    expect(element().querySelector('[aria-busy="true"]')).not.toBeNull();

    requests[0].response.next([makePokemon(25, 'pikachu', ['electric'])]);
    fixture.detectChanges();
    const option = element().querySelector('[role=option]') as HTMLElement;
    expect(option.textContent).toContain('Pikachu');

    option.click();
    fixture.detectChanges();
    expect(element().querySelectorAll('.picker__chip').length).toBe(1);
    expect(changes.at(-1)).toEqual([25]);
  });

  it('shows an empty message outside the listbox when nothing matches', async () => {
    await type('zzz');
    requests[0].response.next([]);
    fixture.detectChanges();

    expect(element().textContent).toContain('No Pokémon found');
    expect(element().querySelector('[role=listbox]')).toBeNull();
  });

  it('shows the error with Retry, and Retry repeats the same search', async () => {
    await type('pika');
    requests[0].response.error(createAppError('network', { message: 'Offline.' }));
    fixture.detectChanges();
    expect(element().textContent).toContain('Offline.');

    (element().querySelector('.error-state__retry') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(requests.map((request) => request.term)).toEqual(['pika', 'pika']);
  });

  it('removes a chip and stops accepting Pokémon at six', async () => {
    const component = fixture.componentInstance;
    for (let id = 1; id <= 6; id++) {
      component['add'](makePokemon(id, `mon-${id}`));
    }
    fixture.detectChanges();
    expect(input().disabled).toBe(true);
    expect(changes.at(-1)).toEqual([1, 2, 3, 4, 5, 6]);

    (element().querySelector('.picker__chip-remove') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(changes.at(-1)).toEqual([2, 3, 4, 5, 6]);
    expect(input().disabled).toBe(false);
  });
});
