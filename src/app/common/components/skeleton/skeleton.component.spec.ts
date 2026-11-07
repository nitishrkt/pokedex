import { TestBed } from '@angular/core/testing';

import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  it('is hidden from assistive tech and sizes a circle from its height', async () => {
    const fixture = TestBed.createComponent(SkeletonComponent);
    fixture.componentRef.setInput('variant', 'circle');
    fixture.componentRef.setInput('height', '40px');
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.classList).toContain('skeleton--circle');
    expect(host.style.width).toBe('40px');
    expect(host.style.height).toBe('40px');
  });
});
