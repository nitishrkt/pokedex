import { TestBed } from '@angular/core/testing';

import {
  TOAST_DURATION_MS,
  TOAST_ERROR_DURATION_MS,
  TOAST_MAX_VISIBLE,
} from '../constants/toast.constants';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds toasts in order with their kind', () => {
    service.success('Team created');
    service.error('Could not create team');

    expect(service.toasts()).toEqual([
      { id: expect.any(Number), kind: 'success', message: 'Team created' },
      { id: expect.any(Number), kind: 'error', message: 'Could not create team' },
    ]);
  });

  it('auto-dismisses a toast after its duration, keeping errors longer', () => {
    service.success('Saved');
    service.error('Failed');

    vi.advanceTimersByTime(TOAST_DURATION_MS);
    expect(service.toasts().map((toast) => toast.message)).toEqual(['Failed']);

    vi.advanceTimersByTime(TOAST_ERROR_DURATION_MS - TOAST_DURATION_MS);
    expect(service.toasts()).toEqual([]);
  });

  it('removes a toast on manual dismiss and clears its timer', () => {
    const id = service.show('Hello');
    expect(vi.getTimerCount()).toBe(1);

    service.dismiss(id);

    expect(service.toasts()).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('dismisses the oldest toast, and its timer, beyond the visible cap', () => {
    for (let i = 1; i <= TOAST_MAX_VISIBLE + 1; i++) {
      service.show(`Toast ${i}`);
    }

    expect(service.toasts().map((toast) => toast.message)).toEqual([
      'Toast 2',
      'Toast 3',
      'Toast 4',
    ]);
    expect(vi.getTimerCount()).toBe(TOAST_MAX_VISIBLE);
  });

  it('pauses auto-dismiss while paused and restarts the full duration on resume', () => {
    const id = service.show('Hover me');
    vi.advanceTimersByTime(TOAST_DURATION_MS - 1);

    service.pause(id);
    vi.advanceTimersByTime(TOAST_DURATION_MS * 2);
    expect(service.toasts().length).toBe(1);
    expect(vi.getTimerCount()).toBe(0);

    service.resume(id);
    service.resume(id);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(TOAST_DURATION_MS);
    expect(service.toasts()).toEqual([]);
  });

  it('ignores resume for a toast that was already dismissed', () => {
    const id = service.show('Gone');
    service.dismiss(id);

    service.resume(id);

    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears pending timers when the injector is destroyed', () => {
    service.show('One');
    service.error('Two');

    TestBed.resetTestingModule();

    expect(vi.getTimerCount()).toBe(0);
  });
});
