/**
 * Escapes `%`, `_` and `\` so user input matches literally in a Hasura `_ilike`
 * pattern: `50%_off` becomes `50\%\_off`.
 */
export function escapeLikePattern(term: string): string {
  return term.replace(/[\\%_]/g, '\\$&');
}
