import type { Product } from '@/shared/api/types';

export type StockStatus = 'ok' | 'low' | 'out';

// Agotado con 0 o menos; por agotarse cuando llega al mínimo configurado (RF-16).
export function stockStatus(product: Pick<Product, 'stock' | 'minStock'>): StockStatus {
  if (product.stock <= 0) return 'out';
  if (product.minStock !== null && product.stock <= product.minStock) return 'low';
  return 'ok';
}

export const stockStatusLabel: Record<Exclude<StockStatus, 'ok'>, string> = {
  low: 'Por agotarse',
  out: 'Agotado',
};
