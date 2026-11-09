import Storage from 'expo-sqlite/kv-store';

import type { MovementType, OutboundReason } from '@/shared/api/types';

// Último tipo y motivo registrados desde el escáner. Al vender varios productos
// seguidos, el siguiente movimiento llega ya preparado ("Salida · Venta") y solo
// falta tocar Registrar. Se guarda en el celular, así sigue al reabrir la app.
type Choice = { type: MovementType; reason: OutboundReason | null };

const STORAGE_KEY = 'last-movement-choice';

let lastChoice: Choice | null | undefined;

function readStoredChoice(): Choice | null {
  try {
    const stored = Storage.getItemSync(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Choice) : null;
  } catch {
    return null;
  }
}

export function getLastChoice(): Choice | null {
  if (lastChoice === undefined) lastChoice = readStoredChoice();
  return lastChoice;
}

export function rememberChoice(choice: Choice) {
  lastChoice = choice;
  void Storage.setItem(STORAGE_KEY, JSON.stringify(choice)).catch(() => {});
}
