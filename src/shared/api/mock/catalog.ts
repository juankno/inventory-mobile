import { ApiError } from '@/shared/api/errors';
import type { Unit } from '@/shared/api/types';

// Sugerencias de demostración para códigos de barras que no están en el inventario.
// En el backend salen de lo que usan varias tiendas, de Open Food Facts o de Open Beauty Facts.
// La demostración no trae fotos: funciona sin internet.
const demoSuggestions: Record<
  string,
  { name: string; unit: Unit; source: 'COMMUNITY' | 'OPEN_FOOD_FACTS' | 'OPEN_BEAUTY_FACTS'; imageUrl: string | null; imageLargeUrl: string | null }
> = {
  '7702004003508': { name: 'Arroz Diana 500 g', unit: 'UNIT', source: 'COMMUNITY', imageUrl: null, imageLargeUrl: null },
  '7707000000001': { name: 'Chocolatina 30 g', unit: 'UNIT', source: 'OPEN_FOOD_FACTS', imageUrl: null, imageLargeUrl: null },
  '7707368810434': {
    name: 'Shampoo anticaspa Filoclen 250 ml',
    unit: 'UNIT',
    source: 'OPEN_BEAUTY_FACTS',
    imageUrl: null,
    imageLargeUrl: null,
  },
};

// GET /catalog/:code de la API de demostración.
export function demoSuggestion(code: string) {
  const suggestion = demoSuggestions[code];
  if (!suggestion) {
    throw new ApiError(404, 'SUGGESTION_NOT_FOUND', 'No tenemos datos de este código. Escribe el nombre del producto.');
  }
  return suggestion;
}
