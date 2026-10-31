# Pendientes de experiencia de usuario

Mejoras que salieron de revisar la app pensando en un tendero que la usa en el mostrador, con prisa y a veces con mala señal. Están ordenadas de mayor a menor impacto.

## Ya implementadas

- **Confirmación después de cada acción:** al registrar un movimiento, guardar, crear o eliminar un producto, aparece un aviso al pie. En los movimientos el aviso trae **Deshacer**, que registra un ajuste a la existencia anterior.
- **Venta continua desde el escáner:**
  - el movimiento llega con el último tipo y motivo usados (por ejemplo, "Salida · Venta");
  - al registrar, la app vuelve al escáner;
  - cada producto adicional queda en escanear + 1 toque.
- **Vibración al leer un código** y de advertencia si el código no es del negocio (`expo-haptics`).
- **Confirmar antes de descartar** lo escrito en "Nuevo producto" y "Editar producto".
- **Filtros del buscador:**
  - filtro por estado bajo el buscador (*Todos · Por agotarse · Agotados*), con el número de cada uno;
  - el buscador también encuentra productos por código de barras o `INV-`.
- **Consultar un producto escaneándolo (RF-14):** el botón de escáner en el buscador abre el escáner en modo consulta y lleva al detalle del producto. Al escanear para registrar un movimiento, el enlace "Ver detalle" junto a "Código leído" también lleva al detalle.
- **Inventario vacío con acciones:** el mensaje "Aún no tienes productos" trae los botones "Escanear un producto" y "Agregar sin código".
- **Precio con separadores:** se ve "12.500" mientras se escribe.
- **Historial paginado:** el detalle del producto muestra los últimos 5 movimientos y el botón "Ver todo el historial". Esa pantalla carga 20 movimientos más cada vez que se llega al final.

## Pendientes

### 1. Funcionar sin conexión (alto impacto, esfuerzo alto)

En una tienda de barrio la señal falla, y hoy sin internet no se puede registrar nada. La propuesta tiene dos partes:

- Guardar los movimientos en el celular y enviarlos cuando vuelva la conexión. La clave de idempotencia ya evita duplicados al reenviar.
- Mostrar la última lista de productos cargada mientras no hay conexión.

Conviene hacerlo cuando el backend exista, para probarlo con datos reales. Hay que definir qué pasa si al reenviar una salida ya no alcanza la existencia.

### 2. Más opciones del buscador (impacto bajo)

El filtro por estado y la búsqueda por código ya están. Una tienda de barrio maneja decenas o unos cientos de productos, y cada opción suma complejidad para un usuario poco técnico (afecta el SUS), así que lo que queda es opcional:

- **Ordenar por existencia:** "Menos existencias primero", junto a A-Z. Si se agrega, el texto que alterna el orden pasaría a ser un menú pequeño.

Por ahora no se recomiendan:

- **Por unidad o por precio:** no responden ninguna pregunta del día a día de la tienda.
- **Categorías:** el modelo de datos no las tiene. Agregarlas implica backend, formulario y migración; solo valen la pena si el inventario crece mucho.

### 3. Detalles de uso diario (impacto bajo a medio)

- **Cantidades a granel:** atajos de ½ kg, 1 kg y 2 kg, porque los botones − y + van de 1 en 1.
- **Carga con tarjetas de esqueleto** en lugar del indicador girando.
- **Volver a ver la presentación:** una opción "Cómo usar la app" en el menú ☰.
- **Tablets:** limitar el ancho del contenido (por ejemplo, 600 dp centrados). Hoy campos y botones se estiran a todo el ancho; es de baja prioridad porque la app está pensada para celular.
- **Deshacer con un endpoint propio:** hoy "Deshacer" registra un ajuste. Si el ERS pide que el historial no muestre la corrección, el backend necesitaría anular movimientos.

### 4. Listas que crecen con el uso (revisado)

Se revisaron las listas que dependen de cuántos datos tenga el negocio:

| Lista | Cómo carga | ¿Necesita paginación? |
| --- | --- | --- |
| Historial de movimientos | Por páginas | Ya está hecha. Es la única que crece sin límite: cada venta suma una fila. |
| Inventario (inicio) | Todos los productos activos, en una `FlatList` virtualizada | No por ahora. Crece con el catálogo, no con el uso, y una tienda de barrio tiene decenas o unos cientos de productos. Cargarla completa permite buscar, filtrar y contar al instante, y sirve para el modo sin conexión. Conviene revisarla si un negocio pasa de unos 2.000 productos; en ese caso la búsqueda, los filtros y los contadores tendrían que pasar al backend. |
| Alertas | Todos los productos bajo el mínimo, dentro de un `ScrollView` | No necesita paginación, porque el tendero debe ver todas para surtir. Pero las tarjetas no se virtualizan: si un negocio llega a más de unas 100 alertas, conviene pasarla a una `SectionList`. |

