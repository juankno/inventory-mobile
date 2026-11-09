import type { Product } from '@/shared/api/types';
import { buildShoppingList } from './shoppingList';

const product = (overrides: Partial<Product>): Product => ({
  id: '1',
  name: 'Arroz',
  unit: 'UNIT',
  salePrice: 2500,
  stock: 0,
  minStock: 4,
  codeType: 'INTERNAL',
  code: 'INV-1',
  ...overrides,
});

const date = new Date(2026, 10, 9);

describe('buildShoppingList', () => {
  it('separa agotados y por agotarse, con lo que queda y el mínimo', () => {
    const list = buildShoppingList({
      businessName: 'Tienda Rosa',
      outOfStock: [product({ name: 'Panela' })],
      lowStock: [product({ name: 'Azúcar', unit: 'KILOGRAM', stock: 2.5, minStock: 5 })],
      date,
    });

    expect(list).toBe(
      [
        '*Lista de compras · Tienda Rosa*',
        '9 de noviembre',
        '',
        '*Agotados (1)*',
        '• Panela · mínimo 4 und.',
        '',
        '*Por agotarse (1)*',
        '• Azúcar: quedan 2,5 kg · mínimo 5 kg',
      ].join('\n'),
    );
  });

  it('omite las secciones vacías', () => {
    const list = buildShoppingList({ outOfStock: [product({})], lowStock: [], date });

    expect(list).toContain('Agotados');
    expect(list).not.toContain('Por agotarse');
  });

  it('funciona sin nombre del negocio y sin mínimo', () => {
    const list = buildShoppingList({ outOfStock: [product({ minStock: null })], lowStock: [], date });

    expect(list.split('\n')[0]).toBe('*Lista de compras*');
    expect(list).toContain('• Arroz');
    expect(list).not.toContain('mínimo');
  });
});
