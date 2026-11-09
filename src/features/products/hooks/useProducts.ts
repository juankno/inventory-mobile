import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/queryKeys';
import type { Product } from '@/shared/api/types';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listDeletedProducts,
  listProducts,
  restoreProduct,
  updateProduct,
  type UpdateProductInput,
} from '../api';

export function useProducts() {
  return useQuery({ queryKey: queryKeys.products, queryFn: listProducts });
}

// Muestra de inmediato el producto que ya está en la lista y lo actualiza desde la API.
export function useProduct(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => getProduct(id),
    placeholderData: () =>
      queryClient.getQueryData<Product[]>(queryKeys.products)?.find((product) => product.id === id),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: (product) => {
      queryClient.setQueryData(queryKeys.product(product.id), product);
      void queryClient.invalidateQueries({ queryKey: queryKeys.products });
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProductInput) => updateProduct(id, input),
    onSuccess: (product) => {
      queryClient.setQueryData(queryKeys.product(id), product);
      void queryClient.invalidateQueries({ queryKey: queryKeys.products });
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },
  });
}

export function useDeleteProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteProduct(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.product(id), exact: true });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products });
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },
  });
}

export function useDeletedProducts() {
  return useQuery({ queryKey: queryKeys.deletedProducts, queryFn: listDeletedProducts });
}

// Usa el cliente de consultas directamente porque también se llama desde el aviso
// "Deshacer", cuando la pantalla del producto ya se cerró.
export function useRestoreProduct() {
  const queryClient = useQueryClient();
  return async (id: string) => {
    const product = await restoreProduct(id);
    queryClient.setQueryData(queryKeys.product(id), product);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.products }),
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts }),
    ]);
    return product;
  };
}
