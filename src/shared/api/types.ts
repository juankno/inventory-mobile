// Tipos del contrato de la API /api/v1 (DDS 8.1). Se completan con cada endpoint (RM-03).
export type Unit = 'UNIT' | 'KILOGRAM' | 'GRAM' | 'POUND' | 'LITER';
export type CodeType = 'GTIN' | 'INTERNAL';
export type MovementType = 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT';
export type OutboundReason = 'SALE' | 'CONSUMPTION' | 'LOSS';
