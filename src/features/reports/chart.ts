import type { SeriesGranularity, SeriesPoint } from './api';
import type { Comparison } from './periods';

// Cálculos para los gráficos de reportes, separados de la pantalla para probarlos.

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const parts = (start: string) => {
  const [year, month, day] = start.slice(0, 10).split('-').map(Number);
  return { year, month: month - 1, day, weekday: new Date(year, month - 1, day).getDay() };
};

const hourOf = (start: string) => Number(start.slice(11, 13));

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// "9 a. m.", "12 m.", "3 p. m.", como se dice en Colombia.
export function hourLabel(hour: number): string {
  if (hour === 0) return '12 a. m.';
  if (hour === 12) return '12 m.';
  return hour < 12 ? `${hour} a. m.` : `${hour - 12} p. m.`;
}

// Nombre completo del grupo, para el detalle y el lector de pantalla.
export function bucketName(start: string, granularity: SeriesGranularity): string {
  const { year, month, day, weekday } = parts(start);
  switch (granularity) {
    case 'HOUR': {
      const hour = hourOf(start);
      return `De ${hourLabel(hour)} a ${hourLabel((hour + 1) % 24)}`;
    }
    case 'DAY':
      return `${capitalize(WEEKDAYS[weekday])} ${day} de ${MONTHS[month]}`;
    case 'WEEK':
      return `Semana del ${day} de ${MONTHS[month]}`;
    case 'MONTH':
      return `${capitalize(MONTHS[month])} de ${year}`;
  }
}

// Etiqueta corta del eje: "9 a. m.", "lun", "17", "16 nov", "nov".
export function axisLabel(start: string, granularity: SeriesGranularity, count: number): string {
  const { month, day, weekday } = parts(start);
  switch (granularity) {
    case 'HOUR':
      return hourLabel(hourOf(start));
    case 'DAY':
      return count <= 7 ? WEEKDAYS[weekday].slice(0, 3) : String(day);
    case 'WEEK':
      return `${day} ${MONTHS[month].slice(0, 3)}`;
    case 'MONTH':
      return MONTHS[month].slice(0, 3);
  }
}

// En un solo día se muestran las horas de atención: al menos de 7 a. m. a 8 p. m., y
// más si hubo ventas antes o después.
export function visibleSeries(series: SeriesPoint[], granularity: SeriesGranularity): SeriesPoint[] {
  if (granularity !== 'HOUR') return series;
  const withSales = series.map((point, index) => (point.sales > 0 ? index : -1)).filter((index) => index >= 0);
  const first = Math.min(7, ...withSales);
  const last = Math.max(19, ...withSales);
  return series.slice(first, last + 1);
}

// El grupo que más vendió; con empate, el primero. null si no hubo ventas.
export function bestIndex(series: SeriesPoint[]): number | null {
  let best: number | null = null;
  series.forEach((point, index) => {
    if (point.total > 0 && (best === null || point.total > series[best].total)) best = index;
  });
  return best;
}

// Montos cortos para el eje: "$900", "$6,5 mil", "$64 mil", "$1,3 M".
export function compactMoney(value: number): string {
  const format = (amount: number) =>
    (amount < 10 ? Math.round(amount * 10) / 10 : Math.round(amount)).toString().replace('.', ',');
  if (value >= 1_000_000) return `$${format(value / 1_000_000)} M`;
  if (value >= 1_000) return `$${format(value / 1_000)} mil`;
  return `$${Math.round(value)}`;
}

// Un tope "redondo" para la escala: 1, 2, 2,5 o 5 por una potencia de 10.
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const factor = [1, 2, 2.5, 5, 10].find((step) => step * power >= value) ?? 10;
  return factor * power;
}

// Con qué se compara, dicho de forma natural: "ayer", "los 10 días anteriores".
export function comparisonName(comparison: Comparison): string {
  switch (comparison.kind) {
    case 'yesterday':
      return 'ayer';
    case 'lastWeek':
      return 'los mismos días de la semana pasada';
    case 'lastMonth':
      return 'los mismos días del mes pasado';
    case 'monthBefore':
      return 'el mes anterior';
    case 'previousDays':
      return comparison.days === 1 ? 'el día anterior' : `los ${comparison.days} días anteriores`;
  }
}

export type Trend =
  | { direction: 'up' | 'down'; percent: number }
  | { direction: 'same' }
  // No hubo ventas en el período anterior: no hay porcentaje que mostrar.
  | { direction: 'new' }
  | { direction: 'none' };

export function trend(current: number, previous: number): Trend {
  if (previous <= 0) return current > 0 ? { direction: 'new' } : { direction: 'none' };
  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent === 0) return { direction: 'same' };
  return { direction: percent > 0 ? 'up' : 'down', percent: Math.abs(percent) };
}
