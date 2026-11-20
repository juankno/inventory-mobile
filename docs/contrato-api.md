# Contrato de la API que usa la app

Estos son los endpoints que consume la app móvil, todos bajo `/api/v1`, en `https://surtido-api.vercel.app/api/v1`. La referencia completa del backend está en `inventory-backend/api/openapi.yaml` y en `/api/v1/docs`; si algo cambia allá, hay que ajustar los archivos `src/features/*/api.ts` y la API simulada de `src/shared/api/mock/`.

- **Autenticación:** con sesión iniciada, la app envía `Authorization: Bearer <token>`.
- **Errores:** llegan como `{ "code": "…", "message": "…" }`. La app muestra `message` tal cual, así que debe venir en español.
- **Números:** las cantidades y los precios pueden llegar como número o como texto (`Decimal` de Prisma).

## Reportes

| Método y ruta | Respuesta |
| --- | --- |
| `GET /reports/overview?from=…&to=…[&compareFrom=…&compareTo=…]` | `SalesOverview`: el resumen del período que muestra la pantalla de reportes |
| `GET /reports/summary` | `{ today, week, topProducts, salesWithoutPrice, salesWithoutCost }`, en hora de Colombia; la semana empieza el lunes. La app ya no lo usa; se mantiene para versiones anteriores |
| `GET /reports/inventory` | Archivo de Excel |
| `GET /reports/movements?from=AAAA-MM-DD&to=AAAA-MM-DD` | Archivo de Excel |
| `GET /reports/sales?from=AAAA-MM-DD&to=AAAA-MM-DD` | Archivo de Excel |

`SalesOverview` tiene estos campos, en hora de Colombia:

- `current` y `previous`: `{ total, sales, profit }` del período y del período con que se compara. `previous` trae también su `from` y `to`.
  - La app envía con qué comparar: hoy con ayer, la semana con los mismos días de la semana pasada, el mes con los mismos días del mes pasado y el mes pasado con el anterior.
  - Sin `compareFrom` y `compareTo` (período elegido a mano), el backend compara con los días justo antes.
- `granularity` y `series`: las ventas repartidas en el tiempo, con todos los grupos aunque no tengan ventas.
  - Un día va por horas (`HOUR`, 24 grupos, `start` = `AAAA-MM-DDTHH`).
  - Hasta 31 días va por días (`DAY`), hasta 92 por semanas que empiezan el lunes (`WEEK`) y el resto por meses (`MONTH`).
  - Un grupo que empezaría antes de `from` empieza en `from`.
- `topProducts`: los 5 más vendidos del período.
- `salesWithoutPrice` y `salesWithoutCost`: lo mismo que en el resumen, pero del período.
- `inventory`: `{ products, lowStock, outOfStock }` de hoy, sin importar el período.

- **Período:** `from` y `to` están incluidos y no pueden abarcar más de 366 días. Si hay demasiadas filas, responde `400 REPORT_TOO_LARGE`.
- **Precio:** cada salida guarda el precio que tenía el producto. Las anteriores a este cambio no lo tienen: no suman al total y se cuentan como `salesWithoutPrice`.
- **Costo y ganancia:** cada salida guarda también su costo unitario. `profit` suma `cantidad × (precio − costo)` de las ventas que tienen los dos; las que no tienen costo se cuentan como `salesWithoutCost`.
- **Deshacer:** `POST /movements` acepta `revertsMovementId` en los ajustes, y la venta revertida deja de contar.
- **Modo demostración:** tiene el resumen por período, pero no genera archivos de Excel.

## Autenticación

| Método y ruta | Cuerpo | Respuesta |
| --- | --- | --- |
| `POST /auth/register` | `{ businessName, ownerName, email, password, passwordConfirmation, acceptDataPolicy: true }` | `201` + `AuthResponse` |
| `POST /auth/login` | `{ email, password }` | `AuthResponse` |
| `POST /auth/password-reset/request` | `{ email }` | `204` aunque el correo no exista |
| `POST /auth/password-reset/confirm` | `{ email, code, newPassword }` (`code`: 6 dígitos) | `204`, o `400` con `code: "INVALID_RESET_CODE"` |

`AuthResponse` tiene esta forma: `{ token, user: { ownerName, email }, business: { name } }`.

