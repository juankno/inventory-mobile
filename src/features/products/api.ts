import { apiRequest } from '@/shared/api/apiClient';
import { toProduct, type ProductDto, type Unit } from '@/shared/api/types';

// Llamadas a la API de la funcionalidad products (RF-05 a RF-08).
export type CreateProductInput = {
  name: string;
  unit: Unit;
  // Solo para GTIN; sin código, el backend genera el identificador interno INV-… (B-05).
  code?: string;
  stock: number;
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

// Al crear, el backend no acepta null: lo que no se definió no se envía.
export const createProduct = async ({ minStock, salePrice, ...input }: CreateProductInput) =>
  toProduct(
    await apiRequest<ProductDto>('POST', '/products', {
      ...input,
      ...(minStock !== null && { minStock }),
      ...(salePrice !== null && { salePrice }),
    }),
  );

export const updateProduct = async (id: string, input: UpdateProductInput) =>
  toProduct(await apiRequest<ProductDto>('PATCH', `/products/${id}`, input));

// Desactiva el producto: sale de la lista y de las alertas, pero conserva su historial (RF-08).
export const deleteProduct = (id: string) => apiRequest<void>('DELETE', `/products/${id}`);
