export type PeriodPreset = 'today' | 'week' | 'month' | 'lastMonth' | 'custom';

// Días incluidos en formato AAAA-MM-DD, como los pide la API.
export type ReportPeriod = { from: string; to: string };

const MAX_PERIOD_DAYS = 366;
const DAY_MS = 86_400_000;

const pad = (value: number) => String(value).padStart(2, '0');

export const toApiDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Los períodos fijos llegan hasta hoy; la semana empieza el lunes.
export function presetPeriod(preset: Exclude<PeriodPreset, 'custom'>, now = new Date()): ReportPeriod {
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = toApiDate(now);
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'week': {
      const daysSinceMonday = (now.getDay() + 6) % 7;
      return { from: toApiDate(new Date(year, month, now.getDate() - daysSinceMonday)), to: today };
    }
    case 'month':
      return { from: toApiDate(new Date(year, month, 1)), to: today };
    case 'lastMonth':
      return { from: toApiDate(new Date(year, month - 1, 1)), to: toApiDate(new Date(year, month, 0)) };
  }
}

// Convierte "2026-11-09" en la fecha local de ese día.
export const fromApiDate = (day: string) => {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
};

const shiftDays = (day: string, days: number) => {
  const date = fromApiDate(day);
  return toApiDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
};

export const daysInPeriod = ({ from, to }: ReportPeriod) =>
  Math.round((fromApiDate(to).getTime() - fromApiDate(from).getTime()) / DAY_MS) + 1;

// Al elegir "Otro" se arranca con los últimos 7 días, para que la pantalla muestre
// datos de una vez en lugar de dos campos vacíos.
export function defaultCustomPeriod(now = new Date()): ReportPeriod {
  const today = toApiDate(now);
  return { from: shiftDays(today, -6), to: today };
}

// Cambia una de las dos fechas y ajusta la otra si hace falta, para que el período
// siempre sea válido: "Desde" no queda después de "Hasta" y no pasa de un año (el
// límite del backend). Así no hay mensajes de error que mostrar.
export function changeCustomPeriod(period: ReportPeriod, field: 'from' | 'to', day: string): ReportPeriod {
  if (field === 'from') {
    const to = day > period.to ? day : period.to;
    const latest = shiftDays(day, MAX_PERIOD_DAYS - 1);
    return { from: day, to: to > latest ? latest : to };
  }
  const from = day < period.from ? day : period.from;
  const earliest = shiftDays(day, -(MAX_PERIOD_DAYS - 1));
  return { from: from < earliest ? earliest : from, to: day };
}

// Con qué se compara cada período, como lo diría el tendero: hoy contra ayer, la
// semana contra los mismos días de la semana pasada, el mes contra los mismos días
// del mes pasado. Sin `period`, el backend usa los días justo antes.
export type Comparison =
  | { kind: 'yesterday' | 'lastWeek' | 'lastMonth' | 'monthBefore'; period: ReportPeriod }
  | { kind: 'previousDays'; days: number; period?: undefined };

export function comparisonFor(preset: PeriodPreset, period: ReportPeriod): Comparison {
  switch (preset) {
    case 'today':
      return { kind: 'yesterday', period: { from: shiftDays(period.from, -1), to: shiftDays(period.to, -1) } };
    case 'week':
      return { kind: 'lastWeek', period: { from: shiftDays(period.from, -7), to: shiftDays(period.to, -7) } };
    case 'month': {
      // Del 1 al mismo día del mes pasado; si ese mes es más corto, hasta su último día.
      const end = fromApiDate(period.to);
      const lastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
      return {
        kind: 'lastMonth',
        period: {
          from: toApiDate(new Date(end.getFullYear(), end.getMonth() - 1, 1)),
          to: toApiDate(new Date(end.getFullYear(), end.getMonth() - 1, Math.min(end.getDate(), lastDay))),
        },
      };
    }
    case 'lastMonth': {
      const start = fromApiDate(period.from);
      return {
        kind: 'monthBefore',
        period: {
          from: toApiDate(new Date(start.getFullYear(), start.getMonth() - 1, 1)),
          to: toApiDate(new Date(start.getFullYear(), start.getMonth(), 0)),
        },
      };
    }
    case 'custom':
      return { kind: 'previousDays', days: daysInPeriod(period) };
  }
}