Detalles:

- **Cuerpos estrictos:** un campo de más o de menos responde `400 VALIDATION_ERROR`.
- **Registro:** si el correo ya existe, responde `409 EMAIL_ALREADY_REGISTERED`.
- **Inicio de sesión:** si el correo no existe o la contraseña no coincide, responde `401 INVALID_CREDENTIALS`. Después de 5 intentos fallidos seguidos, el correo queda bloqueado 15 minutos y responde `429 TOO_MANY_LOGIN_ATTEMPTS`, aunque la contraseña sea correcta. Restablecer la contraseña quita el bloqueo.
- **Restablecer contraseña (RF-04):**
  - el código vence en 15 minutos y sirve una sola vez;
  - después de 5 intentos con un código equivocado deja de servir;
  - si el correo no se pudo enviar, responde `500 EMAIL_NOT_SENT`.

## Productos

| Método y ruta | Cuerpo | Respuesta |
| --- | --- | --- |
| `GET /products` | | `Product[]` activos del negocio, ordenados por nombre |
| `GET /products/:id` | | `Product`, o `404 PRODUCT_NOT_FOUND` si no existe o está eliminado |
| `GET /products/code/:code` | | `Product`, o `404 CODE_NOT_RECOGNIZED` |
| `POST /products` | `{ name, unit, stock, code?, minStock?, salePrice?, costPrice?, imageUrl?, imageLargeUrl? }` | `201` + `Product` |
| `PATCH /products/:id` | `{ name, unit, minStock, salePrice, costPrice }` (`minStock`, `salePrice` y `costPrice` admiten `null`) | `Product` |
| `DELETE /products/:id` | | `204`. Desactiva el producto y guarda la fecha en `deletedAt` |
| `GET /products/deleted?code=…` | | `DeletedProduct[]`, del eliminado más reciente al más antiguo. `code` es opcional |
| `POST /products/:id/restore` | | `Product`, ya activo, o `404 PRODUCT_NOT_FOUND` |

Detalles de `POST /products`:

- **Código:** con `code` es un GTIN de 8 o 13 dígitos. Sin `code`, el backend genera un identificador interno (`INV-` y 10 caracteres).
- **Campos opcionales:** `minStock`, `salePrice` y `costPrice` no admiten `null`. Si no se definen, la app no los envía.
- **Existencia inicial:** si `stock` es mayor que 0, el backend registra el primer movimiento `INBOUND`. El historial lo muestra como "Existencia inicial".
- **Código repetido:** responde `409 CODE_ALREADY_REGISTERED`, o `409 CODE_OF_DELETED_PRODUCT` si el código es de un producto eliminado. Al escanear, la app ofrece restaurarlo antes de llegar a este punto.

Detalles de `DELETE /products/:id` (RF-08):

- Eliminar no borra nada y es reversible: el producto conserva su existencia, sus movimientos y su código, y vuelve con `POST /products/:id/restore`.
- Mientras está eliminado deja de salir en las consultas, incluidos su detalle y su historial, que responden `404`.
- No se le pueden registrar movimientos: responde `404`.
- Su código sigue ocupado por la restricción única.
- `DeletedProduct` tiene los campos de `Product` y `deletedAt`.

`Product` tiene estos campos: `{ id, name, unit, salePrice, costPrice, stock, minStock, codeType, code, imageUrl, imageLargeUrl }`. `imageUrl` e `imageLargeUrl` son la foto pública (Open Food Facts u Open Beauty Facts) que llegó con la sugerencia, si el usuario la aceptó al crear el producto: la app las envía en `POST /products` solo con código de barras, y el backend solo acepta direcciones de esos dos servidores. Son `null` si no hay foto. Las consultas agregan `status` (`OK`, `LOW_STOCK` u `OUT_OF_STOCK`); la app calcula el estado por su cuenta y lo ignora.

## Sugerencias para productos nuevos

| Método y ruta | Respuesta |
| --- | --- |
| `GET /catalog/:code` | `{ name, unit, source, imageUrl }`, o `404 SUGGESTION_NOT_FOUND` |

