// Error tipado a partir del cuerpo {code, message} de la API (DDS 8.1, M-04).
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ApiErrorBody = { code: string; message: string };

export const isNetworkError = (error: unknown) => error instanceof ApiError && error.code === 'NETWORK_ERROR';

export const hasErrorCode = (error: unknown, code: string) => error instanceof ApiError && error.code === code;

// Mensaje en español para mostrar al usuario: el de la API o uno genérico.
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
