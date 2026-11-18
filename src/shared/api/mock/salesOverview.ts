import type { Movement, Product, Unit } from '@/shared/api/types';

// Resumen por período de la API de demostración (GET /reports/overview), con el mismo
// cálculo que el backend.

const DAY_MS = 86_400_000;

// Un movimiento como lo guarda la API de demostración.
export type StoredMovement = Movement & {
  productId: string;
  revertsMovementId: string | null;
};

// Fechas AAAA-MM-DD en la hora del celular, para el resumen por período.
const pad = (value: number) => String(value).padStart(2, '0');
const dayKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const dayStart = (day: string) => {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
};
const shiftDay = (day: string, days: number) => {
  const date = dayStart(day);
  return dayKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
};

type Granularity = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';

// El grupo de un día: el mismo día, su lunes o su día 1, sin ir antes de `from`.
function dayBucket(day: string, granularity: Exclude<Granularity, 'HOUR'>, from: string) {
  const date = dayStart(day);
  const start =
    granularity === 'DAY'
      ? day
      : granularity === 'WEEK'
        ? shiftDay(day, -((date.getDay() + 6) % 7))
        : `${day.slice(0, 7)}-01`;
  return start < from ? from : start;
}

// Mismo cálculo que el backend (GET /reports/overview): solo ventas que no se
// deshicieron, con el precio y el costo guardados en cada una.
export function salesOverview(
  query: URLSearchParams,
  { movements, products, activeProducts }: { movements: StoredMovement[]; products: Map<string, Product>; activeProducts: Product[] },
) {
  const from = query.get('from') ?? dayKey(new Date());
  const to = query.get('to') ?? from;
  const days = Math.round((dayStart(to).getTime() - dayStart(from).getTime()) / DAY_MS) + 1;
  const compareFrom = query.get('compareFrom');
  const compareTo = query.get('compareTo');
  const previousRange =
    compareFrom && compareTo ? { from: compareFrom, to: compareTo } : { from: shiftDay(from, -days), to: shiftDay(from, -1) };

  const reverted = new Set(movements.map((movement) => movement.revertsMovementId));
  const salesIn = (start: string, end: string) => {
    const startMs = dayStart(start).getTime();
    const endMs = dayStart(shiftDay(end, 1)).getTime();
    return movements.filter((movement) => {
      const at = Date.parse(movement.createdAt);
      return movement.reason === 'SALE' && !reverted.has(movement.id) && at >= startMs && at < endMs;
    });
  };
  const value = (sale: StoredMovement) => sale.quantity * (sale.unitPrice ?? 0);
  const profit = (sale: StoredMovement) =>
    sale.unitPrice === null || sale.unitCost === null ? 0 : sale.quantity * (sale.unitPrice - sale.unitCost);
  const period = (items: StoredMovement[]) => ({
    sales: items.length,
    total: items.reduce((sum, sale) => sum + value(sale), 0),
    profit: items.reduce((sum, sale) => sum + profit(sale), 0),
  });

  const sales = salesIn(from, to);
  const granularity: Granularity = days === 1 ? 'HOUR' : days <= 31 ? 'DAY' : days <= 92 ? 'WEEK' : 'MONTH';
  const groups = new Map<string, StoredMovement[]>();
  if (granularity === 'HOUR') {
    for (let hour = 0; hour < 24; hour++) groups.set(`${from}T${pad(hour)}`, []);
  } else {
    for (let day = from; day <= to; day = shiftDay(day, 1)) groups.set(dayBucket(day, granularity, from), []);
  }
  for (const sale of sales) {
    const date = new Date(sale.createdAt);
    const key =
      granularity === 'HOUR' ? `${dayKey(date)}T${pad(date.getHours())}` : dayBucket(dayKey(date), granularity, from);
    groups.get(key)?.push(sale);
  }

  const top = new Map<string, { name: string; unit: Unit; quantity: number; total: number }>();
  for (const sale of sales) {
    const product = products.get(sale.productId);
    if (!product) continue;
    const item = top.get(product.id) ?? { name: product.name, unit: product.unit, quantity: 0, total: 0 };
    item.quantity += sale.quantity;
    item.total += value(sale);
    top.set(product.id, item);
  }

  const active = activeProducts;
  return {
    from,
    to,
    current: period(sales),
    previous: { ...previousRange, ...period(salesIn(previousRange.from, previousRange.to)) },
    granularity,
    series: [...groups].map(([start, items]) => ({ start, ...period(items) })),
    topProducts: [...top.values()].sort((a, b) => b.total - a.total || b.quantity - a.quantity).slice(0, 5),
    salesWithoutPrice: sales.filter((sale) => sale.unitPrice === null).length,
    salesWithoutCost: sales.filter((sale) => sale.unitCost === null).length,
    inventory: {
      products: active.length,
      lowStock: active.filter((item) => item.stock > 0 && item.minStock !== null && item.stock <= item.minStock).length,
      outOfStock: active.filter((item) => item.stock === 0).length,
    },
  };
}
