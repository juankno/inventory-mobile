import type { MovementType, OutboundReason } from '@/shared/api/types';

// Último tipo y motivo registrados desde el escáner. Al vender varios productos
// seguidos, el siguiente movimiento llega ya preparado ("Salida · Venta") y solo
// falta tocar Registrar. Vive en memoria: al reiniciar la app se vuelve a elegir.
type Choice = { type: MovementType; reason: OutboundReason | null };

let lastChoice: Choice | null = null;

export const getLastChoice = () => lastChoice;

export function rememberChoice(choice: Choice) {
  lastChoice = choice;
}
