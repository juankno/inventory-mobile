import { File, Paths } from 'expo-file-system';

import { apiDownload, apiRequest } from '@/shared/api/apiClient';
import type { Unit } from '@/shared/api/types';
import { toApiDate, type ReportPeriod } from './periods';

// Llamadas a la API de la funcionalidad reports.
export type PeriodSales = { total: number; sales: number };

export type SalesSummary = {
  today: PeriodSales;
  week: PeriodSales;
  topProducts: { name: string; unit: Unit; quantity: number; total: number }[];
  // Ventas de la semana que no suman: el producto no tenía precio al venderse.
  salesWithoutPrice: number;
};

export type ReportKind = 'inventory' | 'sales' | 'movements';

const FILE_NAMES: Record<ReportKind, string> = {
  inventory: 'inventario',
  sales: 'ventas',
  movements: 'movimientos',
};

export const getSalesSummary = () => apiRequest<SalesSummary>('GET', '/reports/summary');

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
