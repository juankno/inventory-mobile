
import { ApiError } from '@/shared/api/errors';
import type { AuthResponse, Movement, MovementType, OutboundReason, Product, Unit } from '@/shared/api/types';
import { seedProducts } from './seed';

// API simulada en memoria para usar la app sin backend (modo demostración).
// Responde a los mismos endpoints del backend (api/openapi.yaml) con los mismos
// códigos de error, así las pantallas no saben si hablan con el backend real.
// Los datos se reinician cada vez que se recarga la app.

const LATENCY_MS = 350;
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
// Tamaño de página del historial si no llega ?limit, y el máximo permitido.
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const products = new Map<string, Product>();
type StoredMovement = Movement & { productId: string };

const movements: StoredMovement[] = [];
const idempotencyKeys = new Map<string, Movement>();
// Productos eliminados y su fecha: no se borran, para poder restaurarlos (RF-08).
const inactive = new Map<string, string>();
const activeProducts = () => [...products.values()].filter((product) => !inactive.has(product.id));

let lastId = 0;
const newId = () => `mock-${++lastId}`;

// Producto con historial largo, para ver la paginación en el modo demostración.
const BUSY_PRODUCT = 'Gaseosa 400 ml';

// Una semana en la que cada mañana se surte lo que se vende en el día, así la
// existencia termina en la del seed.
function busyHistory(productId: string, finalStock: number, start: number): Omit<StoredMovement, 'id'>[] {
  const history: Omit<StoredMovement, 'id'>[] = [];
  let stock = 0;
  const add = (type: 'INBOUND' | 'OUTBOUND', quantity: number, at: number) => {
    stock += type === 'INBOUND' ? quantity : -quantity;
    history.push({
      productId,
      type,
      reason: type === 'OUTBOUND' ? 'SALE' : null,
      quantity,
      resultingStock: stock,
      createdAt: new Date(at).toISOString(),
    });
  };
  add('INBOUND', finalStock, start);
  for (let day = 1; day <= 7; day++) {
    const morning = start + day * DAY_MS + 8 * HOUR_MS;
    add('INBOUND', 12, morning);
    for (let sale = 1; sale <= 6; sale++) add('OUTBOUND', 2, morning + sale * HOUR_MS);
  }
  return history;
}

function seed() {
  const start = Date.now() - 9 * DAY_MS;
  const created = new Date(start).toISOString();
  for (const item of seedProducts) {
    const id = newId();
    products.set(id, { id, ...item });
    const history =
      item.name === BUSY_PRODUCT
        ? busyHistory(id, item.stock, start)
        : item.stock > 0
          ? [
              {
                productId: id,
                type: 'INBOUND' as const,
                reason: null,
                quantity: item.stock,
                resultingStock: item.stock,
                createdAt: created,
              },
            ]
          : [];
    for (const movement of history) movements.push({ id: newId(), ...movement });
  }
}
seed();

const notFound = () => new ApiError(404, 'PRODUCT_NOT_FOUND', 'Este producto no está en tu inventario.');

// Un producto eliminado ya no se puede consultar, aunque conserve su historial (RF-08).
function getProductOrThrow(id: string): Product {
  const product = products.get(id);
  if (!product || inactive.has(id)) throw notFound();
  return product;
}

function generateInternalCode(): string {
  let code = 'INV-';
  for (let i = 0; i < 10; i++) code += CROCKFORD[Math.floor(Math.random() * CROCKFORD.length)];
  return code;
}

// Cuenta de demostración del backend (prisma/seed.ts) para quien ingresa sin registrarse.
const DEMO_OWNER = 'Comerciante de prueba';
const DEMO_BUSINESS = 'Tienda de demostración';

// Cuentas creadas con "Crear cuenta", para saludar con el nombre que se escribió.
const accounts = new Map<string, { ownerName: string; businessName: string }>();

function authResponse(ownerName: string, email: string, businessName: string): AuthResponse {
  return { token: `mock-${newId()}`, user: { ownerName, email }, business: { name: businessName } };
}

function checkWholeUnits(unit: Unit, value: number) {
  if (unit === 'UNIT' && !Number.isInteger(value)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Los productos por unidad solo admiten números enteros.');
  }
}

type Body = Record<string, unknown>;

