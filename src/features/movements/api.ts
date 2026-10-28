import { apiRequest } from '@/shared/api/apiClient';
import { toMovement, type MovementDto, type MovementType, type OutboundReason } from '@/shared/api/types';

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

// Historial del producto, del más reciente al más antiguo.
export const listMovements = async (productId: string) =>
  (await apiRequest<MovementDto[]>('GET', `/products/${productId}/movements`)).map(toMovement);

export const createMovement = async (input: CreateMovementInput) =>
  toMovement(await apiRequest<MovementDto>('POST', '/movements', input));
