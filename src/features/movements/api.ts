import { apiRequest } from '@/shared/api/apiClient';
import {
  toMovement,
  type Movement,
  type MovementDto,
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

export const createMovement = async (input: CreateMovementInput) =>
  toMovement(await apiRequest<MovementDto>('POST', '/movements', input));