Al registrar un código de barras nuevo, la app pregunta si se conoce. Si hay sugerencia, muestra "¿Es este producto?". Con "Usar estos datos" llena el nombre y la unidad, que se pueden editar. El precio, el costo y las existencias siempre los escribe el usuario.

- **Solo GTIN:** los QR internos `INV-` y otros contenidos responden `404` sin consultar nada.
- **`source: COMMUNITY`:** el nombre y la unidad que usan al menos 3 negocios distintos para ese código, sin contar el propio ni los productos eliminados. Con menos coincidencias no se sugiere.
- **`source: OPEN_FOOD_FACTS` u `OPEN_BEAUTY_FACTS`:** si no hay coincidencias, se consultan a la vez Open Food Facts (alimentos) y Open Beauty Facts (cuidado personal y cosméticos), y se prefiere Open Food Facts. El backend espera hasta 4 s y la app hasta 8 s; si tarda más, no hay sugerencia. La tarjeta cita la base ("Se vende por unidad · Open Beauty Facts").
- **`imageUrl`:** miniatura del frente del producto en `https://images.openfoodfacts.org`, solo en sugerencias de Open Food Facts que tengan foto; si no, `null`. La tarjeta la muestra para confirmar que el código es de ese producto, y si no carga deja el ícono. No se guarda en el inventario.
- **Privacidad:** nunca trae precio, costo, existencias ni datos de otro negocio.
- **Sin conexión o con error:** la tarjeta no aparece y el formulario funciona igual.
- **Modo demostración:** conoce `7702004003508` (`COMMUNITY`), `7707000000001` (`OPEN_FOOD_FACTS`) y `7707368810434` (`OPEN_BEAUTY_FACTS`).

## Movimientos e inventario

| Método y ruta | Cuerpo | Respuesta |
| --- | --- | --- |
| `GET /products/:id/movements?limit=20&cursor=…` | | `{ items: Movement[], nextCursor }`, del más reciente al más antiguo |
| `POST /movements` | `{ productId, type, reason?, quantity, idempotencyKey, unitCost? }` | `{ movement, stock }`: `201` si se registró, `200` si no |
| `GET /products/low-stock` | | `Product[]` agotados o con `stock <= minStock`, los agotados primero |

Reglas de `POST /movements`:

- **`reason`:** solo va en las salidas (`SALE`, `CONSUMPTION` o `LOSS`). En entradas y ajustes no se envía.
- **`quantity` al enviar:** en una entrada o una salida es lo que suma o resta. En un ajuste es la **existencia contada**, que queda como la nueva existencia del producto.
- **`unitCost`:** solo en las salidas. Es el costo unitario de esa venta; sin él, el backend usa el costo del producto. Si es distinto, queda como el nuevo costo del producto. La app lo envía en las ventas.
- **`idempotencyKey`:** es un UUID que se repite en los reintentos. Si ya existe, el backend responde `200` con el movimiento que ya está registrado.
- **Ajuste sin cambios:** si la existencia contada es igual a la actual, responde `200` con `movement: null`.
- **Existencias insuficientes:** si una salida deja la existencia en negativo, el backend responde `409` con `code: "INSUFFICIENT_STOCK"`.

`Movement` tiene estos campos: `{ id, type, reason, quantity, resultingStock, createdAt }`.

- **`quantity` al leer:** en una entrada o una salida es positivo. En un ajuste es la **diferencia con signo** frente a la existencia anterior. Por eso cada fila del historial calcula su diferencia sin depender de las demás páginas.
- **`unitPrice` y `unitCost`:** el historial los trae en cada movimiento. Son el precio y el costo unitarios con que se registró la salida. Son `null` en entradas y ajustes, o si no había precio o costo, por ejemplo en ventas anteriores al costo del producto. La respuesta de `POST /movements` no los trae.

Paginación de `GET /products/:id/movements` (RF-15):

- **`limit`:** de 1 a 100. Si no llega, 50. El detalle del producto pide 5 y el historial completo pide 20 por página.
- **`cursor`:** el `nextCursor` de la página anterior. Sin él se entrega la primera página.
- **`nextCursor`:** `null` cuando ya no hay movimientos más antiguos.
- **Orden estable:** `createdAt` descendente y luego `id`, para que dos movimientos del mismo instante no se repitan ni se salten entre páginas.
