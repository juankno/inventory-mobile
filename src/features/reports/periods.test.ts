import { changeCustomPeriod, comparisonFor, defaultCustomPeriod, presetPeriod } from './periods';

describe('comparisonFor', () => {
  // Miércoles 11 de noviembre de 2026.
  const today = new Date(2026, 10, 11, 15);

  it('compara hoy con ayer', () => {
    expect(comparisonFor('today', presetPeriod('today', today)).period).toEqual({ from: '2026-11-10', to: '2026-11-10' });
  });

  it('compara la semana con los mismos días de la semana pasada', () => {
    expect(comparisonFor('week', presetPeriod('week', today)).period).toEqual({ from: '2026-11-02', to: '2026-11-04' });
  });

  it('compara el mes con los mismos días del mes pasado, sin pasarse de su último día', () => {
    expect(comparisonFor('month', presetPeriod('month', today)).period).toEqual({ from: '2026-10-01', to: '2026-10-11' });
    expect(comparisonFor('month', { from: '2026-03-01', to: '2026-03-31' }).period).toEqual({
      from: '2026-02-01',
      to: '2026-02-28',
    });
  });

  it('compara el mes pasado con el anterior, también al cambiar de año', () => {
    expect(comparisonFor('lastMonth', { from: '2026-01-01', to: '2026-01-31' }).period).toEqual({
      from: '2025-12-01',
      to: '2025-12-31',
    });
  });

  it('deja que el backend compare un período elegido con los días anteriores', () => {
    expect(comparisonFor('custom', { from: '2026-11-01', to: '2026-11-10' })).toEqual({ kind: 'previousDays', days: 10 });
  });
});

// Miércoles 11 de noviembre de 2026.
const now = new Date(2026, 10, 11, 15);

describe('presetPeriod', () => {
  it('hoy', () => {
    expect(presetPeriod('today', now)).toEqual({ from: '2026-11-11', to: '2026-11-11' });
  });

  it('la semana empieza el lunes', () => {
    expect(presetPeriod('week', now)).toEqual({ from: '2026-11-09', to: '2026-11-11' });
  });

  it('el domingo cuenta en la semana que empezó el lunes', () => {
    expect(presetPeriod('week', new Date(2026, 10, 15)).from).toBe('2026-11-09');
  });

  it('este mes llega hasta hoy', () => {
    expect(presetPeriod('month', now)).toEqual({ from: '2026-11-01', to: '2026-11-11' });
  });

  it('el mes pasado es completo, también al cambiar de año', () => {
    expect(presetPeriod('lastMonth', now)).toEqual({ from: '2026-10-01', to: '2026-10-31' });
    expect(presetPeriod('lastMonth', new Date(2027, 0, 5))).toEqual({ from: '2026-12-01', to: '2026-12-31' });
  });
});

describe('defaultCustomPeriod', () => {
  it('arranca con los últimos 7 días hasta hoy', () => {
    expect(defaultCustomPeriod(new Date(2026, 10, 11, 15))).toEqual({ from: '2026-11-05', to: '2026-11-11' });
  });
});

describe('changeCustomPeriod', () => {
  const period = { from: '2026-11-01', to: '2026-11-10' };

  it('cambia una fecha cuando el período sigue siendo válido', () => {
    expect(changeCustomPeriod(period, 'from', '2026-11-03')).toEqual({ from: '2026-11-03', to: '2026-11-10' });
    expect(changeCustomPeriod(period, 'to', '2026-11-05')).toEqual({ from: '2026-11-01', to: '2026-11-05' });
  });

  it('mueve "Hasta" si "Desde" queda después', () => {
    expect(changeCustomPeriod(period, 'from', '2026-11-15')).toEqual({ from: '2026-11-15', to: '2026-11-15' });
  });

  it('mueve "Desde" si "Hasta" queda antes', () => {
    expect(changeCustomPeriod(period, 'to', '2026-10-20')).toEqual({ from: '2026-10-20', to: '2026-10-20' });
  });

  it('no deja pasar de un año, el límite del backend', () => {
    expect(changeCustomPeriod(period, 'from', '2025-01-01')).toEqual({ from: '2025-01-01', to: '2026-01-01' });
    expect(changeCustomPeriod({ from: '2025-01-01', to: '2025-02-01' }, 'to', '2026-11-10')).toEqual({
      from: '2025-11-10',
      to: '2026-11-10',
    });
  });
});
