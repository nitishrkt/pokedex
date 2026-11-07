import {
  POKEMON_TYPE_COLORS,
  POKEMON_TYPE_NAMES,
  POKEMON_TYPE_TEXT_COLORS,
} from './pokemon-types.constants';

/** WCAG 2 relative luminance of a `#RRGGBB` colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe('type badge colours', () => {
  it('gives every type badge text with WCAG AA contrast (4.5:1)', () => {
    const failing = POKEMON_TYPE_NAMES.filter(
      (type) => contrastRatio(POKEMON_TYPE_COLORS[type], POKEMON_TYPE_TEXT_COLORS[type]) < 4.5,
    );

    expect(failing).toEqual([]);
  });
});
