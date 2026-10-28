import { Stack } from 'expo-router';

import { theme } from '@/shared/ui/theme';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
      <Stack.Screen
        name="scanner"
        options={{ animation: 'slide_from_bottom', contentStyle: { backgroundColor: theme.colors.scannerBg } }}
      />
      <Stack.Screen name="products/new" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="products/[id]/edit" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
