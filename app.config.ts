import type { ExpoConfig } from 'expo/config';

// Configuración de Expo. La URL de la API se lee de EXPO_PUBLIC_API_URL (G-06).
const config: ExpoConfig = {
  name: 'Surtido',
  slug: 'inventory-mobile',
  scheme: 'inventory',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  android: {
    package: 'co.edu.poligran.inventory',
    adaptiveIcon: {
      backgroundColor: '#1F1F1E',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 120,
        backgroundColor: '#F1F0EC',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'La aplicación usa la cámara para leer los códigos de los productos.',
        recordAudioAndroid: false,
      },
    ],
  ],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    // Proyecto de EAS Build. Con app.config.ts EAS no puede escribirlo solo.
    eas: {
      projectId: 'be063f47-cffc-4949-8037-575c1a66f481',
    },
  },
};

export default config;
