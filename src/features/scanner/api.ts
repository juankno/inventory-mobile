import { apiRequest } from '@/shared/api/apiClient';
import { hasErrorCode } from '@/shared/api/errors';
import { toProduct, type Product, type ProductDto } from '@/shared/api/types';

// Llamadas a la API de la funcionalidad scanner (RF-09).
// Devuelve null cuando el código no está en el inventario del negocio (404 PRODUCT_NOT_FOUND).
export async function findProductByCode(code: string): Promise<Product | null> {
  try {
    const dto = await apiRequest<ProductDto>('GET', `/products/lookup?code=${encodeURIComponent(code)}`);
    return toProduct(dto);
  } catch (error) {
    if (hasErrorCode(error, 'PRODUCT_NOT_FOUND')) return null;
    throw error;
  }
}
