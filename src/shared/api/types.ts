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
};

export type Movement = {
  id: string;
  type: MovementType;
  reason: OutboundReason | null;
  // Entrada y salida: lo que suma o resta. Ajuste: la diferencia con signo frente
  // a la existencia anterior.
  quantity: number;
  resultingStock: number;
  createdAt: string;
};

// POST /movements. movement es null si un ajuste no cambió la existencia.
export type MovementResult = { movement: Movement | null; stock: number };

// Una página del historial (GET /products/:id/movements?limit&cursor).
// nextCursor es null cuando ya no hay movimientos más antiguos.
export type Page<T> = { items: T[]; nextCursor: string | null };

export type ProductDto = Omit<Product, 'salePrice' | 'stock' | 'minStock'> & {
  salePrice: Decimal | null;
  stock: Decimal;
  minStock: Decimal | null;
};

export type MovementDto = Omit<Movement, 'quantity' | 'resultingStock'> & {
  quantity: Decimal;
  resultingStock: Decimal;
};

export type MovementResultDto = { movement: MovementDto | null; stock: Decimal };

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

export function toMovementResult(dto: MovementResultDto): MovementResult {
  return { movement: dto.movement ? toMovement(dto.movement) : null, stock: toNumber(dto.stock) };
}
