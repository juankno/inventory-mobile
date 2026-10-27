// Validación y normalización de códigos GS1 (RD-03, M-09, DDS 7.4).
// El backend recibe siempre un GTIN de 8 o 13 dígitos.

export function hasValidCheckDigit(code: string): boolean {
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false;
  const digits = code.split('').map(Number);
  const checkDigit = digits.pop()!;
  const sum = digits
    .reverse()
    .reduce((acc, digit, index) => acc + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === checkDigit;
}

// Expande un UPC-E de 8 dígitos (sistema numérico 0 o 1) a UPC-A de 12 dígitos.
export function expandUpcE(upcE: string): string | null {
  if (!/^[01]\d{7}$/.test(upcE)) return null;
  const system = upcE[0];
  const [d1, d2, d3, d4, d5, d6] = upcE.slice(1, 7);
  const check = upcE[7];
  let manufacturer: string;
  let product: string;
  switch (d6) {
    case '0':
    case '1':
    case '2':
      manufacturer = `${d1}${d2}${d6}00`;
      product = `00${d3}${d4}${d5}`;
      break;
    case '3':
      manufacturer = `${d1}${d2}${d3}00`;
      product = `000${d4}${d5}`;
      break;
    case '4':
      manufacturer = `${d1}${d2}${d3}${d4}0`;
      product = `0000${d5}`;
      break;
    default:
      manufacturer = `${d1}${d2}${d3}${d4}${d5}`;
      product = `0000${d6}`;
  }
  return `${system}${manufacturer}${product}${check}`;
}

export type BarcodeKind = 'ean13' | 'ean8' | 'upc_a' | 'upc_e';

// Devuelve el GTIN normalizado (8 o 13 dígitos) o null si el código no es válido.
export function normalizeGtin(code: string, kind: BarcodeKind): string | null {
  let gtin: string | null = code;
  if (kind === 'upc_e') gtin = expandUpcE(code);
  if (gtin && gtin.length === 12) gtin = `0${gtin}`;
  if (!gtin || !hasValidCheckDigit(gtin)) return null;
  return gtin;
}
