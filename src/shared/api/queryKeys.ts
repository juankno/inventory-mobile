// Claves de TanStack Query compartidas: un movimiento cambia productos y
// alertas, y las funcionalidades no se importan entre sí.
export const queryKeys = {
  products: ['products'] as const,
  product: (id: string) => ['products', id] as const,
  movements: (productId: string) => ['movements', productId] as const,
  alerts: ['inventory', 'alerts'] as const,
};
