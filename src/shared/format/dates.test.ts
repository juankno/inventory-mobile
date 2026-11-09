import { formatTimeAgo } from './dates';

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
