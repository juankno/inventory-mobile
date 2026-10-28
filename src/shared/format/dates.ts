// Fechas relativas en español: "Hoy, 3:40 p. m.", "Ayer, 7:30 a. m.", "20 oct., 6:10 p. m.".
const timeFormat = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true });
const dayFormat = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export function formatRelativeDateTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  const time = timeFormat.format(date);
  if (days === 0) return `Hoy, ${time}`;
  if (days === 1) return `Ayer, ${time}`;
  return `${dayFormat.format(date)}, ${time}`;
}

// Saludo según la hora del día.
export function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Buenos días,';
  if (hour < 19) return 'Buenas tardes,';
  return 'Buenas noches,';
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}
