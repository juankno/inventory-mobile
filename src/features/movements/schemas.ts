import { z } from 'zod';

import type { MovementType, Unit } from '@/shared/api/types';
import { allowsDecimals, parseQuantity } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';

// Validación (Zod) del movimiento antes de enviarlo (M-11).
const v = messages.validation;

export function movementQuantitySchema(type: MovementType, unit: Unit) {
  return z
    .string()
    .transform((text, ctx) => {
      const value = parseQuantity(text);
      if (value === null) {
        ctx.addIssue({ code: 'custom', message: v.number });
        return z.NEVER;
      }
      return value;
    })
    .refine((value) => (type === 'ADJUSTMENT' ? value >= 0 : value > 0), {
      error: type === 'ADJUSTMENT' ? v.notNegative : v.positive,
    })
    .refine((value) => allowsDecimals(unit) || Number.isInteger(value), { error: v.wholeUnits });
}

// Existencia que queda después del movimiento.
export function resultingStock(type: MovementType, stock: number, quantity: number): number {
  if (type === 'INBOUND') return stock + quantity;
  if (type === 'OUTBOUND') return stock - quantity;
  return quantity;
}
