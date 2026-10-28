import { router } from 'expo-router';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';

import { useAlerts } from '@/features/inventory/hooks/useAlerts';
import { errorMessage } from '@/shared/api/errors';
import type { Product } from '@/shared/api/types';
import { formatNumber, formatQuantity } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { Banner } from '@/shared/ui/Feedback';
import { IconButton } from '@/shared/ui/IconButton';
import { PageLayout } from '@/shared/ui/PageLayout';
import { theme } from '@/shared/ui/theme';

const t = messages.alerts;

// "Quedan 0 · mínimo 3" para unidades; "Quedan 2 kg · mínimo 5 kg" para lo demás.
const amount = (value: number, product: Product) =>
  product.unit === 'UNIT' ? formatNumber(value) : formatQuantity(value, product.unit);

// Productos agotados y por agotarse (RF-16).
export default function AlertsScreen() {
  const alerts = useAlerts();
  const total = alerts.data?.total ?? 0;

  return (
    <PageLayout
      left={<IconButton icon="chevronLeft" accessibilityLabel={messages.common.back} onPress={() => router.back()} />}
      title={t.title}
      header={
        alerts.data ? (
          <>
            <View style={styles.headline}>
              <AppText style={styles.count}>{total}</AppText>
              <AppText variant="heading" style={styles.headlineText}>
                {total === 1 ? t.headlineOne : t.headline}
              </AppText>
            </View>
            <AppText variant="lead" tone="secondary">
              {t.intro}
            </AppText>
          </>
        ) : null
      }
      refreshControl={
        <RefreshControl refreshing={alerts.isRefetching} onRefresh={() => void alerts.refetch()} tintColor={theme.colors.ink} />
      }
    >
      {alerts.isPending ? <ActivityIndicator color={theme.colors.ink} /> : null}
      {alerts.error ? <Banner message={errorMessage(alerts.error, messages.errors.loadFailed)} /> : null}

      {alerts.data && total === 0 ? (
        <View style={styles.group}>
          <AppText variant="title">{t.emptyTitle}</AppText>
          <AppText variant="body" tone="secondary">
            {t.emptyBody}
          </AppText>
        </View>
      ) : null}

      {alerts.data?.outOfStock.length ? (
        <AlertGroup title={t.outOfStock} tone="danger" products={alerts.data.outOfStock} />
      ) : null}
      {alerts.data?.lowStock.length ? (
        <AlertGroup title={t.lowStock} tone="warning" products={alerts.data.lowStock} />
      ) : null}
    </PageLayout>
  );
}

function AlertGroup({ title, tone, products }: { title: string; tone: 'danger' | 'warning'; products: Product[] }) {
  const isDanger = tone === 'danger';
  return (
    <View style={styles.group}>
      <View style={styles.groupTitle}>
        <View style={[styles.dot, { backgroundColor: isDanger ? theme.colors.dangerDot : theme.colors.warningDot }]} />
        <AppText variant="title" accessibilityRole="header">{`${title} · ${products.length}`}</AppText>
      </View>
      {products.map((product) => (
        <View key={product.id} style={[styles.card, isDanger ? styles.cardDanger : styles.cardWarning]}>
          <View style={styles.cardText}>
            <AppText
              variant="title"
              onPress={() => router.push({ pathname: '/products/[id]', params: { id: product.id } })}
            >
              {product.name}
            </AppText>
            <AppText variant="body" tone={isDanger ? 'danger' : 'secondary'}>
              {t.remaining(amount(product.stock, product), amount(product.minStock ?? 0, product))}
            </AppText>
          </View>
          <Button
            label={t.restock}
            variant={isDanger ? 'primary' : 'secondary'}
            style={styles.cardButton}
            onPress={() =>
              router.push({ pathname: '/products/[id]/movement', params: { id: product.id, type: 'INBOUND' } })
            }
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headline: { flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.md },
  count: { fontFamily: theme.fonts.medium, fontSize: 72, lineHeight: 78, color: theme.colors.text },
  headlineText: { marginBottom: theme.spacing.sm },
  group: { gap: theme.spacing.md },
  groupTitle: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  dot: { width: 12, height: 12, borderRadius: 6 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    paddingLeft: theme.spacing.lg,
    borderRadius: theme.radius.lg,
  },
  cardDanger: { backgroundColor: theme.colors.dangerBg },
  cardWarning: { borderWidth: 1, borderColor: theme.colors.border },
  cardText: { flex: 1 },
  cardButton: { minHeight: 48, paddingHorizontal: theme.spacing.lg },
});
