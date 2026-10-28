import { apiRequest } from '@/shared/api/apiClient';
import { toProduct, type CodeType, type ProductDto, type Unit } from '@/shared/api/types';

// Llamadas a la API de la funcionalidad products (RF-05 a RF-08).
export type CreateProductInput = {
  name: string;
  unit: Unit;
  codeType: CodeType;
  // Solo para GTIN; el identificador interno (INV-…) lo genera el backend (B-05).
  code?: string;
  initialStock: number;
  minStock: number | null;
  salePrice: number | null;
};

export type UpdateProductInput = {
  name: string;
  unit: Unit;
  minStock: number | null;
  salePrice: number | null;
};

// Productos activos del negocio, ordenados por nombre.
export const listProducts = async () => (await apiRequest<ProductDto[]>('GET', '/products')).map(toProduct);

export const getProduct = async (id: string) => toProduct(await apiRequest<ProductDto>('GET', `/products/${id}`));

export const createProduct = async (input: CreateProductInput) =>
  toProduct(await apiRequest<ProductDto>('POST', '/products', input));

export const updateProduct = async (id: string, input: UpdateProductInput) =>
  toProduct(await apiRequest<ProductDto>('PATCH', `/products/${id}`, input));

// Desactiva el producto: sale de la lista y de las alertas, pero conserva su historial (RF-08).
export const deleteProduct = (id: string) => apiRequest<void>('DELETE', `/products/${id}`);
