import { expandUpcE, hasValidCheckDigit, normalizeGtin } from './gtin';

describe('hasValidCheckDigit', () => {
  it('acepta EAN-13 y EAN-8 válidos', () => {
    expect(hasValidCheckDigit('7702004003508')).toBe(true);
    expect(hasValidCheckDigit('96385074')).toBe(true);
  });

  it('rechaza un dígito de control incorrecto', () => {
    expect(hasValidCheckDigit('7702004003509')).toBe(false);
  });

  it('rechaza longitudes no válidas', () => {
    expect(hasValidCheckDigit('12345')).toBe(false);
  });
});

describe('expandUpcE', () => {
  it('expande UPC-E a UPC-A', () => {
    expect(expandUpcE('01234565')).toBe('012345000065');
  });
});

describe('normalizeGtin', () => {
  it('completa UPC-A a 13 dígitos', () => {
    expect(normalizeGtin('036000291452', 'upc_a')).toBe('0036000291452');
  });

  it('expande y completa UPC-E', () => {
    expect(normalizeGtin('01234565', 'upc_e')).toBe('0012345000065');
  });

  it('devuelve null para un código inválido', () => {
    expect(normalizeGtin('7702004003509', 'ean13')).toBeNull();
  });
});
