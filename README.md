# inventory-mobile

Aplicación Android para que una tienda de barrio lleve su inventario con el celular: lee los códigos de barras de los productos, genera códigos QR para los que no tienen y registra entradas, salidas y ajustes (trabajo de grado, Politécnico Grancolombiano). Consume la API de [`inventory-backend`](../inventory-backend) a través del contrato `/api/v1` (DDS v1.1, sección 8.1).

**Stack:** Expo SDK 58, React Native 0.88, Expo Router, TanStack Query, React Hook Form + Zod, TypeScript y Jest.

## Primeros pasos

Requisitos: Node.js 22 o superior, y un celular Android o un emulador.

```bash
cp .env.example .env          # EXPO_PUBLIC_API_URL apunta a la API
npm install
npm start                     # abre Expo; presiona "a" para Android
```

En el emulador de Android, la API local se alcanza en `http://10.0.2.2:3000/api/v1`. En un celular físico usa la IP del computador en la red local.

La cámara (expo-camera) y otras bibliotecas nativas necesitan un *development build* en lugar de Expo Go: `npx expo run:android` o `npx eas-cli@latest build --profile development --platform android`.

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm start` | Inicia el servidor de desarrollo de Expo. |
| `npm run typecheck` | Revisa los tipos. |
| `npm run lint` | Ejecuta ESLint con la configuración de Expo. |
| `npm test` | Ejecuta las pruebas con Jest (jest-expo). |
| `npm run build:apk` | Genera el APK con EAS (perfil `preview`). |

Para agregar bibliotecas usa `npx expo install <paquete>`, que elige versiones compatibles con el SDK.

## Estructura (DDS 5.2.3)

```
inventory-mobile/
├── app.config.ts              configuración de Expo y variables de entorno
├── eas.json                   perfiles de compilación del APK
├── assets/
└── src/
    ├── app/                   rutas de Expo Router (DDS Tabla 9)
    │   ├── _layout.tsx        proveedores y protección de rutas (M-02)
    │   ├── (auth)/            login, register, forgot-password
    │   └── (app)/             inventario, scanner, alerts, products/…
    ├── features/              auth · products · movements · inventory · scanner
    │   └── <área>/            api.ts · hooks/ · components/ · schemas.ts
    └── shared/
        ├── api/               apiClient, tipos del contrato y errores (M-04)
        ├── session/           contexto de sesión y expo-secure-store (M-05)
        ├── ui/                componentes base y tema (M-12)
        ├── gs1/               dígito de control y normalización GTIN (M-09)
        └── i18n/              textos en español (RIU-01)
```

Las pantallas usan las funcionalidades y la capa compartida; las funcionalidades solo usan la capa compartida, y ninguna importa código de otra.

## Estado

Las diez rutas existen como pantallas temporales. Ya funcionan la protección de rutas por sesión, el cliente HTTP con manejo de `{code, message}` y del 401, el almacenamiento cifrado del token y la validación GS1 (con pruebas).
