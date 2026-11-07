import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToastService } from '../../services/toast.service';
import { ToastContainerComponent } from './toast-container.component';

describe('ToastContainerComponent', () => {
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastService: ToastService;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ToastContainerComponent);
    toastService = TestBed.inject(ToastService);
    await fixture.whenStable();
  });

  it('renders toasts in one polite live region, without nested alerts', async () => {
    toastService.success('Team created');
    toastService.error('Could not delete team');
    await fixture.whenStable();

    expect(element().querySelector('.toast-container')?.getAttribute('aria-live')).toBe('polite');
    const toasts = element().querySelectorAll('.toast-container__toast');
    expect(toasts.length).toBe(2);
    expect(toasts[1].textContent).toContain('Could not delete team');
    expect(element().querySelector('[role="alert"]')).toBeNull();
  });

  it('pauses auto-dismiss while a toast is hovered', async () => {
    const pause = vi.spyOn(toastService, 'pause');
    const resume = vi.spyOn(toastService, 'resume');
    const id = toastService.show('Hello');
    await fixture.whenStable();
    const toast = element().querySelector('.toast-container__toast');

    toast?.dispatchEvent(new MouseEvent('mouseenter'));
    toast?.dispatchEvent(new MouseEvent('mouseleave'));

    expect(pause).toHaveBeenCalledWith(id);
    expect(resume).toHaveBeenCalledWith(id);
  });

  it('dismisses a toast from its dismiss button', async () => {
    toastService.show('Hello');
    await fixture.whenStable();

    element()
      .querySelector<HTMLButtonElement>('button[aria-label="Dismiss notification"]')
      ?.click();
    await fixture.whenStable();

    expect(toastService.toasts()).toEqual([]);
    expect(element().querySelectorAll('.toast-container__toast').length).toBe(0);
  });
});
