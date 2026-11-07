import { TestBed } from '@angular/core/testing';

import { TypeBadgeComponent } from './type-badge.component';

describe('TypeBadgeComponent', () => {
  it('shows the type name in its colours', async () => {
    const fixture = TestBed.createComponent(TypeBadgeComponent);
    fixture.componentRef.setInput('type', 'fire');
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toBe('fire');
    expect(host.style.backgroundColor).toBe('rgb(238, 129, 48)');
    expect(host.style.color).toBe('rgb(26, 26, 26)');
  });
});
