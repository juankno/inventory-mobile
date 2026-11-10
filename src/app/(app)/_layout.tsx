import { Stack } from 'expo-router';
import { onlineManager } from '@tanstack/react-query';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProducts } from '@/features/products/hooks/useProducts';
import { connectionNotice, RECHECK_CONNECTION_MS } from '@/shared/api/queryPolicy';
import { useIsOnline } from '@/shared/device/network';
import { OfflineBanner } from '@/shared/ui/OfflineBanner';
import { theme } from '@/shared/ui/theme';

// Las pantallas de detalle entran desde la derecha (igual en Android e iOS);
// el escáner y los formularios de producto suben desde abajo, como una hoja.
export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const isOnline = useIsOnline();
  // Mientras la API no responda teniendo red, se vuelve a intentar cada tanto.
  const products = useProducts({
    refetchInterval: (query) =>
      connectionNotice(onlineManager.isOnline(), query.state.error) === 'unreachable' ? RECHECK_CONNECTION_MS : false,
  });
  const notice = connectionNotice(isOnline, products.error);
  const offline = notice !== null;
  // Con la franja visible, ella ocupa la zona de la barra de estado y las pantallas ya no la reservan.
  const screenInsets = useMemo(() => (offline ? { ...insets, top: 0 } : insets), [offline, insets]);

  return (
    <View style={styles.root}>
      {notice ? <OfflineBanner reason={notice} updatedAt={products.dataUpdatedAt} paddingTop={insets.top} /> : null}
      <SafeAreaInsetsContext.Provider value={screenInsets}>
        <AppStack />
      </SafeAreaInsetsContext.Provider>
    </View>
  );
}

function AppStack() {
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
});
