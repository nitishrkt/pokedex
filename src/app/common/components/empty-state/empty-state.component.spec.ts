import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { EmptyStateComponent } from './empty-state.component';

@Component({
  imports: [EmptyStateComponent],
  template: `
    <app-empty-state heading="No Pokémon found" message="Try another search.">
      <button type="button">Clear filters</button>
    </app-empty-state>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostComponent {}

describe('EmptyStateComponent', () => {
  it('announces the heading and message as a status and renders the projected action', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    const status = element.querySelector('[role="status"]');
    expect(status?.querySelector('.empty-state__title')?.textContent).toBe('No Pokémon found');
    expect(element.querySelector('.empty-state__message')?.textContent).toBe('Try another search.');
    expect(element.querySelector('.empty-state__action button')?.textContent).toBe('Clear filters');
  });
});
