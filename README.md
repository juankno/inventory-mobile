# inventory-mobile

**Surtido** es una aplicación Android para que una tienda de barrio lleve su inventario con el celular: lee los códigos de barras de los productos, genera códigos QR para los que no tienen y registra entradas, salidas y ajustes (trabajo de grado, Politécnico Grancolombiano). Consume la API de [`inventory-backend`](../inventory-backend) en `https://surtido-api.vercel.app/api/v1`; su documentación está en <https://surtido-api.vercel.app/>.

**Stack:** Expo SDK 58, React Native 0.88, Expo Router, TanStack Query (con persistencia en SQLite), React Hook Form + Zod, TypeScript y Jest.

## Primeros pasos

Requisitos: Node.js 22 o superior, y un celular Android con [Expo Go](https://expo.dev/go) o un emulador.

```bash
cp .env.example .env          # por defecto apunta a la API de producción
npm install
npm start                     # abre Expo; escanea el QR con Expo Go o presiona "a"
```

Todos los módulos nativos que usa la app (cámara, SQLite, archivos, impresión, vibración) vienen en Expo Go, así que no hace falta un *development build* para desarrollar.

Para usar un backend local, cambia `EXPO_PUBLIC_API_URL` en `.env`: en el emulador es `http://10.0.2.2:3000/api/v1` y en un celular físico, la IP del computador en la red local. Después de cambiar `.env`, reinicia con `npx expo start -c`.

El proyecto tiene un `.npmrc` con `legacy-peer-deps=true`, porque algunas dependencias de Expo Router piden una versión de `react-dom` distinta a la de SDK 58.

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm start` | Inicia el servidor de desarrollo de Expo. |
| `npm run typecheck` | Revisa los tipos. |
| `npm run lint` | Ejecuta ESLint con la configuración de Expo. |
| `npm test` | Ejecuta las pruebas con Jest (jest-expo). |
| `npm run build:apk` | Genera el APK con EAS (perfil `preview`). |

Para agregar bibliotecas usa `npx expo install <paquete>`, que elige versiones compatibles con el SDK, y revisa el proyecto con `npx expo-doctor`.

## Qué hace la app

- **Cuenta:** registro, inicio de sesión, restablecer la contraseña con un código por correo y presentación inicial.
- **Inventario:** lista con búsqueda por nombre o código, filtros por estado y alertas de lo que hay que surtir, que se pueden compartir como lista de compras.
- **Productos:** crear con código de barras o con un código QR propio para imprimir; editar; eliminar y restaurar.
- **Movimientos:** entradas, salidas (venta, consumo o pérdida) y ajustes por conteo, con "Deshacer" y venta continua desde el escáner. El historial se carga por páginas.
- **Reportes:** resumen de ventas de hoy y de la semana, y archivos de Excel de inventario, ventas y movimientos.
- **Sin conexión:** lo último cargado se guarda en el celular hasta por 7 días y se borra al cerrar sesión. La app abre con esos datos y una franja avisa si no hay red o si el servidor no responde. Registrar movimientos sí requiere conexión.

## Estructura (DDS 5.2.3)

```
inventory-mobile/
├── app.config.ts              configuración de Expo, versión y arquitecturas del APK
├── eas.json                   perfiles de EAS y variables de cada uno
├── assets/
├── docs/
│   ├── diseno/                imágenes del diseño de la interfaz
│   ├── contrato-api.md        endpoints que usa la app
│   └── pendientes-ux.md       mejoras hechas y pendientes
└── src/
    ├── app/                   rutas de Expo Router (DDS Tabla 9)
    │   ├── _layout.tsx        proveedores, datos guardados y protección de rutas (M-02)
    │   ├── onboarding.tsx     presentación inicial
    │   ├── (auth)/            login, register, forgot-password
    │   └── (app)/             inventario, scanner, alerts, reports, products/…
    ├── features/              auth · products · movements · inventory · scanner · reports · onboarding
    │   └── <área>/            api.ts · hooks/ · components/ · schemas.ts
    └── shared/
        ├── api/               cliente HTTP, tipos del contrato, errores, caché y API simulada (M-04)
        ├── device/            conexión, vuelta a la app, vibración y botón atrás
        ├── session/           contexto de sesión y expo-secure-store (M-05)
        ├── ui/                componentes base y tema (M-12)
        ├── gs1/               dígito de control y normalización GTIN (M-09)
        ├── format/            unidades, existencias, fechas y precios
        └── i18n/              textos en español (RIU-01)
```

Las pantallas usan las funcionalidades y la capa compartida; las funcionalidades solo usan la capa compartida, y ninguna importa código de otra.

## Diseño

La interfaz sigue las imágenes de [docs/diseno](docs/diseno): fondo hueso, hojas blancas redondeadas, controles tipo píldora y la tipografía Manrope. Los colores y tamaños están en `src/shared/ui/theme.ts`. El texto mínimo es de 16 sp y el área táctil mínima, de 48 dp (RIU-02).

## Modo demostración

Para usar la app sin cuenta ni conexión, pon `EXPO_PUBLIC_USE_MOCK_API=true` en `.env` y reinicia con `npx expo start -c`. Una API simulada en memoria (`src/shared/api/mock/`) responde con los mismos endpoints y errores que el backend: se ingresa con cualquier correo y contraseña, y se usan los 20 productos de demostración. Los datos se reinician cada vez que se recarga la app, y los reportes en Excel no están disponibles.

## Compilar el APK

```bash
git checkout develop && git pull
npm run build:apk
```

- EAS compila lo que hay en tu copia local, no lo que hay en GitHub: revisa con `git status` que estés en la rama correcta y al día.
- Las variables del perfil `preview` están en `eas.json` (EAS no sube el archivo `.env`): API de producción y modo demostración apagado.
- El APK solo incluye las arquitecturas `arm64-v8a` y `armeabi-v7a`, así que no se instala en emuladores `x86`.
- Antes de compilar una versión nueva, sube `version` y `android.versionCode` en `app.config.ts`.

## Flujo de trabajo

- **Ramas:** `main` y `develop` están protegidas y solo reciben cambios por PR. Las ramas de trabajo salen de `develop` y vuelven a `develop` con un PR. Para publicar, se abre un PR de `develop` a `main`.
- **CI (GitHub Actions):** en cada PR corre `npm ci`, el typecheck, el lint y las pruebas.
