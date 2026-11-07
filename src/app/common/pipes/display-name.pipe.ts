import { Pipe, PipeTransform } from '@angular/core';

import { toDisplayName } from '../utils/display-name.util';

/** Formats a PokéAPI slug for display; see {@link toDisplayName}. */
@Pipe({ name: 'displayName' })
export class DisplayNamePipe implements PipeTransform {
  transform(slug: string): string {
    return toDisplayName(slug);
  }
}
