import { apiRequest } from '@/shared/api/apiClient';
import { toProduct, type ProductDto } from '@/shared/api/types';

// Llamadas a la API de la funcionalidad inventory (RF-14, RF-16).
// Productos agotados o en su mínimo o por debajo; los agotados primero.
export const listAlerts = async () => (await apiRequest<ProductDto[]>('GET', '/products/low-stock')).map(toProduct);
