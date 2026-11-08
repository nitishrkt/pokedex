import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  merge,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
} from 'rxjs';

import { EmptyStateComponent } from '../../../common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../common/components/error-state/error-state.component';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { DisplayNamePipe } from '../../../common/pipes/display-name.pipe';
import { toAsyncState } from '../../../common/utils/async-state.util';
import { TypeBadgeComponent } from '../../../pokedex/components/type-badge/type-badge.component';
import { SEARCH_DEBOUNCE_MS } from '../../../pokedex/constants/pokemon.constants';
import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { PokemonApiService } from '../../../pokedex/services/pokemon-api.service';
import { TEAM_MAX_SIZE } from '../../constants/team.constants';

/**
 * Autocomplete that picks Pokémon as removable chips. As a form control its
 * value is the picked Pokémon ids. The dropdown handles loading, empty and
 * error (with Retry); its status messages sit outside the `listbox`, which
 * holds options only.
 *
 * Typing runs `debounceTime → distinctUntilChanged → switchMap`, so a newer
 * term cancels the HTTP request for an older one.
 */
@Component({
  selector: 'app-pokemon-picker',
  imports: [
    DisplayNamePipe,
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonComponent,
    TypeBadgeComponent,
  ],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: PokemonPickerComponent, multi: true }],
  templateUrl: './pokemon-picker.component.html',
  styleUrl: './pokemon-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonPickerComponent implements ControlValueAccessor {
  private readonly api = inject(PokemonApiService);

  /** Id of the input, so the form's label can point at it. */
  readonly inputId = input('pokemon-picker-input');
  /** Id of the element describing the input (an error message), if any. */
  readonly describedBy = input<string | null>(null);
  readonly invalid = input(false);

  protected readonly maxSize = TEAM_MAX_SIZE;
  protected readonly selected = signal<readonly Pokemon[]>([]);
  protected readonly text = signal('');
  protected readonly open = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly disabled = signal(false);

  private readonly typed$ = new Subject<string>();
  private readonly retry$ = new Subject<void>();
  private onChange: (ids: number[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  /** Debounced, de-duplicated search term; replays so Retry can reuse it. */
  private readonly term$ = this.typed$.pipe(
    debounceTime(SEARCH_DEBOUNCE_MS),
    map((term) => term.trim().toLowerCase()),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** The term the shown results belong to; differs from the input while debouncing. */
  protected readonly settledTerm = signal('');

  private readonly results = toSignal(
    merge(this.term$, this.retry$.pipe(switchMap(() => this.term$.pipe(take(1))))).pipe(
      switchMap((term) => {
        this.settledTerm.set(term);
        return term === '' ? of(null) : this.api.searchPokemonByName$(term).pipe(toAsyncState());
      }),
    ),
    { initialValue: null },
  );

  /** What the dropdown shows. `loading` also covers the debounce wait. */
  protected readonly view = computed(() => {
    const term = this.text().trim().toLowerCase();
    if (term === '') {
      return null;
    }
    const results = this.results();
    if (term !== this.settledTerm() || results === null || results.status === 'loading') {
      return { status: 'loading' as const };
    }
    return results;
  });

  protected readonly options = computed(() => {
    const view = this.view();
    return view?.status === 'success' ? view.data : [];
  });

  protected readonly full = computed(() => this.selected().length >= TEAM_MAX_SIZE);
  protected readonly popupVisible = computed(
    () => this.open() && this.view() !== null && !this.full(),
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.typed$.complete());
  }

  writeValue(ids: number[] | null): void {
    const wanted = new Set(ids ?? []);
    this.selected.update((list) => list.filter((pokemon) => wanted.has(pokemon.id)));
  }

  registerOnChange(fn: (ids: number[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  protected onInput(value: string): void {
    this.text.set(value);
    this.open.set(true);
    this.activeIndex.set(-1);
    this.typed$.next(value);
  }

  protected onBlur(): void {
    this.open.set(false);
    this.onTouched();
  }

  protected isSelected(pokemon: Pokemon): boolean {
    return this.selected().some((candidate) => candidate.id === pokemon.id);
  }

  protected add(pokemon: Pokemon): void {
    if (this.isSelected(pokemon) || this.full()) {
      return;
    }
    this.selected.update((list) => [...list, pokemon]);
    this.emit();
    this.onInput('');
    this.open.set(false);
  }

  protected remove(pokemon: Pokemon): void {
    this.selected.update((list) => list.filter((candidate) => candidate.id !== pokemon.id));
    this.emit();
    this.onTouched();
  }

  protected retry(): void {
    this.retry$.next();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.options().length;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (count === 0) {
          return;
        }
        event.preventDefault();
        this.open.set(true);
        const step = event.key === 'ArrowDown' ? 1 : -1;
        this.activeIndex.update((index) => (index + step + count) % count);
        break;
      }
      case 'Enter': {
        const option = this.options()[this.activeIndex()];
        if (this.popupVisible() && option) {
          event.preventDefault(); // do not submit the form
          this.add(option);
        }
        break;
      }
      case 'Escape':
        if (this.open()) {
          event.stopPropagation();
          this.open.set(false);
        }
        break;
      case 'Backspace': {
        const last = this.selected().at(-1);
        if (this.text() === '' && last) {
          this.remove(last);
        }
        break;
      }
    }
  }

  private emit(): void {
    this.onChange(this.selected().map(({ id }) => id));
  }
}
