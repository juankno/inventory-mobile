// Claves de TanStack Query compartidas: un movimiento cambia productos y
// alertas, y las funcionalidades no se importan entre sí.
export const queryKeys = {
  products: ['products'] as const,
  product: (id: string) => ['products', id] as const,
  // Invalidar movements(id) refresca el resumen del detalle y el historial completo.
  movements: (productId: string) => ['movements', productId] as const,
  recentMovements: (productId: string) => ['movements', productId, 'recent'] as const,
  movementHistory: (productId: string) => ['movements', productId, 'all'] as const,
  alerts: ['inventory', 'alerts'] as const,
};
