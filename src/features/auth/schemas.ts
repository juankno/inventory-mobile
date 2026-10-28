import { z } from 'zod';

import { messages } from '@/shared/i18n/messages';

// Esquemas de validación (Zod) de la funcionalidad auth (M-11).
const v = messages.validation;

const email = z.string().trim().toLowerCase().pipe(z.email({ error: v.email }));
const newPassword = z.string().min(8, { error: v.passwordLength });
const personName = z.string().trim().min(1, { error: messages.common.required }).max(80, { error: v.name });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: messages.common.required }),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  businessName: personName,
  ownerName: personName,
  email,
  password: newPassword,
  dataPolicyAccepted: z.boolean().refine((value) => value, { error: v.policy }),
});
export type RegisterForm = z.input<typeof registerSchema>;

export const requestResetSchema = z.object({ email });
export type RequestResetForm = z.infer<typeof requestResetSchema>;

export const confirmResetSchema = z
  .object({
    code: z.string().trim().regex(/^\d{6}$/, { error: v.code }),
    newPassword,
    confirmPassword: z.string(),
  })
  .refine((form) => form.newPassword === form.confirmPassword, {
    error: v.passwordMismatch,
    path: ['confirmPassword'],
  });
export type ConfirmResetForm = z.infer<typeof confirmResetSchema>;
