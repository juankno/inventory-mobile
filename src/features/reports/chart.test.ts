import type { SeriesPoint } from './api';
import {
  axisLabel,
  bestIndex,
  bucketName,
  compactMoney,
  comparisonName,
  hourLabel,
  niceMax,
  trend,
  visibleSeries,
} from './chart';

const point = (start: string, total = 0): SeriesPoint => ({ start, total, sales: total > 0 ? 1 : 0, profit: 0 });

describe('nombres de los grupos', () => {
  it('dice la hora como en Colombia', () => {
    expect([0, 9, 12, 15].map(hourLabel)).toEqual(['12 a. m.', '9 a. m.', '12 m.', '3 p. m.']);
  });

  it('nombra cada grupo completo', () => {
    expect(bucketName('2026-11-18T14', 'HOUR')).toBe('De 2 p. m. a 3 p. m.');
    expect(bucketName('2026-11-17', 'DAY')).toBe('Martes 17 de noviembre');
    expect(bucketName('2026-11-16', 'WEEK')).toBe('Semana del 16 de noviembre');
    expect(bucketName('2026-11-01', 'MONTH')).toBe('Noviembre de 2026');
  });

  it('usa el día de la semana en el eje de una semana y el número en el de un mes', () => {
    expect(axisLabel('2026-11-16', 'DAY', 7)).toBe('lun');
    expect(axisLabel('2026-11-16', 'DAY', 30)).toBe('16');
    expect(axisLabel('2026-11-16', 'WEEK', 13)).toBe('16 nov');
  });
});

describe('visibleSeries', () => {
  const day = Array.from({ length: 24 }, (_, hour) => point(`2026-11-18T${String(hour).padStart(2, '0')}`));

  it('muestra de 7 a. m. a 8 p. m. si las ventas caen ahí', () => {
    const series = visibleSeries(day, 'HOUR');
    expect(series[0].start).toBe('2026-11-18T07');
    expect(series[series.length - 1].start).toBe('2026-11-18T19');
  });

  it('amplía las horas si hubo ventas temprano o tarde', () => {
    const early = day.map((item, hour) => (hour === 5 || hour === 22 ? point(item.start, 1000) : item));
    const series = visibleSeries(early, 'HOUR');
    expect(series[0].start).toBe('2026-11-18T05');
    expect(series[series.length - 1].start).toBe('2026-11-18T22');
  });

  it('no recorta los días', () => {
    const days = [point('2026-11-01'), point('2026-11-02')];
    expect(visibleSeries(days, 'DAY')).toBe(days);
  });
});

describe('bestIndex', () => {
  it('elige el primero de los que más vendieron', () => {
    expect(bestIndex([point('a', 10), point('b', 30), point('c', 30)])).toBe(1);
  });

  it('es null sin ventas', () => {
    expect(bestIndex([point('a'), point('b')])).toBeNull();
  });
});

describe('montos y escala', () => {
  it('abrevia los montos', () => {
    expect([900, 6500, 64_000, 1_250_000].map(compactMoney)).toEqual(['$900', '$6,5 mil', '$64 mil', '$1,3 M']);
  });

  it('redondea el tope de la escala', () => {
    expect([0, 7, 64_000, 180_000, 230_000].map(niceMax)).toEqual([1, 10, 100_000, 200_000, 250_000]);
  });
});

describe('comparación', () => {
  it('nombra el período con que se compara', () => {
    expect(comparisonName({ kind: 'yesterday', period: { from: '', to: '' } })).toBe('ayer');
    expect(comparisonName({ kind: 'previousDays', days: 10 })).toBe('los 10 días anteriores');
  });

  it('calcula la variación', () => {
    expect(trend(112, 100)).toEqual({ direction: 'up', percent: 12 });
    expect(trend(80, 100)).toEqual({ direction: 'down', percent: 20 });
    expect(trend(100.2, 100)).toEqual({ direction: 'same' });
    expect(trend(500, 0)).toEqual({ direction: 'new' });
    expect(trend(0, 0)).toEqual({ direction: 'none' });
  });
});
