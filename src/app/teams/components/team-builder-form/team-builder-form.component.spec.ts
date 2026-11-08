import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, NEVER } from 'rxjs';

import { PokemonApiService } from '../../../pokedex/services/pokemon-api.service';
import { TeamEntry } from '../../models/team.model';
import { TeamSelectors } from '../../state/team.selectors';
import { TeamBuilderFormComponent } from './team-builder-form.component';

const EXISTING: TeamEntry = {
  id: '1',
  trainerId: '1',
  name: 'Kanto Starters',
  pokemonIds: [25],
  createdAt: '2024-01-01T00:00:00Z',
  trainer: null,
  pending: false,
};

describe('TeamBuilderFormComponent', () => {
  let fixture: ComponentFixture<TeamBuilderFormComponent>;
  let component: TeamBuilderFormComponent;
  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const nameInput = (): HTMLInputElement =>
    element().querySelector('#team-name') as HTMLInputElement;
  const nameHint = (): string =>
    element().querySelector('#team-name-hint')?.textContent?.trim() ?? '';

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TeamSelectors, useValue: { teams$: new BehaviorSubject([EXISTING]) } },
        { provide: PokemonApiService, useValue: { searchPokemonByName$: () => NEVER } },
      ],
    });
    fixture = TestBed.createComponent(TeamBuilderFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('shows no error on a pristine form', () => {
    expect(nameHint()).toContain('unique among your teams');
  });

  it('shows the error only once the field is touched', async () => {
    nameInput().dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(nameHint()).toBe('Give your team a name.');
  });

  it('shows the length error after typing a too short name', async () => {
    nameInput().value = 'ab';
    nameInput().dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(nameHint()).toContain('3 to 30 characters');
    expect(nameInput().getAttribute('aria-invalid')).toBe('true');
  });

  it('does not emit an invalid submit, but reveals every error', async () => {
    const created = vi.fn();
    component.create.subscribe(created);

    (element().querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(created).not.toHaveBeenCalled();
    expect(nameHint()).toBe('Give your team a name.');
    expect(element().querySelector('#team-pokemon-error')?.textContent).toContain(
      'Pick at least 1',
    );
  });

  it('emits a trimmed name and the ids on a valid submit, then resets', async () => {
    const created = vi.fn();
    component.create.subscribe(created);
    component['form'].controls.name.setValue('  Sinnoh  ');
    component['form'].controls.pokemonIds.setValue([25, 6]);
    // Skip the debounced unique-name check; the validator has its own spec.
    component['form'].controls.name.clearAsyncValidators();
    component['form'].controls.name.updateValueAndValidity();

    component['submit']();

    expect(created).toHaveBeenCalledWith({ name: 'Sinnoh', pokemonIds: [25, 6] });
    expect(component['form'].getRawValue()).toEqual({ name: '', pokemonIds: [] });
    expect(component['form'].pristine).toBe(true);
  });
});
