import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { useIsRestoring } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { OnboardingProvider, useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { createQueryClient, persistOptions } from '@/shared/api/queryClient';
import { watchConnection } from '@/shared/device/network';
import { SessionProvider, useSession } from '@/shared/session/SessionProvider';
import { theme } from '@/shared/ui/theme';
import { ToastProvider } from '@/shared/ui/Toast';

void SplashScreen.preventAutoHideAsync();
watchConnection();

// Proveedores y protección de rutas (M-02): el grupo (app) solo está
// disponible con sesión iniciada; el grupo (auth), solo sin sesión. La
// presentación (onboarding) aparece antes del login solo la primera vez.
function RootNavigator() {
  const { session, isLoading } = useSession();
  const onboarding = useOnboarding();
  // La pantalla de carga sigue hasta tener lo guardado, para abrir con datos y no con un indicador.
  const isRestoring = useIsRestoring();
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const ready = !isLoading && !isRestoring && !onboarding.isLoading && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const signedIn = !!session;
  const showOnboarding = !signedIn && !onboarding.seen;
  const signedOutHome = onboarding.seen ? '/login' : '/onboarding';

  return (
    <>
      <StatusBar style="dark" />
      {/* Entrar o cerrar sesión cambia de sección con un fundido. */}
      <Stack
        screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: theme.colors.background } }}
      >
        {/* Sin redirectTo el router busca "/" dentro de (auth), que no existe, y muestra "Unmatched route". */}
        <Stack.Protected guard={signedIn} redirectTo={signedOutHome}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={showOnboarding} redirectTo={signedIn ? '/' : '/login'}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn && onboarding.seen} redirectTo={signedIn ? '/' : '/onboarding'}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <SessionProvider>
        <OnboardingProvider>
          <ToastProvider>
            <RootNavigator />
          </ToastProvider>
        </OnboardingProvider>
      </SessionProvider>
    </PersistQueryClientProvider>
  );
}
