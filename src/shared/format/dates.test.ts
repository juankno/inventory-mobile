import { formatDayHeading, formatTimeAgo } from './dates';

const NOW = Date.UTC(2026, 10, 9, 12);
const MINUTE = 60_000;

describe('formatTimeAgo', () => {
  it.each([
    [0, 'hace un momento'],
    [30_000, 'hace un momento'],
    [MINUTE, 'hace 1 min'],
    [59 * MINUTE, 'hace 59 min'],
    [60 * MINUTE, 'hace 1 h'],
    [23 * 60 * MINUTE, 'hace 23 h'],
    [24 * 60 * MINUTE, 'hace 1 día'],
    [3 * 24 * 60 * MINUTE, 'hace 3 días'],
  ])('%d ms → %s', (elapsed, expected) => {
    expect(formatTimeAgo(NOW - elapsed, NOW)).toBe(expected);
  });

  it('no muestra tiempos negativos si el reloj del celular cambió', () => {
    expect(formatTimeAgo(NOW + MINUTE, NOW)).toBe('hace un momento');
  });
});

describe('formatDayHeading', () => {
  const now = new Date(2026, 10, 19, 15, 0);

  it('dice Hoy y Ayer en los dos últimos días', () => {
    expect(formatDayHeading(new Date(2026, 10, 19, 8, 30).toISOString(), now)).toBe('Hoy');
    expect(formatDayHeading(new Date(2026, 10, 18, 23, 59).toISOString(), now)).toBe('Ayer');
  });

  // El motor de Intl decide si escribe "20 oct." o "20 de oct": se revisan el día y el mes.
  it('muestra el día y el mes de los días anteriores', () => {
    expect(formatDayHeading(new Date(2026, 9, 20, 18, 10).toISOString(), now)).toMatch(/20.*oct/);
  });

  it('muestra el año solo si el día es de otro año', () => {
    expect(formatDayHeading(new Date(2026, 9, 20).toISOString(), now)).not.toContain('2026');
    expect(formatDayHeading(new Date(2025, 11, 31).toISOString(), now)).toContain('2025');
  });
});
