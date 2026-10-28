import { Stack } from 'expo-router';

import { theme } from '@/shared/ui/theme';

// Ingresar y Crear cuenta son pestañas: cambian con un fundido.
// Recuperar contraseña entra desde la derecha como una pantalla nueva.
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="forgot-password" options={{ animation: 'ios_from_right' }} />
    </Stack>
  );
}
