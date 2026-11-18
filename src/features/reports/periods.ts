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

// Convierte "9/11/2026" en "2026-11-09", o null si la fecha no existe.
export function parseDayInput(text: string): string | null {
  const match = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [day, month, year] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  const exists = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return exists ? toApiDate(date) : null;
}

export type CustomPeriodResult =
  | { ok: true; period: ReportPeriod }
  | { ok: false; error: 'invalidDate' | 'reversed' | 'tooLong' };

export function parseCustomPeriod(from: string, to: string): CustomPeriodResult {
  const start = parseDayInput(from);
  const end = parseDayInput(to);
  if (!start || !end) return { ok: false, error: 'invalidDate' };
  const days = (Date.parse(end) - Date.parse(start)) / DAY_MS;
  if (days < 0) return { ok: false, error: 'reversed' };
  if (days >= MAX_PERIOD_DAYS) return { ok: false, error: 'tooLong' };
  return { ok: true, period: { from: start, to: end } };
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
