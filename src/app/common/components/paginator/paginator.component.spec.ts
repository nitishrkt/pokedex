import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginatorComponent } from './paginator.component';

describe('PaginatorComponent', () => {
  let fixture: ComponentFixture<PaginatorComponent>;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const button = (label: string): HTMLButtonElement =>
    element().querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
  const range = (): string | undefined =>
    element().querySelector('.paginator__range')?.textContent?.trim();

  async function render(inputs: Record<string, unknown>): Promise<void> {
    fixture = TestBed.createComponent(PaginatorComponent);
    const defaults = { page: 1, pageCount: 3, pageSize: 10, total: 25, pageSizeOptions: [10, 25] };
    for (const [name, value] of Object.entries({ ...defaults, ...inputs })) {
      fixture.componentRef.setInput(name, value);
    }
    await fixture.whenStable();
  }

  it('shows the range and disables Previous on the first page only', async () => {
    await render({ page: 1 });
    expect(range()).toBe('1–10 of 25');
    expect(button('Previous page').disabled).toBe(true);
    expect(button('Next page').disabled).toBe(false);

    fixture.componentRef.setInput('page', 3);
    await fixture.whenStable();
    expect(range()).toBe('21–25 of 25');
    expect(button('Previous page').disabled).toBe(false);
    expect(button('Next page').disabled).toBe(true);
  });

  it('emits the neighbouring page from Previous and Next', async () => {
    await render({ page: 2 });
    const pageChange = vi.fn();
    fixture.componentInstance.pageChange.subscribe(pageChange);

    button('Next page').click();
    button('Previous page').click();

    expect(pageChange.mock.calls).toEqual([[3], [1]]);
  });

  it('emits the chosen page size as a number', async () => {
    await render({});
    const pageSizeChange = vi.fn();
    fixture.componentInstance.pageSizeChange.subscribe(pageSizeChange);
    const select = element().querySelector('select') as HTMLSelectElement;

    expect(select.value).toBe('10');
    select.value = '25';
    select.dispatchEvent(new Event('change'));

    expect(pageSizeChange).toHaveBeenCalledWith(25);
  });

  it('turns every control off and blanks the range while disabled', async () => {
    await render({ page: 2, disabled: true });

    expect(range()).toBe('');
    expect(button('Previous page').disabled).toBe(true);
    expect(button('Next page').disabled).toBe(true);
    expect((element().querySelector('select') as HTMLSelectElement).disabled).toBe(true);
  });

  it('says "0 results" when nothing matches', async () => {
    await render({ total: 0, pageCount: 1 });

    expect(range()).toBe('0 results');
    expect(button('Next page').disabled).toBe(true);
  });
});
