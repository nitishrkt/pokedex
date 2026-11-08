import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RadarChart } from 'echarts/charts';
import { RadarComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { EChartsCoreOption } from 'echarts/core';
import { provideEchartsCore, NgxEchartsDirective } from 'ngx-echarts';

import { POKEMON_STAT_LABELS, RADAR_MAX_STAT } from '../../constants/pokemon-stats.constants';
import { PokemonStats } from '../../models/pokemon.model';

// Register only what the chart uses, to keep the lazy chunk small.
echarts.use([RadarChart, RadarComponent, TooltipComponent, CanvasRenderer]);

/**
 * Radar chart of the six base stats. The option is built once; later stat
 * changes arrive through `[merge]`, so ECharts animates the polygon from the
 * previous Pokémon to the new one instead of redrawing it.
 */
@Component({
  selector: 'app-stats-radar-chart',
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  template: `
    <div
      class="radar"
      echarts
      role="img"
      [attr.aria-label]="label()"
      [options]="baseOptions"
      [merge]="update()"
      [autoResize]="true"
    ></div>
  `,
  styles: `
    :host {
      display: block;
    }
    .radar {
      width: 100%;
      height: 260px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsRadarChartComponent {
  readonly stats = input.required<PokemonStats>();
  readonly color = input('#007acc');

  protected readonly label = computed(
    () =>
      'Base stats: ' +
      POKEMON_STAT_LABELS.map(({ key, full }) => `${full} ${this.stats()[key]}`).join(', '),
  );

  protected readonly baseOptions: EChartsCoreOption = {
    animationDuration: 600,
    animationDurationUpdate: 700,
    animationEasingUpdate: 'cubicInOut',
    radar: {
      radius: '68%',
      indicator: POKEMON_STAT_LABELS.map(({ short }) => ({ name: short, max: RADAR_MAX_STAT })),
      axisName: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
      splitNumber: 4,
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } },
    },
    series: [{ type: 'radar', symbol: 'none', data: [{ value: [0, 0, 0, 0, 0, 0] }] }],
  };

  /** Series update merged into the base option on each stats change. */
  protected readonly update = computed<EChartsCoreOption>(() => ({
    series: [
      {
        data: [
          {
            value: POKEMON_STAT_LABELS.map(({ key }) => this.stats()[key]),
            lineStyle: { color: this.color(), width: 2 },
            areaStyle: { color: this.color(), opacity: 0.35 },
            itemStyle: { color: this.color() },
          },
        ],
      },
    ],
  }));
}
