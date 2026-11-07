import { toDisplayName } from './display-name.util';

describe('toDisplayName', () => {
  it('capitalises a single-word slug', () => {
    expect(toDisplayName('pikachu')).toBe('Pikachu');
  });

  it('turns hyphens into spaces and capitalises every word', () => {
    expect(toDisplayName('mr-mime')).toBe('Mr Mime');
    expect(toDisplayName('tapu-koko')).toBe('Tapu Koko');
  });

  it('ignores stray hyphens and keeps an empty slug empty', () => {
    expect(toDisplayName('-ho--oh-')).toBe('Ho Oh');
    expect(toDisplayName('')).toBe('');
  });
});
