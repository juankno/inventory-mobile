// Tipos del contrato de la API /api/v1 (DDS 8.1). Se completan con cada endpoint (RM-03).
// Las cantidades y precios son Decimal en la base de datos y pueden llegar como
// texto en el JSON; los mapeadores de este archivo los convierten a número.
export type Unit = 'UNIT' | 'KILOGRAM' | 'GRAM' | 'POUND' | 'LITER';
export type CodeType = 'GTIN' | 'INTERNAL';
export type MovementType = 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT';
export type OutboundReason = 'SALE' | 'CONSUMPTION' | 'LOSS';

type Decimal = number | string;

// POST /auth/login y POST /auth/register
export type AuthResponse = {
  token: string;
  user: { ownerName: string; email: string };
  business: { name: string };
};

export type Product = {
  id: string;
  name: string;
  unit: Unit;
  salePrice: number | null;
  stock: number;
  minStock: number | null;
  codeType: CodeType;
  code: string;
  createdAt: string;
  updatedAt: string;
};

export type Movement = {
  id: string;
  productId: string;
  type: MovementType;
  reason: OutboundReason | null;
  quantity: number;
  resultingStock: number;
  createdAt: string;
};

export type ProductDto = Omit<Product, 'salePrice' | 'stock' | 'minStock'> & {
  salePrice: Decimal | null;
  stock: Decimal;
  minStock: Decimal | null;
};

export type MovementDto = Omit<Movement, 'quantity' | 'resultingStock'> & {
  quantity: Decimal;
  resultingStock: Decimal;
};

const toNumber = (value: Decimal) => Number(value);
const toNullableNumber = (value: Decimal | null) => (value === null ? null : Number(value));

export function toProduct(dto: ProductDto): Product {
  return {
    ...dto,
    salePrice: toNullableNumber(dto.salePrice),
    stock: toNumber(dto.stock),
    minStock: toNullableNumber(dto.minStock),
  };
}

export function toMovement(dto: MovementDto): Movement {
  return { ...dto, quantity: toNumber(dto.quantity), resultingStock: toNumber(dto.resultingStock) };
}
