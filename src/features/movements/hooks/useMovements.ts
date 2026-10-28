import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/queryKeys';
import { createMovement, listMovements } from '../api';

export function useMovements(productId: string) {
  return useQuery({ queryKey: queryKeys.movements(productId), queryFn: () => listMovements(productId) });
}

// Un movimiento cambia la existencia: se refrescan el producto, la lista,
// el historial y las alertas.
export function useCreateMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMovement,
    onSuccess: (movement) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products });
      void queryClient.invalidateQueries({ queryKey: queryKeys.movements(movement.productId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },
  });
}
