import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { createAppError } from '../../../common/models/app-error.model';
import { errorState, loadingState, successState } from '../../../common/models/async-state.model';
import { PokemonStats } from '../../models/pokemon.model';
import { makePokemon } from '../../testing/pokemon.fixtures';
import { StatsRadarChartComponent } from '../stats-radar-chart/stats-radar-chart.component';
import { PokemonDetailPanelComponent } from './pokemon-detail-panel.component';

// ECharts needs a canvas, which jsdom does not provide.
@Component({
  selector: 'app-stats-radar-chart',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StubRadarChartComponent {
  readonly stats = input.required<PokemonStats>();
  readonly color = input('');
}

describe('PokemonDetailPanelComponent', () => {
  let fixture: ComponentFixture<PokemonDetailPanelComponent>;
  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const pikachu = makePokemon(25, 'pikachu', ['electric']);

  beforeEach(async () => {
    TestBed.overrideComponent(PokemonDetailPanelComponent, {
      remove: { imports: [StatsRadarChartComponent] },
      add: { imports: [StubRadarChartComponent] },
    });
    fixture = TestBed.createComponent(PokemonDetailPanelComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('pokemon', pikachu);
    await fixture.whenStable();
  });

  it('shows the Pokémon straight from the list entry', () => {
    expect(element().querySelector('.panel__title')?.textContent).toContain('Pikachu');
    expect(element().querySelectorAll('.panel__stat').length).toBe(7);
  });

  it('shows skeletons for abilities while loading', async () => {
    fixture.componentRef.setInput('detail', loadingState());
    await fixture.whenStable();
    expect(element().querySelectorAll('.panel__ability-skeleton').length).toBe(2);
  });

  it('lists abilities, marking hidden ones', async () => {
    fixture.componentRef.setInput(
      'detail',
      successState({
        ...pikachu,
        abilities: [
          { name: 'static', shortEffect: 'May paralyze.', isHidden: false },
          { name: 'lightning-rod', shortEffect: null, isHidden: true },
        ],
      }),
    );
    await fixture.whenStable();
    expect(element().querySelectorAll('.panel__ability').length).toBe(2);
    expect(element().querySelector('.panel__hidden-tag')?.textContent).toContain('Hidden');
    expect(element().textContent).toContain('No description available.');
  });

  it('shows an empty message when there are no abilities', async () => {
    fixture.componentRef.setInput('detail', successState({ ...pikachu, abilities: [] }));
    await fixture.whenStable();
    expect(element().textContent).toContain('No abilities listed');
  });

  it('shows the error and emits retry', async () => {
    fixture.componentRef.setInput(
      'detail',
      errorState(createAppError('network', { message: 'Offline.' })),
    );
    await fixture.whenStable();
    expect(element().textContent).toContain('Offline.');

    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);
    (element().querySelector('.error-state__retry') as HTMLButtonElement).click();
    expect(retry).toHaveBeenCalled();
  });

  it('emits dismissed on Escape only while open', async () => {
    const dismissed = vi.fn();
    fixture.componentInstance.dismissed.subscribe(dismissed);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(dismissed).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('open', false);
    await fixture.whenStable();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(dismissed).toHaveBeenCalledTimes(1);
  });
});
