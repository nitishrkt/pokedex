import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PokemonFiltersComponent } from './pokemon-filters.component';

describe('PokemonFiltersComponent', () => {
  let fixture: ComponentFixture<PokemonFiltersComponent>;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const searchInput = (): HTMLInputElement =>
    element().querySelector('#pokemon-search') as HTMLInputElement;
  const typeSelect = (): HTMLSelectElement =>
    element().querySelector('#pokemon-type') as HTMLSelectElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(PokemonFiltersComponent);
    fixture.componentRef.setInput('search', 'char');
    fixture.componentRef.setInput('type', 'fire');
    await fixture.whenStable();
  });

  it('reflects the current search and type, with All plus the 18 types', () => {
    expect(searchInput().value).toBe('char');
    expect(typeSelect().value).toBe('fire');
    expect(typeSelect().options.length).toBe(19);
    expect(typeSelect().options[0].textContent?.trim()).toBe('All types');
  });

  it('emits the raw text on every input event', () => {
    const searchChange = vi.fn();
    fixture.componentInstance.searchChange.subscribe(searchChange);

    searchInput().value = 'chari';
    searchInput().dispatchEvent(new Event('input'));

    expect(searchChange).toHaveBeenCalledWith('chari');
  });

  it('clears the search from the clear button and keeps focus in the field', () => {
    const searchChange = vi.fn();
    fixture.componentInstance.searchChange.subscribe(searchChange);

    element().querySelector<HTMLButtonElement>('button[aria-label="Clear search"]')?.click();

    expect(searchChange).toHaveBeenCalledWith('');
    expect(document.activeElement).toBe(searchInput());
  });

  it('emits the chosen type, or null for All types', () => {
    const typeChange = vi.fn();
    fixture.componentInstance.typeChange.subscribe(typeChange);

    typeSelect().value = 'water';
    typeSelect().dispatchEvent(new Event('change'));
    typeSelect().value = '';
    typeSelect().dispatchEvent(new Event('change'));

    expect(typeChange.mock.calls).toEqual([['water'], [null]]);
  });
});
