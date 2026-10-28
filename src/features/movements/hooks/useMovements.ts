import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import { queryKeys } from '@/shared/api/queryKeys';
import type { Movement } from '@/shared/api/types';
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

// Deshace un movimiento recién registrado con un ajuste a la existencia que
// había antes. El historial conserva ambos registros. Usa el cliente de
// consultas directamente porque la pantalla del movimiento ya se cerró.
export function useUndoMovement() {
  const queryClient = useQueryClient();
  return async (movement: Movement, previousStock: number) => {
    await createMovement({
      productId: movement.productId,
      type: 'ADJUSTMENT',
      reason: null,
      quantity: previousStock,
      idempotencyKey: Crypto.randomUUID(),
    });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.products }),
      queryClient.invalidateQueries({ queryKey: queryKeys.movements(movement.productId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts }),
    ]);
  };
}
