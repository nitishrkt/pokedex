import { ComponentFixture, TestBed } from '@angular/core/testing';

import { createAppError } from '../../../common/models/app-error.model';
import {
  AsyncState,
  errorState,
  loadingState,
  successState,
} from '../../../common/models/async-state.model';
import { PokemonTableView } from '../../models/pokemon-state.model';
import { makePokemon } from '../../testing/pokemon.fixtures';
import { PokemonTableComponent } from './pokemon-table.component';

const BULBASAUR = makePokemon(1, 'bulbasaur', ['grass', 'poison'], { attack: 49 });
const MR_MIME = makePokemon(122, 'mr-mime', ['psychic', 'fairy'], { attack: 45 });

function view(overrides: Partial<PokemonTableView> = {}): AsyncState<PokemonTableView> {
  return successState({
    rows: [BULBASAUR, MR_MIME],
    total: 2,
    page: 1,
    pageSize: 10,
    pageCount: 1,
    hasData: true,
    ...overrides,
  });
}

describe('PokemonTableComponent', () => {
  let fixture: ComponentFixture<PokemonTableComponent>;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const bodyRows = (): NodeListOf<HTMLTableRowElement> => element().querySelectorAll('tbody tr');
  const header = (label: string): HTMLTableCellElement =>
    Array.from(element().querySelectorAll<HTMLTableCellElement>('thead th')).find(
      (th) => th.textContent?.trim() === label,
    ) as HTMLTableCellElement;

  async function render(state: AsyncState<PokemonTableView>): Promise<void> {
    fixture.componentRef.setInput('state', state);
    await fixture.whenStable();
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(PokemonTableComponent);
    fixture.componentRef.setInput('sort', { key: 'id', direction: 'asc' });
    fixture.componentRef.setInput('pageSize', 10);
  });

  it('renders one row per Pokémon with display name, type badges and stats', async () => {
    await render(view());

    const [first, second] = Array.from(bodyRows());
    expect(bodyRows().length).toBe(2);
    expect(first.querySelector('th[scope="row"]')?.textContent?.trim()).toBe('Bulbasaur');
    expect(second.querySelector('th[scope="row"]')?.textContent?.trim()).toBe('Mr Mime');
    expect(
      Array.from(first.querySelectorAll('app-type-badge')).map((badge) => badge.textContent),
    ).toEqual(['grass', 'poison']);
    // HP, Attack, Defense, Sp. Atk, Sp. Def, Speed, Total
    expect(
      Array.from(first.querySelectorAll('.pokemon-table__cell--num')).map((cell) =>
        cell.textContent?.trim(),
      ),
    ).toEqual(['50', '49', '50', '50', '50', '50', '299']);
  });

  it('emits the column key from a sortable header and reflects the sort in aria-sort', async () => {
    await render(view());
    const sortChange = vi.fn();
    fixture.componentInstance.sortChange.subscribe(sortChange);

    header('Attack').querySelector('button')?.click();
    expect(sortChange).toHaveBeenCalledWith('attack');

    expect(header('#').getAttribute('aria-sort')).toBe('ascending');
    expect(header('Attack').hasAttribute('aria-sort')).toBe(false);

    fixture.componentRef.setInput('sort', { key: 'attack', direction: 'desc' });
    await fixture.whenStable();

    expect(header('Attack').getAttribute('aria-sort')).toBe('descending');
    expect(header('#').hasAttribute('aria-sort')).toBe(false);
    expect(header('Types').querySelector('button')).toBeNull();
  });

  it('emits the Pokémon id when its row is selected, and marks the selected row', async () => {
    await render(view());
    const rowSelect = vi.fn();
    fixture.componentInstance.rowSelect.subscribe(rowSelect);

    bodyRows()[1].querySelector('button')?.click();
    expect(rowSelect).toHaveBeenCalledWith(122);

    fixture.componentRef.setInput('selectedId', 122);
    await fixture.whenStable();
    expect(bodyRows()[1].getAttribute('aria-current')).toBe('true');
    expect(bodyRows()[0].hasAttribute('aria-current')).toBe(false);
  });

  it('renders pageSize skeleton rows and marks the region busy while loading', async () => {
    fixture.componentRef.setInput('pageSize', 25);
    await render(loadingState());

    expect(bodyRows().length).toBe(25);
    expect(element().querySelectorAll('tbody tr.pokemon-table__row--skeleton').length).toBe(25);
    expect(element().querySelector('[role="region"]')?.getAttribute('aria-busy')).toBe('true');
  });

  it('tells "no results" (with Clear filters) apart from "no data"', async () => {
    await render(view({ rows: [], total: 0 }));
    const clearFilters = vi.fn();
    fixture.componentInstance.clearFilters.subscribe(clearFilters);

    expect(element().textContent).toContain('No Pokémon match your filters');
    element().querySelector<HTMLButtonElement>('.pokemon-table__clear')?.click();
    expect(clearFilters).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(element().querySelector('[role="region"]'));

    await render(view({ rows: [], total: 0, hasData: false }));
    expect(element().textContent).toContain('No Pokémon available');
    expect(element().querySelector('.pokemon-table__clear')).toBeNull();
  });

  it('shows the error with a Retry that emits and keeps focus on the table', async () => {
    await render(errorState(createAppError('network')));
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);

    expect(element().querySelector('[role="alert"]')?.textContent).toContain("Can't connect");
    expect(bodyRows().length).toBe(0);

    element().querySelector<HTMLButtonElement>('.error-state__retry')?.click();

    expect(retry).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(element().querySelector('[role="region"]'));
  });

  it('falls back to the placeholder when a sprite fails to load, and titles the name', async () => {
    await render(view({ rows: [{ ...BULBASAUR, spriteUrl: 'https://example.test/1.png' }] }));
    const sprite = element().querySelector('img.pokemon-table__sprite') as HTMLImageElement;
    sprite.dispatchEvent(new Event('error'));
    await fixture.whenStable();

    expect(element().querySelector('img.pokemon-table__sprite')).toBeNull();
    expect(element().querySelector('.pokemon-table__sprite--missing')).not.toBeNull();
    expect(element().querySelector('.pokemon-table__select')?.getAttribute('title')).toBe(
      'Bulbasaur',
    );
  });
});
