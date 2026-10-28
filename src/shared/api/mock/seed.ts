import type { CodeType, Unit } from '@/shared/api/types';

// Inventario de demostración: los mismos 20 productos del seed del backend
// (ERS Apéndice B), con 2 agotados y 2 por agotarse.
export type SeedProduct = {
  name: string;
  codeType: CodeType;
  code: string;
  unit: Unit;
  stock: number;
  minStock: number;
  salePrice: number | null;
};

export const seedProducts: SeedProduct[] = [
  { name: 'Gaseosa 400 ml', codeType: 'GTIN', code: '2000000000015', unit: 'UNIT', stock: 24, minStock: 6, salePrice: 2500 },
  { name: 'Agua en botella 600 ml', codeType: 'GTIN', code: '2000000000022', unit: 'UNIT', stock: 18, minStock: 6, salePrice: 1800 },
  { name: 'Papas fritas 45 g', codeType: 'GTIN', code: '2000000000039', unit: 'UNIT', stock: 15, minStock: 5, salePrice: 2200 },
  { name: 'Galletas paquete', codeType: 'GTIN', code: '2000000000046', unit: 'UNIT', stock: 12, minStock: 4, salePrice: 3000 },
  { name: 'Leche 1 litro', codeType: 'GTIN', code: '2000000000053', unit: 'UNIT', stock: 10, minStock: 4, salePrice: 4200 },
  { name: 'Pasta 500 g', codeType: 'GTIN', code: '2000000000060', unit: 'UNIT', stock: 8, minStock: 3, salePrice: 3500 },
  { name: 'Atún en lata', codeType: 'GTIN', code: '2000000000077', unit: 'UNIT', stock: 3, minStock: 4, salePrice: 6500 },
  { name: 'Aceite 1 litro', codeType: 'GTIN', code: '2000000000084', unit: 'UNIT', stock: 6, minStock: 2, salePrice: 11000 },
  { name: 'Jabón de baño', codeType: 'GTIN', code: '2000000000091', unit: 'UNIT', stock: 0, minStock: 3, salePrice: 3800 },
  { name: 'Café molido 250 g', codeType: 'GTIN', code: '2000000000107', unit: 'UNIT', stock: 5, minStock: 2, salePrice: 9500 },
  { name: 'Arroz a granel', codeType: 'INTERNAL', code: 'INV-JPWM17FPXP', unit: 'KILOGRAM', stock: 25, minStock: 5, salePrice: 4000 },
  { name: 'Fríjol a granel', codeType: 'INTERNAL', code: 'INV-Q719S5WRA1', unit: 'KILOGRAM', stock: 8, minStock: 3, salePrice: 9000 },
  { name: 'Lenteja a granel', codeType: 'INTERNAL', code: 'INV-24APRJY5FB', unit: 'KILOGRAM', stock: 6, minStock: 2, salePrice: 7000 },
  { name: 'Azúcar a granel', codeType: 'INTERNAL', code: 'INV-7Q64VPZD3B', unit: 'KILOGRAM', stock: 2, minStock: 5, salePrice: 4500 },
  { name: 'Huevos', codeType: 'INTERNAL', code: 'INV-8RP1CM2KAM', unit: 'UNIT', stock: 60, minStock: 30, salePrice: 600 },
  { name: 'Pan del día', codeType: 'INTERNAL', code: 'INV-AK0K67147H', unit: 'UNIT', stock: 30, minStock: 10, salePrice: 500 },
  { name: 'Queso campesino', codeType: 'INTERNAL', code: 'INV-63J0DD85FP', unit: 'POUND', stock: 4, minStock: 2, salePrice: 12000 },
  { name: 'Panela', codeType: 'INTERNAL', code: 'INV-E71J7SW978', unit: 'UNIT', stock: 0, minStock: 4, salePrice: 3000 },
  { name: 'Maní reempacado 100 g', codeType: 'INTERNAL', code: 'INV-V8RAXW12VS', unit: 'UNIT', stock: 10, minStock: 3, salePrice: 2000 },
  { name: 'Bolsa de hielo', codeType: 'INTERNAL', code: 'INV-3V2339PTKS', unit: 'UNIT', stock: 12, minStock: 4, salePrice: 2500 },
];
