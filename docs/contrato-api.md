# Contrato de la API que usa la app

Estos son los endpoints que consume la app móvil, todos bajo `/api/v1`. Se definieron a partir del esquema de Prisma de `inventory-backend`, porque el backend todavía no tiene las rutas montadas. Si el DDS 8.1 dice otra cosa, manda el DDS: hay que ajustar los archivos `src/features/*/api.ts`.

- **Autenticación:** con sesión iniciada, la app envía `Authorization: Bearer <token>`.
- **Errores:** llegan como `{ "code": "…", "message": "…" }`. La app muestra `message` tal cual, así que debe venir en español.
- **Números:** las cantidades y los precios pueden llegar como número o como texto (`Decimal` de Prisma).

## Autenticación

| Método y ruta | Cuerpo | Respuesta |
| --- | --- | --- |
| `POST /auth/register` | `{ businessName, ownerName, email, password, dataPolicyAccepted: true }` | `AuthResponse` |
| `POST /auth/login` | `{ email, password }` | `AuthResponse` |
| `POST /auth/password-reset/request` | `{ email }` | `204` aunque el correo no exista |
| `POST /auth/password-reset/confirm` | `{ email, code, newPassword }` (`code`: 6 dígitos) | `204` |

`AuthResponse` tiene esta forma: `{ token, user: { ownerName, email }, business: { name } }`.

## Productos

| Método y ruta | Cuerpo | Respuesta |
| --- | --- | --- |
| `GET /products` | | `Product[]` activos del negocio |
| `GET /products/:id` | | `Product` |
| `GET /products/lookup?code=…` | | `Product` o `404` con `code: "PRODUCT_NOT_FOUND"` |
| `POST /products` | `{ name, unit, codeType, code?, initialStock, minStock, salePrice }` | `Product` |
| `PATCH /products/:id` | `{ name, unit, minStock, salePrice }` | `Product` |
| `DELETE /products/:id` | | `204`. Desactiva el producto (`isActive = false`) |

Detalles de `POST /products`:

- Con `codeType: "INTERNAL"` la app no envía `code`. El backend lo genera con `Base32IdGenerator` (`INV-` y 10 caracteres).
- El backend registra `initialStock` como el primer movimiento `INBOUND`. El historial lo muestra como "Existencia inicial".
- Si el código ya existe en el negocio, debe responder `409` con un mensaje claro.

Detalles de `DELETE /products/:id` (RF-08):

- El producto desactivado deja de salir en `GET /products`, en `GET /products/lookup` y en `GET /inventory/alerts`.
- `GET /products/:id` y su historial siguen respondiendo, para conservar los movimientos.
- No se le pueden registrar movimientos: responde `404`.
- Su código sigue ocupado por la restricción única. Si se intenta registrar de nuevo, el backend responde `409` y debe explicar que el código es de un producto eliminado.

`Product` tiene estos campos: `{ id, name, unit, salePrice, stock, minStock, codeType, code, createdAt, updatedAt }`.

## Movimientos e inventario

| Método y ruta | Cuerpo | Respuesta |
| --- | --- | --- |
| `GET /products/:id/movements` | | `Movement[]`, del más reciente al más antiguo |
| `POST /movements` | `{ productId, type, reason, quantity, idempotencyKey }` | `Movement` |
| `GET /inventory/alerts` | | `Product[]` con `stock <= minStock` |

Reglas de `POST /movements`:

- **`reason`:** solo va en las salidas (`SALE`, `CONSUMPTION` o `LOSS`). En entradas y ajustes llega `null`.
- **`quantity`:** en una entrada o una salida es lo que suma o resta. En un ajuste es la **existencia contada**, que queda como la nueva existencia del producto.
- **`idempotencyKey`:** es un UUID que se repite en los reintentos. Si ya existe, el backend devuelve el movimiento que ya está registrado.
- **Existencias insuficientes:** si una salida deja la existencia en negativo, el backend responde `409` con `code: "INSUFFICIENT_STOCK"`.

`Movement` tiene estos campos: `{ id, productId, type, reason, quantity, resultingStock, createdAt }`.
