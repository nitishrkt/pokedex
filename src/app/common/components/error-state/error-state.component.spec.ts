import { ComponentFixture, TestBed } from '@angular/core/testing';

import { createAppError } from '../../models/app-error.model';
import { ErrorStateComponent } from './error-state.component';

describe('ErrorStateComponent', () => {
  let fixture: ComponentFixture<ErrorStateComponent>;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ErrorStateComponent);
    fixture.componentRef.setInput(
      'error',
      createAppError('network', { details: { url: 'https://secret.example/graphql' } }),
    );
    await fixture.whenStable();
  });

  it('announces the heading and friendly message as an alert, without Retry or details', () => {
    const alert = element().querySelector('[role="alert"]');

    expect(alert?.textContent).toContain('Something went wrong');
    expect(alert?.textContent).toContain("Can't connect right now.");
    expect(alert?.textContent).not.toContain('Retry');
    expect(element().textContent).not.toContain('secret.example');
  });

  it('emits retry when the Retry button is clicked', () => {
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);

    const button = element().querySelector<HTMLButtonElement>('button');
    expect(button?.textContent?.trim()).toBe('Retry');
    button?.click();

    expect(retry).toHaveBeenCalledOnce();
  });
});
