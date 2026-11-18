import { suggestionStaleTime } from './useProducts';

describe('suggestionStaleTime', () => {
  it('recuerda un día una sugerencia encontrada', () => {
    expect(suggestionStaleTime({ name: 'Arroz Diana 500 g', unit: 'UNIT', source: 'COMMUNITY' })).toBe(86_400_000);
  });

  it('vuelve a preguntar en cada escaneo si no había sugerencia', () => {
    expect(suggestionStaleTime(null)).toBe(0);
    expect(suggestionStaleTime(undefined)).toBe(0);
  });
});
