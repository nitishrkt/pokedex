import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { map, Observable, of, switchMap, take, timer } from 'rxjs';

import {
  TEAM_MAX_SIZE,
  TEAM_MIN_SIZE,
  TEAM_NAME_CHECK_DEBOUNCE_MS,
  TEAM_NAME_MAX_LENGTH,
  TEAM_NAME_MIN_LENGTH,
} from '../constants/team.constants';

/** Compares team names ignoring case and surrounding whitespace. */
export function normalizeTeamName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Checks the trimmed name is `min`–`max` characters; error `nameLength`.
 * An empty value passes, because `Validators.required` reports it.
 */
export function teamNameLengthValidator(
  min = TEAM_NAME_MIN_LENGTH,
  max = TEAM_NAME_MAX_LENGTH,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;
    if (!value) {
      return null;
    }
    const actual = value.trim().length;
    return actual < min || actual > max ? { nameLength: { min, max, actual } } : null;
  };
}

/** Checks the picked Pokémon count is `min`–`max`; error `teamSize`. */
export function teamSizeValidator(min = TEAM_MIN_SIZE, max = TEAM_MAX_SIZE): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const actual = ((control.value as readonly number[] | null) ?? []).length;
    return actual < min || actual > max ? { teamSize: { min, max, actual } } : null;
  };
}

/**
 * Async check that no existing team has the same name (error `nameTaken`).
 * Waits `debounceMs` before reading the names; Angular unsubscribes the
 * previous run when the value changes, so only the last keystroke is checked.
 * A blank value passes (`required` reports it).
 */
export function uniqueTeamNameValidator(
  teamNames$: () => Observable<readonly string[]>,
  debounceMs = TEAM_NAME_CHECK_DEBOUNCE_MS,
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const wanted = normalizeTeamName((control.value as string | null) ?? '');
    if (wanted === '') {
      return of(null);
    }
    return timer(debounceMs).pipe(
      switchMap(() => teamNames$().pipe(take(1))),
      map((names) =>
        names.some((name) => normalizeTeamName(name) === wanted) ? { nameTaken: true } : null,
      ),
    );
  };
}
