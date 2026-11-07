import { isRealRoute } from './apiClient';

describe('rutas que van al backend real en modo demostración', () => {
  const routes = ['/auth/login', '/auth/register', '/products'];

  it('usa el backend en las rutas configuradas y en sus subrutas', () => {
    expect(isRealRoute('/auth/login', routes)).toBe(true);
    expect(isRealRoute('/products/abc/movements?limit=5', routes)).toBe(true);
    expect(isRealRoute('/products?active=true', routes)).toBe(true);
  });

  it('simula las demás rutas', () => {
    expect(isRealRoute('/auth/password-reset/request', routes)).toBe(false);
    expect(isRealRoute('/movements', routes)).toBe(false);
    expect(isRealRoute('/productsX', routes)).toBe(false);
  });

  it('simula todo si no hay rutas configuradas', () => {
    expect(isRealRoute('/auth/login', [])).toBe(false);
  });
});
