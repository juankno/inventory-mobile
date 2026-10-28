import { Stack } from 'expo-router';

import { theme } from '@/shared/ui/theme';

// Las pantallas de detalle entran desde la derecha (igual en Android e iOS);
// el escáner y los formularios de producto suben desde abajo, como una hoja.
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'ios_from_right',
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="scanner"
        options={{ animation: 'slide_from_bottom', contentStyle: { backgroundColor: theme.colors.scannerBg } }}
      />
      <Stack.Screen name="products/new" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="products/[id]/edit" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
