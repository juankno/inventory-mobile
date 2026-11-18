import { File, Paths } from 'expo-file-system';

import { apiDownload, apiRequest } from '@/shared/api/apiClient';
import type { Unit } from '@/shared/api/types';
import { toApiDate, type ReportPeriod } from './periods';

// Llamadas a la API de la funcionalidad reports.
// Resumen de un período para la pantalla de reportes (GET /reports/overview).
// profit: ganancia de las ventas que tienen precio y costo.
export type PeriodSales = { total: number; sales: number; profit: number };

export type SeriesGranularity = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';

export type SeriesPoint = PeriodSales & {
  // "AAAA-MM-DDTHH" por horas; "AAAA-MM-DD" por días, semanas (lunes) o meses (día 1).
  start: string;
};

export type TopProduct = { name: string; unit: Unit; quantity: number; total: number };

export type SalesOverview = {
  from: string;
  to: string;
  current: PeriodSales;
  previous: PeriodSales & { from: string; to: string };
  granularity: SeriesGranularity;
  series: SeriesPoint[];
  topProducts: TopProduct[];
  // Ventas del período que no suman: el producto no tenía precio al venderse.
  salesWithoutPrice: number;
  // Ventas del período que no suman a la ganancia: no tenían costo.
  salesWithoutCost: number;
  // Estado de hoy del inventario, sin importar el período.
  inventory: { products: number; lowStock: number; outOfStock: number };
};

export type ReportKind = 'inventory' | 'sales' | 'movements';

const FILE_NAMES: Record<ReportKind, string> = {
  inventory: 'inventario',
  sales: 'ventas',
  movements: 'movimientos',
};

export function getSalesOverview(period: ReportPeriod, compare?: ReportPeriod): Promise<SalesOverview> {
  const query = new URLSearchParams({ from: period.from, to: period.to });
  if (compare) {
    query.set('compareFrom', compare.from);
    query.set('compareTo', compare.to);
  }
  return apiRequest<SalesOverview>('GET', `/reports/overview?${query.toString()}`);
}

// Descarga el Excel al almacenamiento temporal y devuelve su dirección para compartirlo.
export async function downloadReport(kind: ReportKind, period: ReportPeriod | null): Promise<string> {
  const query = period ? `?from=${period.from}&to=${period.to}` : '';
  const content = await apiDownload(`/reports/${kind}${query}`);
  const suffix = period ? (period.from === period.to ? period.from : `${period.from}-a-${period.to}`) : toApiDate(new Date());
  const file = new File(Paths.cache, `${FILE_NAMES[kind]}-${suffix}.xlsx`);
  file.create({ overwrite: true });
  await file.write(content);
  return file.uri;
}
