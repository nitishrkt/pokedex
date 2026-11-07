import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * Previous / next pagination with a rows-per-page select and a "1–10 of 25"
 * range. Generic over the page-size type, so a feature's own union of sizes
 * flows through `pageSizeChange` without casts. `disabled` keeps it in place
 * (same size, controls off, range blank) while the data is not ready.
 */
@Component({
  selector: 'app-paginator',
  templateUrl: './paginator.component.html',
  styleUrl: './paginator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginatorComponent<TSize extends number = number> {
  /** 1-based. */
  readonly page = input.required<number>();
  readonly pageCount = input.required<number>();
  readonly pageSize = input.required<TSize>();
  readonly total = input.required<number>();
  readonly pageSizeOptions = input.required<readonly TSize[]>();
  readonly disabled = input(false);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<TSize>();

  protected readonly rangeLabel = computed(() => {
    const total = this.total();
    if (this.disabled()) {
      return '';
    }
    if (total === 0) {
      return '0 results';
    }
    const first = (this.page() - 1) * this.pageSize() + 1;
    const last = Math.min(this.page() * this.pageSize(), total);
    return `${first}–${last} of ${total}`;
  });

  protected readonly canGoBack = computed(() => !this.disabled() && this.page() > 1);
  protected readonly canGoForward = computed(
    () => !this.disabled() && this.page() < this.pageCount(),
  );

  protected onPageSizeChange(value: string): void {
    const size = this.pageSizeOptions().find((option) => String(option) === value);
    if (size !== undefined) {
      this.pageSizeChange.emit(size);
    }
  }
}
