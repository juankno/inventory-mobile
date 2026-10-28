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

## Pendientes

### 1. Funcionar sin conexión (alto impacto, esfuerzo alto)

En una tienda de barrio la señal falla, y hoy sin internet no se puede registrar nada. La propuesta tiene dos partes:

- Guardar los movimientos en el celular y enviarlos cuando vuelva la conexión. La clave de idempotencia ya evita duplicados al reenviar.
- Mostrar la última lista de productos cargada mientras no hay conexión.

Conviene hacerlo cuando el backend exista, para probarlo con datos reales. Hay que definir qué pasa si al reenviar una salida ya no alcanza la existencia.

### 2. Filtros del buscador (impacto medio, esfuerzo bajo)

Hoy el buscador del inicio filtra por nombre, sin importar tildes, y ordena de la A a la Z o al revés. Una tienda de barrio maneja decenas o unos cientos de productos, y cada filtro suma complejidad para un usuario poco técnico (afecta el SUS), así que conviene agregar pocos:

1. **Filtro por estado (recomendado):** tres opciones bajo el buscador, *Todos · Por agotarse · Agotados*, con el número de cada uno.
   - Responde la pregunta más común, "¿qué tengo que pedir?", sin ir a Alertas.
   - Se calcula con `stockStatus` sobre la lista que ya está cargada; no necesita backend.
2. **Buscar también por código (recomendado):** al escribir números o `INV-`, encontrar el producto por su código de barras o de QR.
   - Sirve cuando la cámara no lee y no se recuerda el nombre exacto.
   - La lista ya trae el campo `code`.
3. **Ordenar por existencia (opcional):** "Menos existencias primero", junto a A-Z. Si se agrega, el texto que alterna el orden pasaría a ser un menú pequeño.

Por ahora no se recomiendan:

- **Por unidad o por precio:** no responden ninguna pregunta del día a día de la tienda.
- **Categorías:** el modelo de datos no las tiene. Agregarlas implica backend, formulario y migración; solo valen la pena si el inventario crece mucho.

### 3. Ver un producto escaneándolo (impacto medio)

Desde el inicio, escanear siempre lleva a registrar un movimiento, pero a veces el tendero solo quiere saber cuánto le queda. Hay dos opciones:

- un enlace "Ver detalle" en la pantalla del movimiento;
- un botón de escáner en la barra de búsqueda que abra el detalle.

Esto también resuelve la parte de "buscar por escaneo" de RF-14.

### 4. Detalles de uso diario (impacto bajo a medio)

- **Precio con separadores:** que se vea "12.500" mientras se escribe, en lugar de "12500".
- **Cantidades a granel:** atajos de ½ kg, 1 kg y 2 kg, porque los botones − y + van de 1 en 1.
- **Inventario vacío con acciones:** botones para escanear o agregar un producto en el mensaje "Aún no tienes productos".
- **Carga con tarjetas de esqueleto** en lugar del indicador girando.
- **Volver a ver la presentación:** una opción "Cómo usar la app" en el menú ☰.
- **Deshacer con un endpoint propio:** hoy "Deshacer" registra un ajuste. Si el ERS pide que el historial no muestre la corrección, el backend necesitaría anular movimientos.
