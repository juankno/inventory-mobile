import { apiRequest } from '@/shared/api/apiClient';
import {
  toMovement,
  toMovementResult,
  type Movement,
  type MovementDto,
  type MovementResultDto,
  type MovementType,
  type OutboundReason,
  type Page,
} from '@/shared/api/types';

// Llamadas a la API de la funcionalidad movements (RF-11 a RF-13, RF-15).
export type CreateMovementInput = {
  productId: string;
  type: MovementType;
  // Solo en las salidas.
  reason: OutboundReason | null;
  // Entrada y salida: cantidad que suma o resta. Ajuste: existencia contada,
  // que queda como la nueva existencia del producto.
  quantity: number;
  // Evita registrar dos veces el mismo movimiento si se reintenta (RU-01).
  idempotencyKey: string;
  // Con "Deshacer": el movimiento que este ajuste revierte, para que no cuente en los reportes.
  revertsMovementId?: string;
};

// Historial del producto por páginas, del más reciente al más antiguo (RF-15).
// cursor es el nextCursor de la página anterior; sin él se pide la primera.
export async function listMovements(
  productId: string,
  { limit, cursor }: { limit: number; cursor?: string | null },
): Promise<Page<Movement>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  const page = await apiRequest<Page<MovementDto>>('GET', `/products/${productId}/movements?${params}`);
  return { items: page.items.map(toMovement), nextCursor: page.nextCursor };
}

// El backend solo acepta reason en las salidas: sin motivo, el campo no se envía.
export const createMovement = async ({ reason, ...input }: CreateMovementInput) =>
  toMovementResult(
    await apiRequest<MovementResultDto>('POST', '/movements', reason ? { ...input, reason } : input),
  );
