import { messages } from '@/shared/i18n/messages';
import { ApiError, type ApiErrorBody } from './errors';
import { mockRequest } from './mock/mockServer';

// Cliente HTTP único sobre fetch (M-04): agrega la URL base y el token,
// y convierte las respuestas de error en ApiError.
const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000/api/v1';

// Modo demostración: mientras no haya backend, las peticiones las responde una
// API simulada en memoria. Se desactiva con EXPO_PUBLIC_USE_MOCK_API=false.
export const isMockApi = process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false';

// Rutas que ya responde el backend aunque el modo demostración siga activo,
// separadas por comas (por ejemplo "/auth/login,/auth/register"). Así la app
// pasa al backend real a medida que se despliegan los endpoints.
const realRoutes = (process.env.EXPO_PUBLIC_REAL_API_ROUTES ?? '')
  .split(',')
  .map((route: string) => route.trim())
  .filter(Boolean);

// "/products" abarca "/products/123" y "/products?x", pero no "/productsX".
export function isRealRoute(path: string, routes: string[] = realRoutes): boolean {
  const pathname = path.split('?')[0];
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

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
  if (isMockApi && !isRealRoute(path)) return mockRequest<T>(method, path, body);

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
