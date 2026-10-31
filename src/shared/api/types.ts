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
  // Existencia antes y después del movimiento: cada fila del historial muestra
  // su diferencia sin depender de las demás páginas.
  previousStock: number;
  resultingStock: number;
  createdAt: string;
};

// Una página del historial (GET /products/:id/movements?limit&cursor).
// nextCursor es null cuando ya no hay movimientos más antiguos.
export type Page<T> = { items: T[]; nextCursor: string | null };

export type ProductDto = Omit<Product, 'salePrice' | 'stock' | 'minStock'> & {
  salePrice: Decimal | null;
  stock: Decimal;
  minStock: Decimal | null;
};

export type MovementDto = Omit<Movement, 'quantity' | 'previousStock' | 'resultingStock'> & {
  quantity: Decimal;
  previousStock: Decimal;
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
  return {
    ...dto,
    quantity: toNumber(dto.quantity),
    previousStock: toNumber(dto.previousStock),
    resultingStock: toNumber(dto.resultingStock),
  };
}
