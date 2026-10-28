import { apiRequest } from '@/shared/api/apiClient';
import { toProduct, type ProductDto } from '@/shared/api/types';

// Llamadas a la API de la funcionalidad inventory (RF-14, RF-16).
// Productos con existencia igual o menor a su mínimo; los agotados primero.
export const listAlerts = async () => (await apiRequest<ProductDto[]>('GET', '/inventory/alerts')).map(toProduct);
