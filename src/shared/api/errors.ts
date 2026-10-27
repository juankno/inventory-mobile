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
