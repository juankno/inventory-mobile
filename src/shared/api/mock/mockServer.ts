
import { ApiError } from '@/shared/api/errors';
import type { AuthResponse, Movement, MovementType, OutboundReason, Product, Unit } from '@/shared/api/types';
import { seedProducts } from './seed';

// API simulada en memoria para usar la app sin backend (modo demostración).
// Responde a los mismos endpoints de docs/contrato-api.md con los mismos
// códigos de error, así las pantallas no saben si hablan con el backend real.
// Los datos se reinician cada vez que se recarga la app.

const LATENCY_MS = 350;
const DAY_MS = 86_400_000;
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const products = new Map<string, Product>();
const movements: Movement[] = [];
const idempotencyKeys = new Map<string, Movement>();

let lastId = 0;
const newId = () => `mock-${++lastId}`;

function seed() {
  const created = new Date(Date.now() - 7 * DAY_MS).toISOString();
  for (const item of seedProducts) {
    const id = newId();
    products.set(id, { id, ...item, createdAt: created, updatedAt: created });
    movements.push({
      id: newId(),
      productId: id,
      type: 'INBOUND',
      reason: null,
      quantity: item.stock,
      resultingStock: item.stock,
      createdAt: created,
    });
  }
}
seed();

const notFound = () => new ApiError(404, 'PRODUCT_NOT_FOUND', 'No encontramos este producto.');

function getProductOrThrow(id: string): Product {
  const product = products.get(id);
  if (!product) throw notFound();
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
    const email = String(body.email).toLowerCase();
    const account = { ownerName: String(body.ownerName), businessName: String(body.businessName) };
    accounts.set(email, account);
    return authResponse(account.ownerName, email, account.businessName);
  }
  if (route === 'POST /auth/password-reset/request' || route === 'POST /auth/password-reset/confirm') {
    return undefined;
  }

  if (route === 'GET /products') {
    return [...products.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  if (route === 'GET /products/lookup') {
    const code = query.get('code') ?? '';
    const product = [...products.values()].find((item) => item.code === code);
    if (!product) throw notFound();
    return product;
  }

  if (route === 'POST /products') {
    const codeType = body.codeType as Product['codeType'];
    const code = codeType === 'GTIN' ? String(body.code) : generateInternalCode();
    if ([...products.values()].some((item) => item.code === code)) {
      throw new ApiError(409, 'DUPLICATE_CODE', 'Ya tienes un producto con este código.');
    }
    const unit = body.unit as Unit;
    const initialStock = Number(body.initialStock);
    checkWholeUnits(unit, initialStock);
    const now = new Date().toISOString();
    const product: Product = {
      id: newId(),
      name: String(body.name),
      unit,
      salePrice: body.salePrice as number | null,
      stock: initialStock,
      minStock: body.minStock as number | null,
      codeType,
      code,
      createdAt: now,
      updatedAt: now,
    };
    products.set(product.id, product);
    movements.push({
      id: newId(),
      productId: product.id,
      type: 'INBOUND',
      reason: null,
      quantity: initialStock,
      resultingStock: initialStock,
      createdAt: now,
    });
    return product;
  }

  if ((match = pathname.match(/^\/products\/([^/]+)\/movements$/)) && method === 'GET') {
    getProductOrThrow(match[1]);
    return movements
      .filter((movement) => movement.productId === match![1])
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
        updatedAt: new Date().toISOString(),
      };
      products.set(updated.id, updated);
      return updated;
    }
  }

  if (route === 'POST /movements') {
    const key = String(body.idempotencyKey);
    const repeated = idempotencyKeys.get(key);
    if (repeated) return repeated;

    const product = getProductOrThrow(String(body.productId));
    const type = body.type as MovementType;
    const quantity = Number(body.quantity);
    checkWholeUnits(product.unit, quantity);
    const resultingStock =
      type === 'INBOUND' ? product.stock + quantity : type === 'OUTBOUND' ? product.stock - quantity : quantity;
    if (resultingStock < 0) {
      throw new ApiError(409, 'INSUFFICIENT_STOCK', 'No hay suficientes existencias para esta salida.');
    }
    const now = new Date().toISOString();
    const movement: Movement = {
      id: newId(),
      productId: product.id,
      type,
      reason: type === 'OUTBOUND' ? (body.reason as OutboundReason) : null,
      quantity,
      resultingStock,
      createdAt: now,
    };
    movements.push(movement);
    idempotencyKeys.set(key, movement);
    products.set(product.id, { ...product, stock: resultingStock, updatedAt: now });
    return movement;
  }

  if (route === 'GET /inventory/alerts') {
    return [...products.values()]
      .filter((product) => product.minStock !== null && product.stock <= product.minStock)
      .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name, 'es'));
  }

  throw new ApiError(404, 'NOT_FOUND', `La API de demostración no conoce ${route}.`);
}

export async function mockRequest<T>(method: Method, path: string, body?: unknown): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
  // Copia para que las pantallas no modifiquen los datos en memoria.
  const result = handle(method, path, (body ?? {}) as Body);
  return (result === undefined ? undefined : JSON.parse(JSON.stringify(result))) as T;
}
