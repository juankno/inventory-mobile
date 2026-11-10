import { onlineManager, type Query } from '@tanstack/react-query';

import { isNetworkError } from './errors';
import { queryKeys } from './queryKeys';

// Sin conexión no se reintenta: la pantalla muestra lo guardado o el error de
// inmediato, y la consulta se repite sola al volver la conexión. Con conexión, un
// fallo de red suele ser pasajero (la red despertando al volver a la app), así que
// se reintenta dos veces antes de avisar.
export const shouldRetryQuery = (failureCount: number, error: unknown) =>
  isNetworkError(error) ? onlineManager.isOnline() && failureCount < 2 : failureCount < 1;

// Mientras la API no responda, se vuelve a intentar cada 30 s: si no, el aviso
// quedaría fijo hasta que el usuario recargue, aunque la conexión ya esté bien.
export const RECHECK_CONNECTION_MS = 30_000;

export type ConnectionNotice = 'offline' | 'unreachable' | null;

// Qué aviso mostrar: el celular sin red, o con red pero sin poder llegar a la API.
export function connectionNotice(isOnline: boolean, error: Error | null): ConnectionNotice {
  if (!isOnline) return 'offline';
  return isNetworkError(error) ? 'unreachable' : null;
}

// Se guarda lo que se ve al abrir la app. El historial completo puede ser muy
// largo y se pide cuando hace falta; el detalle ya guarda los últimos movimientos.
export function shouldPersistQuery({ queryKey, state }: Pick<Query, 'queryKey' | 'state'>) {
  if (state.status !== 'success') return false;
  const [scope, productId, part] = queryKey;
  const historyKey = queryKeys.movementHistory(String(productId));
  return !(scope === historyKey[0] && part === historyKey[2]);
}

// Lo que se ve en pantalla como error de carga: si ya hay datos guardados, la falta
// de conexión no es un error, porque el aviso superior ya la explica.
export const visibleLoadError = ({ data, error }: { data: unknown; error: Error | null }) =>
  data !== undefined && isNetworkError(error) ? null : error;
