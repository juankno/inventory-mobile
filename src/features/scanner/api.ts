import { apiRequest } from '@/shared/api/apiClient';
import { hasErrorCode } from '@/shared/api/errors';
import {
  toDeletedProduct,
  toProduct,
  type DeletedProduct,
  type DeletedProductDto,
  type Product,
  type ProductDto,
} from '@/shared/api/types';

// Llamadas a la API de la funcionalidad scanner (RF-09).
// Devuelve null cuando el código no está en el inventario del negocio (404 CODE_NOT_RECOGNIZED).
export async function findProductByCode(code: string): Promise<Product | null> {
  try {
    const dto = await apiRequest<ProductDto>('GET', `/products/code/${encodeURIComponent(code)}`);
    return toProduct(dto);
  } catch (error) {
    if (hasErrorCode(error, 'CODE_NOT_RECOGNIZED')) return null;
    throw error;
  }
}

// Un código que no está en el inventario puede ser de un producto eliminado.
export async function findDeletedProductByCode(code: string): Promise<DeletedProduct | null> {
  const dtos = await apiRequest<DeletedProductDto[]>('GET', `/products/deleted?code=${encodeURIComponent(code)}`);
  return dtos[0] ? toDeletedProduct(dtos[0]) : null;
}
