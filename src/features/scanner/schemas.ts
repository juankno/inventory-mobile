import { normalizeGtin, type BarcodeKind } from '@/shared/gs1/gtin';

// Clasificación de lo que lee la cámara o escribe el usuario (RF-09, RR-01, DDS 7.4).
export type ScannedCode =
  | { kind: 'gtin'; code: string }
  | { kind: 'internal'; code: string }
  // Un QR que no es de la app (de otro negocio, un enlace, etc.).
  | { kind: 'foreign' }
  // Un código de barras con dígito de control incorrecto.
  | { kind: 'invalid' };

// Identificador interno de las etiquetas QR: INV- y 10 caracteres base32 de Crockford (B-05).
const INTERNAL_CODE = /^INV-[0-9A-HJKMNP-TV-Z]{10}$/;

const barcodeKinds: readonly BarcodeKind[] = ['ean13', 'ean8', 'upc_a', 'upc_e'];

export const scannerBarcodeTypes = [...barcodeKinds, 'qr'] as const;

export function classifyScan(type: string, data: string): ScannedCode {
  const kind = type.toLowerCase().replace('-', '_');
  const value = data.trim();
  if (kind === 'qr') {
    const code = value.toUpperCase();
    return INTERNAL_CODE.test(code) ? { kind: 'internal', code } : { kind: 'foreign' };
  }
  if ((barcodeKinds as readonly string[]).includes(kind)) {
    const gtin = normalizeGtin(value, kind as BarcodeKind);
    return gtin ? { kind: 'gtin', code: gtin } : { kind: 'invalid' };
  }
  return { kind: 'foreign' };
}

// Código escrito a mano: INV-… o los dígitos de un código de barras.
export function classifyManualEntry(text: string): ScannedCode {
  const value = text.trim().toUpperCase().replace(/\s/g, '');
  if (value.startsWith('INV')) {
    const code = value.startsWith('INV-') ? value : `INV-${value.slice(3)}`;
    return INTERNAL_CODE.test(code) ? { kind: 'internal', code } : { kind: 'invalid' };
  }
  if (!/^\d+$/.test(value)) return { kind: 'invalid' };
  const candidates: BarcodeKind[] =
    value.length === 8 ? ['ean8', 'upc_e'] : value.length === 12 ? ['upc_a'] : value.length === 13 ? ['ean13'] : [];
  for (const kind of candidates) {
    const gtin = normalizeGtin(value, kind);
    if (gtin) return { kind: 'gtin', code: gtin };
  }
  return { kind: 'invalid' };
}
