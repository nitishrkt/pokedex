import { FormControl } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';

import {
  teamNameLengthValidator,
  teamSizeValidator,
  uniqueTeamNameValidator,
} from './team-validators.util';

describe('uniqueTeamNameValidator', () => {
  afterEach(() => vi.useRealTimers());

  function setup(names: string[]): {
    control: FormControl<string>;
    names$: BehaviorSubject<readonly string[]>;
    read: ReturnType<typeof vi.fn>;
  } {
    const names$ = new BehaviorSubject<readonly string[]>(names);
    const read = vi.fn((): Observable<readonly string[]> => names$);
    const control = new FormControl('', {
      nonNullable: true,
      asyncValidators: [uniqueTeamNameValidator(read, 300)],
    });
    return { control, names$, read };
  }

  it('flags a name that exists, ignoring case and surrounding spaces', async () => {
    vi.useFakeTimers();
    const { control } = setup(['Kanto Starters']);

    control.setValue('  kanto STARTERS ');
    expect(control.pending).toBe(true);
    await vi.advanceTimersByTimeAsync(300);

    expect(control.pending).toBe(false);
    expect(control.errors).toEqual({ nameTaken: true });
  });

  it('accepts a new name', async () => {
    vi.useFakeTimers();
    const { control } = setup(['Kanto Starters']);

    control.setValue('Johto Squad');
    await vi.advanceTimersByTimeAsync(300);

    expect(control.valid).toBe(true);
  });

  it('debounces: only the last of several quick edits reads the names', async () => {
    vi.useFakeTimers();
    const { control, read } = setup(['Kanto Starters']);

    control.setValue('K');
    await vi.advanceTimersByTimeAsync(100);
    control.setValue('Ka');
    await vi.advanceTimersByTimeAsync(100);
    control.setValue('Kanto Starters');
    await vi.advanceTimersByTimeAsync(300);

    expect(read).toHaveBeenCalledTimes(1);
    expect(control.errors).toEqual({ nameTaken: true });
  });

  it('skips the check for a blank value', () => {
    const { control, read } = setup(['Kanto Starters']);
    control.setValue('   ');
    expect(control.valid).toBe(true);
    expect(read).not.toHaveBeenCalled();
  });
});

describe('teamNameLengthValidator', () => {
  const validate = (value: string) => teamNameLengthValidator()(new FormControl(value));

  it('accepts 3 to 30 characters, counting without surrounding spaces', () => {
    expect(validate('abc')).toBeNull();
    expect(validate('a'.repeat(30))).toBeNull();
    expect(validate('  abc  ')).toBeNull();
  });

  it('rejects too short and too long names, and whitespace only', () => {
    expect(validate('ab')).toEqual({ nameLength: { min: 3, max: 30, actual: 2 } });
    expect(validate('a'.repeat(31))).toMatchObject({ nameLength: { actual: 31 } });
    expect(validate('     ')).toMatchObject({ nameLength: { actual: 0 } });
  });

  it('leaves an empty value to the required validator', () => {
    expect(validate('')).toBeNull();
  });
});

describe('teamSizeValidator', () => {
  const validate = (ids: number[]) => teamSizeValidator()(new FormControl(ids));

  it('accepts 1 to 6 Pokémon', () => {
    expect(validate([1])).toBeNull();
    expect(validate([1, 2, 3, 4, 5, 6])).toBeNull();
  });

  it('rejects none and more than six', () => {
    expect(validate([])).toEqual({ teamSize: { min: 1, max: 6, actual: 0 } });
    expect(validate([1, 2, 3, 4, 5, 6, 7])).toMatchObject({ teamSize: { actual: 7 } });
  });
});
