import { z } from 'zod';

import type { Unit } from '@/shared/api/types';
import { allowsDecimals, parseQuantity } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';

// Esquemas de validación (Zod) de la funcionalidad products (M-11).
// Los campos numéricos se editan como texto y se convierten al guardar.
const v = messages.validation;

export const productFormSchema = z
  .object({
    name: z.string().trim().min(1, { error: messages.common.required }).max(80, { error: v.name }),
    unit: z.enum(['UNIT', 'KILOGRAM', 'GRAM', 'POUND', 'LITER']),
    // Vacío en la edición: las existencias solo cambian con movimientos.
    stock: z.string(),
    requireStock: z.boolean(),
    minStock: z.string(),
    salePrice: z.string(),
  })
  .superRefine((form, ctx) => {
    const checkQuantity = (field: 'stock' | 'minStock', required: boolean) => {
      const text = form[field];
      if (text.trim() === '') {
        if (required) ctx.addIssue({ code: 'custom', path: [field], message: messages.common.required });
        return;
      }
      const value = parseQuantity(text);
      if (value === null) ctx.addIssue({ code: 'custom', path: [field], message: v.number });
      else if (value < 0) ctx.addIssue({ code: 'custom', path: [field], message: v.notNegative });
      else if (!allowsDecimals(form.unit as Unit) && !Number.isInteger(value))
        ctx.addIssue({ code: 'custom', path: [field], message: v.wholeUnits });
    };
    checkQuantity('stock', form.requireStock);
    checkQuantity('minStock', false);

    if (form.salePrice.trim() !== '') {
      const price = parseQuantity(form.salePrice.replace(/\./g, ''));
      if (price === null) ctx.addIssue({ code: 'custom', path: ['salePrice'], message: v.number });
      else if (price < 0) ctx.addIssue({ code: 'custom', path: ['salePrice'], message: v.notNegative });
    }
  });

export type ProductForm = z.infer<typeof productFormSchema>;

// Mientras se escribe el precio, deja solo dígitos y agrega los puntos de miles:
// "12500" → "12.500". Los pesos colombianos no llevan decimales.
export function formatPriceInput(text: string): string {
  const digits = text.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// El precio se escribe en pesos con puntos de miles ("12.500").
export const parsePrice = (text: string) => (text.trim() === '' ? null : parseQuantity(text.replace(/\./g, '')));

export const parseOptionalQuantity = (text: string) => (text.trim() === '' ? null : parseQuantity(text));
