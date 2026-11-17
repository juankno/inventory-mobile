import { File, Paths } from 'expo-file-system';

import { apiDownload, apiRequest } from '@/shared/api/apiClient';
import type { Unit } from '@/shared/api/types';
import { toApiDate, type ReportPeriod } from './periods';

// Llamadas a la API de la funcionalidad reports.
// profit: ganancia de las ventas que tienen precio y costo. Es null si el backend
// todavía no la calcula (versión anterior al costo del producto).
type PeriodSales = { total: number; sales: number; profit: number | null };

export type SalesSummary = {
  today: PeriodSales;
  week: PeriodSales;
  topProducts: { name: string; unit: Unit; quantity: number; total: number }[];
  // Ventas de la semana que no suman: el producto no tenía precio al venderse.
  salesWithoutPrice: number;
  // Ventas de la semana que no suman a la ganancia: no tenían costo.
  salesWithoutCost: number;
};

export type ReportKind = 'inventory' | 'sales' | 'movements';

const FILE_NAMES: Record<ReportKind, string> = {
  inventory: 'inventario',
  sales: 'ventas',
  movements: 'movimientos',
};

type SalesSummaryDto = Omit<SalesSummary, 'today' | 'week' | 'salesWithoutCost'> & {
  today: Omit<PeriodSales, 'profit'> & { profit?: number };
  week: Omit<PeriodSales, 'profit'> & { profit?: number };
  salesWithoutCost?: number;
};

const toPeriodSales = ({ profit, ...period }: SalesSummaryDto['today']): PeriodSales => ({
  ...period,
  profit: typeof profit === 'number' && Number.isFinite(profit) ? profit : null,
});

export async function getSalesSummary(): Promise<SalesSummary> {
  const dto = await apiRequest<SalesSummaryDto>('GET', '/reports/summary');
  return {
    ...dto,
    today: toPeriodSales(dto.today),
    week: toPeriodSales(dto.week),
    salesWithoutCost: dto.salesWithoutCost ?? 0,
  };
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
