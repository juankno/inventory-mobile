import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/queryKeys';
import type { Product } from '@/shared/api/types';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
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
