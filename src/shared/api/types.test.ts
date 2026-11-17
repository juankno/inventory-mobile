import { toMovement, type MovementDto } from './types';

const dto: MovementDto = {
  id: 'm-1',
  type: 'OUTBOUND',
  reason: 'SALE',
  quantity: '1.5',
  resultingStock: '3',
  createdAt: '2026-11-17T12:00:00Z',
};

describe('toMovement', () => {
  it('convierte el precio y el costo de la venta a números', () => {
    expect(toMovement({ ...dto, unitPrice: '2500.00', unitCost: '1800.50' })).toMatchObject({
      quantity: 1.5,
      unitPrice: 2500,
      unitCost: 1800.5,
    });
  });

  it('deja en null el precio y el costo si no vienen, como en la respuesta de registrar', () => {
    expect(toMovement(dto)).toMatchObject({ unitPrice: null, unitCost: null });
    expect(toMovement({ ...dto, unitPrice: null, unitCost: null })).toMatchObject({ unitPrice: null, unitCost: null });
  });
});
