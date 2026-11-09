import { ApiError } from '@/shared/api/errors';
import type { AuthResponse, DeletedProduct, Movement, MovementResult, Page, Product } from '@/shared/api/types';
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
    expect(response.user.ownerName).toBe('Comerciante de prueba');
  });

  it('saluda con el nombre de quien se registró, no con su correo', async () => {
    await mockRequest('POST', '/auth/register', {
      businessName: 'Tienda La Esquina',
      ownerName: 'Lucía Gómez',
      email: 'juanes0202@correo.com',
      password: '12345678',
      passwordConfirmation: '12345678',
      acceptDataPolicy: true,
    });
    const response = await mockRequest<AuthResponse>('POST', '/auth/login', {
      email: 'Juanes0202@correo.com',
      password: 'x',
    });
    expect(response.user.ownerName).toBe('Lucía Gómez');
    expect(response.business.name).toBe('Tienda La Esquina');
  });

  it('carga el inventario de demostración con 4 alertas', async () => {
    expect(await mockRequest<Product[]>('GET', '/products')).toHaveLength(20);
    const alerts = await mockRequest<Product[]>('GET', '/products/low-stock');
    expect(alerts.map((product) => product.name)).toEqual([
      'Jabón de baño',
      'Panela',
      'Atún en lata',
      'Azúcar a granel',
    ]);
  });

  it('registra una salida y no la repite con la misma clave', async () => {
    const gaseosa = await findByName('Gaseosa 400 ml');
    const body = { productId: gaseosa.id, type: 'OUTBOUND', reason: 'SALE', quantity: 2, idempotencyKey: 'k-1' };
    const first = await mockRequest<MovementResult>('POST', '/movements', body);
    const again = await mockRequest<MovementResult>('POST', '/movements', body);
    expect(first.stock).toBe(22);
    expect(again.movement?.id).toBe(first.movement?.id);
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
      stock: 3.5,
      minStock: 1,
    });
    expect(product.codeType).toBe('INTERNAL');
    expect(product.salePrice).toBeNull();
    expect(product.code).toMatch(/^INV-[0-9A-HJKMNP-TV-Z]{10}$/);
    const found = await mockRequest<Product>('GET', `/products/code/${product.code}`);
    expect(found.id).toBe(product.id);
  });

  it('elimina un producto: ya no se consulta y su código sigue ocupado', async () => {
    const pan = await findByName('Pan del día');
    await mockRequest('DELETE', `/products/${pan.id}`);
    expect(await findByName('Pan del día')).toBeUndefined();
    await expect(mockRequest('GET', `/products/code/${pan.code}`)).rejects.toMatchObject({
      code: 'CODE_NOT_RECOGNIZED',
    });
    await expect(mockRequest('GET', `/products/${pan.id}`)).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND' });
    await expect(
      mockRequest('POST', '/products', { name: 'Pan', unit: 'UNIT', stock: 1, code: pan.code }),
    ).rejects.toMatchObject({ code: 'CODE_OF_DELETED_PRODUCT' });
  });

  it('restaura un producto eliminado con su existencia y su historial', async () => {
    const huevos = await findByName('Huevos');
    await mockRequest('DELETE', `/products/${huevos.id}`);

    const deleted = await mockRequest<DeletedProduct[]>('GET', `/products/deleted?code=${huevos.code}`);
    expect(deleted).toHaveLength(1);
    expect(deleted[0].deletedAt).toBeTruthy();

    const restored = await mockRequest<Product>('POST', `/products/${huevos.id}/restore`);
    expect(restored.stock).toBe(huevos.stock);
    expect((await findByName('Huevos')).id).toBe(huevos.id);
    expect(await mockRequest('GET', `/products/deleted?code=${huevos.code}`)).toEqual([]);
    const history = await mockRequest<Page<Movement>>('GET', `/products/${huevos.id}/movements`);
    expect(history.items).toHaveLength(1);
  });

  it('responde CODE_NOT_RECOGNIZED con un código desconocido', async () => {
    await expect(mockRequest('GET', '/products/code/7702354948016')).rejects.toBeInstanceOf(ApiError);
    await expect(mockRequest('GET', '/products/code/7702354948016')).rejects.toMatchObject({
      code: 'CODE_NOT_RECOGNIZED',
    });
  });

  it('entrega el historial por páginas, del más reciente al más antiguo', async () => {
    const gaseosa = await findByName('Gaseosa 400 ml');
    const path = `/products/${gaseosa.id}/movements`;
    const first = await mockRequest<Page<Movement>>('GET', `${path}?limit=20`);
    expect(first.items).toHaveLength(20);
    expect(first.nextCursor).toBe(first.items[19].id);

    const all = [...first.items];
    let cursor = first.nextCursor;
    while (cursor) {
      const page = await mockRequest<Page<Movement>>('GET', `${path}?limit=20&cursor=${cursor}`);
      all.push(...page.items);
      cursor = page.nextCursor;
    }
    expect(new Set(all.map((movement) => movement.id)).size).toBe(all.length);
    expect(all[0].resultingStock).toBe(gaseosa.stock);
  });

  it('guarda el ajuste como una diferencia con signo', async () => {
    const leche = await findByName('Leche 1 litro');
    const { movement, stock } = await mockRequest<MovementResult>('POST', '/movements', {
      productId: leche.id,
      type: 'ADJUSTMENT',
      quantity: leche.stock - 3,
      idempotencyKey: 'ajuste-leche',
    });
    expect(movement?.quantity).toBe(-3);
    expect(stock).toBe(leche.stock - 3);
  });

  it('no registra un ajuste que no cambia la existencia', async () => {
    const pasta = await findByName('Pasta 500 g');
    const result = await mockRequest<MovementResult>('POST', '/movements', {
      productId: pasta.id,
      type: 'ADJUSTMENT',
      quantity: pasta.stock,
      idempotencyKey: 'ajuste-pasta',
    });
    expect(result).toEqual({ movement: null, stock: pasta.stock });
  });
});
