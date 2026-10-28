import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { SessionProvider, useSession } from '@/shared/session/SessionProvider';
import { theme } from '@/shared/ui/theme';

void SplashScreen.preventAutoHideAsync();

// Proveedores y protección de rutas (M-02): el grupo (app) solo está
// disponible con sesión iniciada; el grupo (auth), solo sin sesión.
function RootNavigator() {
  const { session, isLoading } = useSession();
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const ready = !isLoading && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" />
      {/* Entrar o cerrar sesión cambia de sección con un fundido. */}
      <Stack
        screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: theme.colors.background } }}
      >
        {/* Sin redirectTo el router busca "/" dentro de (auth), que no existe, y muestra "Unmatched route". */}
        <Stack.Protected guard={!!session} redirectTo="/login">
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!session} redirectTo="/">
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
    </QueryClientProvider>
  );
}
