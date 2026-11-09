import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/queryKeys';
import { getSalesSummary } from '../api';

export function useSalesSummary() {
  return useQuery({ queryKey: queryKeys.salesSummary, queryFn: getSalesSummary });
}
