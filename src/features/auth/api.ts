import { apiRequest } from '@/shared/api/apiClient';
import type { AuthResponse } from '@/shared/api/types';

// Llamadas a la API de la funcionalidad auth (RF-01, RF-02, RF-04).
export type LoginInput = { email: string; password: string };

export type RegisterInput = {
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
  dataPolicyAccepted: true;
};

export type ConfirmResetInput = { email: string; code: string; newPassword: string };

export const login = (input: LoginInput) => apiRequest<AuthResponse>('POST', '/auth/login', input);

export const register = (input: RegisterInput) => apiRequest<AuthResponse>('POST', '/auth/register', input);

// Responde 204 aunque el correo no exista, para no revelar qué cuentas hay (RS-04).
export const requestPasswordReset = (email: string) =>
  apiRequest<void>('POST', '/auth/password-reset/request', { email });

export const confirmPasswordReset = (input: ConfirmResetInput) =>
  apiRequest<void>('POST', '/auth/password-reset/confirm', input);
