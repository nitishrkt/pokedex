/**
 * Turns a PokéAPI slug into a display name: hyphens become spaces and each
 * word is capitalised, e.g. `mr-mime` → "Mr Mime", `solar-power` → "Solar Power".
 */
export function toDisplayName(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