function handle(method: Method, path: string, body: Body): unknown {
  const [pathname, search = ''] = path.split('?');
  const query = new URLSearchParams(search);
  const route = `${method} ${pathname}`;
  let match: RegExpMatchArray | null;

  // Autenticación: cualquier correo y contraseña sirven.
  if (route === 'POST /auth/login') {
    const email = String(body.email).toLowerCase();
    const account = accounts.get(email);
    return authResponse(account?.ownerName ?? DEMO_OWNER, email, account?.businessName ?? DEMO_BUSINESS);
  }
  if (route === 'POST /auth/register') {
    // Igual que el backend: la confirmación debe coincidir y la política, aceptada.
    if (body.password !== body.passwordConfirmation || body.acceptDataPolicy !== true) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Los datos enviados no son válidos.');
    }
    const email = String(body.email).toLowerCase();
    const account = { ownerName: String(body.ownerName), businessName: String(body.businessName) };
    accounts.set(email, account);
    return authResponse(account.ownerName, email, account.businessName);
  }
  if (route === 'POST /auth/password-reset/request' || route === 'POST /auth/password-reset/confirm') {
    return undefined;
  }

  if (route === 'GET /products') {
    return activeProducts().sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  if ((match = pathname.match(/^\/products\/code\/([^/]+)$/)) && method === 'GET') {
    const code = decodeURIComponent(match[1]);
    const product = activeProducts().find((item) => item.code === code);
    if (!product) {
      throw new ApiError(404, 'CODE_NOT_RECOGNIZED', 'Este código no corresponde a un producto de tu inventario.');
    }
    return product;
  }

  if (route === 'GET /products/deleted') {
    const code = query.get('code');
    return [...inactive.entries()]
      .map(([id, deletedAt]) => ({ ...products.get(id)!, deletedAt }))
      .filter((product) => !code || product.code === code)
      .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
  }

  if ((match = pathname.match(/^\/products\/([^/]+)\/restore$/)) && method === 'POST') {
    const product = products.get(match[1]);
    if (!product) throw notFound();
    inactive.delete(product.id);
    return product;
  }

  if (route === 'GET /products/low-stock') {
    return activeProducts()
      .filter((product) => product.stock === 0 || (product.minStock !== null && product.stock <= product.minStock))
      .sort((a, b) => Number(b.stock === 0) - Number(a.stock === 0) || a.name.localeCompare(b.name, 'es'));
  }

  if (route === 'POST /products') {
    const codeType: Product['codeType'] = body.code === undefined ? 'INTERNAL' : 'GTIN';
    const code = codeType === 'GTIN' ? String(body.code) : generateInternalCode();
    const existing = [...products.values()].find((item) => item.code === code);
    if (existing) {
      throw inactive.has(existing.id)
        ? new ApiError(
            409,
            'CODE_OF_DELETED_PRODUCT',
            'Este código es de un producto que eliminaste. Puedes restaurarlo desde Productos eliminados.',
          )
        : new ApiError(409, 'CODE_ALREADY_REGISTERED', 'Ya existe un producto con este código en tu negocio.');
    }
    const unit = body.unit as Unit;
    const stock = Number(body.stock);
    checkWholeUnits(unit, stock);
    const product: Product = {
      id: newId(),
      name: String(body.name),
      unit,
      salePrice: (body.salePrice as number | undefined) ?? null,
      stock,
      minStock: (body.minStock as number | undefined) ?? null,
      codeType,
      code,
    };
    products.set(product.id, product);
    if (stock > 0) {
      movements.push({
        id: newId(),
        productId: product.id,
        type: 'INBOUND',
        reason: null,
        quantity: stock,
        resultingStock: stock,
        createdAt: new Date().toISOString(),
      });
    }
    return product;
  }

  if ((match = pathname.match(/^\/products\/([^/]+)\/movements$/)) && method === 'GET') {
    getProductOrThrow(match[1]);
    // Se guardan en orden de registro: al revés quedan del más reciente al más antiguo.
    const history = movements.filter((movement) => movement.productId === match![1]).reverse();
    const limit = Math.min(Math.max(Number(query.get('limit')) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
    // El cursor es el id del último movimiento de la página anterior.
    const cursor = query.get('cursor');
    const start = cursor ? history.findIndex((movement) => movement.id === cursor) + 1 : 0;
    if (cursor && start === 0) return { items: [], nextCursor: null };
    const items = history.slice(start, start + limit);
    const hasMore = start + limit < history.length;
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  if ((match = pathname.match(/^\/products\/([^/]+)$/))) {
    const product = getProductOrThrow(match[1]);
    if (method === 'GET') return product;
    if (method === 'PATCH') {
      const unit = body.unit as Unit;
      checkWholeUnits(unit, product.stock);
      const updated: Product = {
        ...product,
        name: String(body.name),
        unit,
        minStock: body.minStock as number | null,
        salePrice: body.salePrice as number | null,
      };
      products.set(updated.id, updated);
      return updated;
    }
    if (method === 'DELETE') {
      inactive.set(product.id, new Date().toISOString());
      return undefined;
    }
  }

  if (route === 'POST /movements') {
    const key = String(body.idempotencyKey);
    const repeated = idempotencyKeys.get(key);
    if (repeated) return { movement: repeated, stock: repeated.resultingStock };

    const product = getProductOrThrow(String(body.productId));
    const type = body.type as MovementType;
    const quantity = Number(body.quantity);
    checkWholeUnits(product.unit, quantity);
    const resultingStock =
      type === 'INBOUND' ? product.stock + quantity : type === 'OUTBOUND' ? product.stock - quantity : quantity;
    if (resultingStock < 0) {
      throw new ApiError(
        409,
        'INSUFFICIENT_STOCK',
        'No hay existencias suficientes para esta salida. Revisa la cantidad o haz un ajuste.',
      );
    }
    // En un ajuste se guarda la diferencia con signo; si no hay diferencia, no se registra nada.
    const change = type === 'ADJUSTMENT' ? resultingStock - product.stock : quantity;
    if (change === 0) return { movement: null, stock: product.stock };
    const movement: StoredMovement = {
      id: newId(),
      productId: product.id,
      type,
      reason: type === 'OUTBOUND' ? (body.reason as OutboundReason) : null,
      quantity: change,
      resultingStock,
      createdAt: new Date().toISOString(),
    };
    movements.push(movement);
    idempotencyKeys.set(key, movement);
    products.set(product.id, { ...product, stock: resultingStock });
    return { movement, stock: resultingStock };
  }

  throw new ApiError(404, 'NOT_FOUND', `La API de demostración no conoce ${route}.`);
}

export async function mockRequest<T>(method: Method, path: string, body?: unknown): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
  // Copia para que las pantallas no modifiquen los datos en memoria.
  const result = handle(method, path, (body ?? {}) as Body);
  return (result === undefined ? undefined : JSON.parse(JSON.stringify(result))) as T;
}
