import { messages } from '@/shared/i18n/messages';
import { ApiError, type ApiErrorBody } from './errors';

// Cliente HTTP único sobre fetch (M-04): agrega la URL base y el token,
// y convierte las respuestas de error en ApiError.
const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000/api/v1';

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

export async function apiRequest<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', messages.errors.network);
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

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
