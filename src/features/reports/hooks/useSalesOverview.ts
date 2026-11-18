import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/queryKeys';
import { getSalesOverview } from '../api';
import type { ReportPeriod } from '../periods';

// Mientras llega el período nuevo se sigue viendo el anterior, sin saltos.
export function useSalesOverview(period: ReportPeriod, compare?: ReportPeriod) {
  return useQuery({
    queryKey: queryKeys.salesOverview(period.from, period.to, compare?.from ?? '', compare?.to ?? ''),
    queryFn: () => getSalesOverview(period, compare),
    placeholderData: keepPreviousData,
  });
}
