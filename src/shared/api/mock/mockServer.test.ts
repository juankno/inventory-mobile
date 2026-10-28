import { ApiError } from '@/shared/api/errors';
import type { AuthResponse, Movement, Product } from '@/shared/api/types';
import { mockRequest } from './mockServer';

const findByName = async (name: string) =>
  (await mockRequest<Product[]>('GET', '/products')).find((product) => product.name === name)!;

describe('API de demostración', () => {
  it('acepta cualquier correo y contraseña', async () => {
    const response = await mockRequest<AuthResponse>('POST', '/auth/login', {
      email: 'lucia.tienda@correo.com',
      password: 'x',
    });
    expect(response.token).toBeTruthy();
    expect(response.user.ownerName).toBe('Lucia');
  });

  it('carga el inventario de demostración con 4 alertas', async () => {
    expect(await mockRequest<Product[]>('GET', '/products')).toHaveLength(20);
    const alerts = await mockRequest<Product[]>('GET', '/inventory/alerts');
    expect(alerts.map((product) => product.name)).toEqual([
      'Jabón de baño',
      'Panela',
      'Azúcar a granel',
      'Atún en lata',
    ]);
  });

  it('registra una salida y no la repite con la misma clave', async () => {
    const gaseosa = await findByName('Gaseosa 400 ml');
    const body = { productId: gaseosa.id, type: 'OUTBOUND', reason: 'SALE', quantity: 2, idempotencyKey: 'k-1' };
    const first = await mockRequest<Movement>('POST', '/movements', body);
    const again = await mockRequest<Movement>('POST', '/movements', body);
    expect(first.resultingStock).toBe(22);
    expect(again.id).toBe(first.id);
    expect((await findByName('Gaseosa 400 ml')).stock).toBe(22);
  });

  it('rechaza una salida mayor a la existencia', async () => {
    const panela = await findByName('Panela');
    await expect(
      mockRequest('POST', '/movements', {
        productId: panela.id,
        type: 'OUTBOUND',
        reason: 'SALE',
        quantity: 1,
        idempotencyKey: 'k-2',
      }),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' });
  });

  it('crea un producto sin código con un identificador INV-', async () => {
    const product = await mockRequest<Product>('POST', '/products', {
      name: 'Lenteja roja',
      unit: 'KILOGRAM',
      codeType: 'INTERNAL',
      initialStock: 3.5,
      minStock: 1,
      salePrice: null,
    });
    expect(product.code).toMatch(/^INV-[0-9A-HJKMNP-TV-Z]{10}$/);
    const found = await mockRequest<Product>('GET', `/products/lookup?code=${product.code}`);
    expect(found.id).toBe(product.id);
  });

  it('responde PRODUCT_NOT_FOUND con un código desconocido', async () => {
    await expect(mockRequest('GET', '/products/lookup?code=7702354948016')).rejects.toBeInstanceOf(ApiError);
  });
});
