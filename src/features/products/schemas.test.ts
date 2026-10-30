import { formatPriceInput, parsePrice } from './schemas';

describe('formatPriceInput', () => {
  it('agrega los puntos de miles mientras se escribe', () => {
    expect(formatPriceInput('5')).toBe('5');
    expect(formatPriceInput('2500')).toBe('2.500');
    expect(formatPriceInput('12500')).toBe('12.500');
    expect(formatPriceInput('1250000')).toBe('1.250.000');
  });

  it('reacomoda los puntos al borrar o agregar dígitos', () => {
    expect(formatPriceInput('12.50')).toBe('1.250');
    expect(formatPriceInput('1.2500')).toBe('12.500');
  });

  it('quita letras, símbolos y ceros a la izquierda', () => {
    expect(formatPriceInput('$ 3.0a00')).toBe('3.000');
    expect(formatPriceInput('0007')).toBe('7');
    expect(formatPriceInput('')).toBe('');
  });

  it('se lee de vuelta como número', () => {
    expect(parsePrice(formatPriceInput('12500'))).toBe(12500);
  });
});
