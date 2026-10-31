import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MovementRow } from '@/features/movements/components/MovementHistory';
import { useMovementHistory } from '@/features/movements/hooks/useMovements';
import { useProduct } from '@/features/products/hooks/useProducts';
import { errorMessage } from '@/shared/api/errors';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { Banner } from '@/shared/ui/Feedback';
import { IconButton } from '@/shared/ui/IconButton';
import { theme } from '@/shared/ui/theme';

const t = messages.product;

// Historial completo del producto (RF-15). Carga por páginas al bajar, porque
// un producto que se vende a diario junta cientos de movimientos.
export default function MovementHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const product = useProduct(id);
  const history = useMovementHistory(id);
  const movements = history.data ?? [];
  const unit = product.data?.unit ?? 'UNIT';
  // El error de una página siguiente se muestra al pie; el de la primera, arriba.
  const pageFailed = history.isFetchNextPageError;

  const loadMore = () => {
    if (history.hasNextPage && !history.isFetchingNextPage && !pageFailed) void history.fetchNextPage();
  };

  const footer = history.isFetchingNextPage ? (
    <ActivityIndicator color={theme.colors.ink} style={styles.footer} />
  ) : pageFailed ? (
    <View style={styles.footer}>
      <Banner message={errorMessage(history.error, t.historyMoreFailed)} />
      <Button label={messages.common.retry} variant="secondary" onPress={() => void history.fetchNextPage()} />
    </View>
  ) : movements.length > 0 && !history.hasNextPage ? (
    <AppText variant="body" tone="secondary" style={styles.footer}>
      {t.historyEnd}
    </AppText>
  ) : undefined;

  const empty = history.isPending ? (
    <ActivityIndicator color={theme.colors.ink} />
  ) : history.error ? (
    <Banner message={errorMessage(history.error, messages.errors.loadFailed)} />
  ) : (
    <AppText variant="body" tone="secondary">
      {t.historyEmpty}
    </AppText>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + theme.spacing.md }]}>
      <View style={styles.topBar}>
        <View style={styles.slot}>
          <IconButton icon="chevronLeft" accessibilityLabel={messages.common.back} onPress={() => router.back()} />
        </View>
        <AppText variant="title" style={styles.title} numberOfLines={1} accessibilityRole="header">
          {t.historyTitle}
        </AppText>
        <View style={styles.slot} />
      </View>
      {product.data ? (
        <AppText variant="heading" numberOfLines={2} style={styles.name}>
          {product.data.name}
        </AppText>
      ) : null}

      <View style={styles.sheet}>
        <FlatList
          data={movements}
          keyExtractor={(movement) => movement.id}
          renderItem={({ item, index }) => (
            <MovementRow
              movement={item}
              unit={unit}
              isOldest={!history.hasNextPage && index === movements.length - 1}
              divider={index < movements.length - 1}
            />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          initialNumToRender={12}
          ListEmptyComponent={empty}
          ListFooterComponent={footer}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + theme.spacing.xxl }]}
          refreshControl={
            <RefreshControl
              refreshing={history.isRefetching && !history.isFetchingNextPage}
              onRefresh={() => void history.refetch()}
              tintColor={theme.colors.ink}
            />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    minHeight: 52,
  },
  title: { flex: 1, textAlign: 'center', fontFamily: theme.fonts.bold },
  slot: { width: 52 },
  name: { paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.lg },
  sheet: {
    flex: 1,
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.sheet,
    borderTopRightRadius: theme.radius.sheet,
    overflow: 'hidden',
  },
  listContent: { padding: theme.spacing.lg, paddingTop: theme.spacing.md },
  footer: { gap: theme.spacing.md, paddingVertical: theme.spacing.lg },
});
