import { apiRequest } from '@/shared/api/apiClient';
import { hasErrorCode } from '@/shared/api/errors';
import { toDeletedProduct, toProduct, type DeletedProductDto, type ProductDto, type Unit } from '@/shared/api/types';

// Llamadas a la API de la funcionalidad products (RF-05 a RF-08).
export type CreateProductInput = {
  name: string;
  unit: Unit;
  // Solo para GTIN; sin código, el backend genera el identificador interno INV-… (B-05).
  code?: string;
  stock: number;
  minStock: number | null;
  salePrice: number | null;
  costPrice: number | null;
};

export type UpdateProductInput = {
  name: string;
  unit: Unit;
  minStock: number | null;
  salePrice: number | null;
  costPrice: number | null;
};

// Productos activos del negocio, ordenados por nombre.
export const listProducts = async () => (await apiRequest<ProductDto[]>('GET', '/products')).map(toProduct);

export const getProduct = async (id: string) => toProduct(await apiRequest<ProductDto>('GET', `/products/${id}`));

// Al crear, el backend no acepta null: lo que no se definió no se envía.
export const createProduct = async ({ minStock, salePrice, costPrice, ...input }: CreateProductInput) =>
  toProduct(
    await apiRequest<ProductDto>('POST', '/products', {
      ...input,
      ...(minStock !== null && { minStock }),
      ...(salePrice !== null && { salePrice }),
      ...(costPrice !== null && { costPrice }),
    }),
  );

export const updateProduct = async (id: string, input: UpdateProductInput) =>
  toProduct(await apiRequest<ProductDto>('PATCH', `/products/${id}`, input));

// Eliminar es reversible: el producto sale de la lista y de las alertas, pero conserva
// su existencia y su historial, y se puede restaurar (RF-08).
export const deleteProduct = (id: string) => apiRequest<void>('DELETE', `/products/${id}`);

export const restoreProduct = async (id: string) =>
  toProduct(await apiRequest<ProductDto>('POST', `/products/${id}/restore`));

export const listDeletedProducts = async () =>
  (await apiRequest<DeletedProductDto[]>('GET', '/products/deleted')).map(toDeletedProduct);

// Nombre y unidad sugeridos para un código de barras nuevo: los que usan varias
// tiendas o los de una base pública. Nunca trae precio, costo ni existencias de otro
// negocio. Es solo una ayuda: el usuario decide si la usa.
export type ProductSuggestion = {
  name: string;
  unit: Unit;
  // COMMUNITY: lo que usan otras tiendas. Las demás, la base pública que lo conocía:
  // Open Food Facts (alimentos) u Open Beauty Facts (cuidado personal y cosméticos).
  source: 'COMMUNITY' | 'OPEN_FOOD_FACTS' | 'OPEN_BEAUTY_FACTS';
  // Miniatura del frente del producto, solo de Open Food Facts. Ayuda a confirmar que
  // el código es de ese producto; no se guarda en el inventario. Opcional porque un
  // backend anterior no la envía.
  imageUrl?: string | null;
  // La misma foto en 400 px, para verla en pantalla completa.
  imageLargeUrl?: string | null;
};

// Es opcional: si tarda más que esto, no aparece. Debe ser mayor que la espera del
// backend a Open Food Facts (4 s) más su arranque en frío. Esperar no detiene nada: el
// formulario se usa mientras llega, y si ya se escribió un nombre no se muestra.
const SUGGESTION_TIMEOUT_MS = 8_000;

// null si nadie conoce el código (404 SUGGESTION_NOT_FOUND).
export async function getProductSuggestion(code: string): Promise<ProductSuggestion | null> {
  try {
    return await apiRequest<ProductSuggestion>('GET', `/catalog/${encodeURIComponent(code)}`, undefined, {
      timeoutMs: SUGGESTION_TIMEOUT_MS,
    });
  } catch (error) {
    if (hasErrorCode(error, 'SUGGESTION_NOT_FOUND')) return null;
    throw error;
  }
}
