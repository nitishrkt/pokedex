import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Shape preset: `text` is a line, `circle` uses `height` for both sides, `rect` is a block. */
export type SkeletonVariant = 'text' | 'circle' | 'rect';

/**
 * Shimmering placeholder sized like the content it stands in for, so the
 * layout does not jump when data arrives. Hidden from assistive tech: the
 * consuming container sets `aria-busy`.
 */
@Component({
  selector: 'app-skeleton',
  template: '',
  styleUrl: './skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[class.skeleton--text]': "variant() === 'text'",
    '[class.skeleton--circle]': "variant() === 'circle'",
    '[style.width]': 'resolvedWidth()',
    '[style.height]': 'height()',
  },
})
export class SkeletonComponent {
  readonly width = input('100%');
  readonly height = input('1rem');
  readonly variant = input<SkeletonVariant>('rect');

  protected readonly resolvedWidth = computed(() =>
    this.variant() === 'circle' ? this.height() : this.width(),
  );
}
