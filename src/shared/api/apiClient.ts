import { fetch as expoFetch } from 'expo/fetch';

import { messages } from '@/shared/i18n/messages';
import { ApiError, type ApiErrorBody } from './errors';
import { mockRequest } from './mock/mockServer';

// Cliente HTTP único sobre fetch (M-04): agrega la URL base y el token,
// y convierte las respuestas de error en ApiError.
const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://surtido-api.vercel.app/api/v1';

// Modo demostración: con EXPO_PUBLIC_USE_MOCK_API=true, las peticiones las responde
// una API simulada en memoria, para usar la app sin conexión ni cuenta.
export const isMockApi = process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';

// Con mala señal una petición puede no responder nunca: sin límite, el botón se
// quedaría cargando. Incluye el arranque en frío de Vercel. Repetir un movimiento
// es seguro, porque la clave de idempotencia evita registrarlo dos veces.
const REQUEST_TIMEOUT_MS = 20_000;
// Generar un reporte grande tarda más que una consulta.
const DOWNLOAD_TIMEOUT_MS = 60_000;

let getToken: () => string | null = () => null;
let onUnauthorized: () => void = () => {};

export function configureApiClient(options: {
  getToken: () => string | null;
  onUnauthorized: () => void;
}) {
  getToken = options.getToken;
  onUnauthorized = options.onUnauthorized;
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type HttpResponse = { ok: boolean; status: number; json(): Promise<unknown> };
type RequestInit = { method: Method; headers: Record<string, string>; body?: string; signal: AbortSignal };

async function send<R extends HttpResponse>(
  fetchFn: (url: string, init: RequestInit) => Promise<R>,
  method: Method,
  path: string,
  body?: unknown,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<R> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: R;
  try {
    response = await fetchFn(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    if (controller.signal.aborted) throw new ApiError(0, 'TIMEOUT', messages.errors.timeout);
    throw new ApiError(0, 'NETWORK_ERROR', messages.errors.network);
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 && token) onUnauthorized();

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      error?.code ?? 'UNEXPECTED_ERROR',
      error?.message ?? messages.errors.unexpected,
    );
  }

  return response;
}

export async function apiRequest<T>(method: Method, path: string, body?: unknown): Promise<T> {
  if (isMockApi) return mockRequest<T>(method, path, body);

  const response = await send(fetch, method, path, body);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

// Descarga un archivo. Usa expo/fetch porque el fetch de React Native no entrega los bytes.
export async function apiDownload(path: string): Promise<Uint8Array> {
  const response = await send(expoFetch, 'GET', path, undefined, DOWNLOAD_TIMEOUT_MS);
  try {
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', messages.errors.network);
  }
}
