import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/queryKeys';
import { stockStatus } from '@/shared/format/stock';
import { listAlerts } from '../api';

// Alertas agrupadas en agotados y por agotarse (RF-16).
export function useAlerts() {
  return useQuery({
    queryKey: queryKeys.alerts,
    queryFn: listAlerts,
    select: (products) => ({
      total: products.length,
      outOfStock: products.filter((product) => stockStatus(product) === 'out'),
      lowStock: products.filter((product) => stockStatus(product) === 'low'),
    }),
  });
}
