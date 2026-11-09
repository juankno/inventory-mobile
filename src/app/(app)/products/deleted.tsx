import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';

import { useDeletedProducts, useRestoreProduct } from '@/features/products/hooks/useProducts';
import { errorMessage } from '@/shared/api/errors';
import { formatRelativeDateTime } from '@/shared/format/dates';
import { formatQuantity } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { Banner } from '@/shared/ui/Feedback';
import { IconButton } from '@/shared/ui/IconButton';
import { PageLayout } from '@/shared/ui/PageLayout';
import { theme } from '@/shared/ui/theme';
import { useToast } from '@/shared/ui/Toast';
import { useScreenSize } from '@/shared/ui/useScreenSize';

const t = messages.deletedProducts;

// Productos eliminados, para restaurarlos con su existencia e historial (RF-08).
export default function DeletedProductsScreen() {
  const deleted = useDeletedProducts();
  const restoreProduct = useRestoreProduct();
  const showToast = useToast();
  const { narrow } = useScreenSize();
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const restore = (id: string) => {
    setRestoringId(id);
    restoreProduct(id)
      .then(() => showToast({ message: messages.toast.productRestored }))
      .catch(() => showToast({ message: messages.toast.restoreFailed }))
      .finally(() => setRestoringId(null));
  };

  return (
    <PageLayout
      left={<IconButton icon="chevronLeft" accessibilityLabel={messages.common.back} onPress={() => router.back()} />}
      title={t.title}
      header={
        <AppText variant="lead" tone="secondary">
          {t.intro}
        </AppText>
      }
      refreshControl={
        <RefreshControl
          refreshing={deleted.isRefetching}
          onRefresh={() => void deleted.refetch()}
          tintColor={theme.colors.ink}
        />
      }
    >
      {deleted.isPending ? <ActivityIndicator color={theme.colors.ink} /> : null}
      {deleted.error ? <Banner message={errorMessage(deleted.error, messages.errors.loadFailed)} /> : null}

      {deleted.data?.length === 0 ? (
        <View style={styles.empty}>
          <AppText variant="title">{t.emptyTitle}</AppText>
          <AppText variant="body" tone="secondary">
            {t.emptyBody}
          </AppText>
        </View>
      ) : null}

      {deleted.data?.map((product) => (
        <View key={product.id} style={[styles.card, narrow && styles.cardStacked]}>
          <View style={styles.cardText}>
            <AppText variant="title">{product.name}</AppText>
            <AppText variant="body" tone="secondary">
              {t.stock(formatQuantity(product.stock, product.unit))}
            </AppText>
            <AppText variant="body" tone="secondary">
              {t.deletedAt(formatRelativeDateTime(product.deletedAt))}
            </AppText>
          </View>
          <Button
            label={t.restore}
            accessibilityLabel={t.restoreLabel(product.name)}
            variant="secondary"
            style={styles.cardButton}
            loading={restoringId === product.id}
            disabled={restoringId !== null}
            onPress={() => restore(product.id)}
          />
        </View>
      ))}
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  empty: { gap: theme.spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    paddingLeft: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardStacked: { flexDirection: 'column', alignItems: 'stretch', padding: theme.spacing.lg },
  cardText: { flexGrow: 1, flexShrink: 1 },
  cardButton: { minHeight: 48, paddingHorizontal: theme.spacing.lg },
});
