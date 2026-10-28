import type { Unit } from '@/shared/api/types';

// Nombres y abreviaturas de las unidades de medida (RD-02).
export const unitOptions = [
  { value: 'UNIT', label: 'Unidad' },
  { value: 'KILOGRAM', label: 'Kilo' },
  { value: 'GRAM', label: 'Gramo' },
  { value: 'POUND', label: 'Libra' },
  { value: 'LITER', label: 'Litro' },
] as const satisfies readonly { value: Unit; label: string }[];

const unitText: Record<Unit, { short: string; singular: string; plural: string; measure: string }> = {
  UNIT: { short: 'und.', singular: 'unidad', plural: 'unidades', measure: 'por unidad' },
  KILOGRAM: { short: 'kg', singular: 'kilo', plural: 'kilos', measure: 'por kilogramo' },
  GRAM: { short: 'g', singular: 'gramo', plural: 'gramos', measure: 'por gramo' },
  POUND: { short: 'lb', singular: 'libra', plural: 'libras', measure: 'por libra' },
  LITER: { short: 'L', singular: 'litro', plural: 'litros', measure: 'por litro' },
};

// Solo los productos por unidad exigen cantidades enteras (CHECK de DDS 7.3).
export const allowsDecimals = (unit: Unit) => unit !== 'UNIT';

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(value);
}

// "6 und.", "2,5 kg"
export function formatQuantity(value: number, unit: Unit): string {
  return `${formatNumber(value)} ${unitText[unit].short}`;
}

// "unidad" / "unidades", "kilo" / "kilos"
export function unitWord(value: number, unit: Unit): string {
  return value === 1 ? unitText[unit].singular : unitText[unit].plural;
}

// "Se mide por kilogramo"
export function unitMeasure(unit: Unit): string {
  return unitText[unit].measure;
}

export function unitLabel(unit: Unit): string {
  return unitOptions.find((option) => option.value === unit)?.label ?? unit;
}

// Convierte el texto de un campo numérico ("2,5") en número, o null si no es válido.
export function parseQuantity(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (normalized === '') return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
