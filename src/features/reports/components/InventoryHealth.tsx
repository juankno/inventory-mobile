import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { theme } from '@/shared/ui/theme';
import type { SalesOverview } from '../api';

const t = messages.reports;

const GAP = 2;

// Una barra partida en tres: con existencias, por agotarse y agotados. Cada parte
// lleva su nombre y su número en la leyenda: el color nunca va solo.
export function InventoryHealth({ inventory }: { inventory: SalesOverview['inventory'] }) {
  const { products, lowStock, outOfStock } = inventory;
  const ok = products - lowStock - outOfStock;
  const parts = [
    { key: 'ok', label: t.stockOk, count: ok, color: theme.colors.success },
    { key: 'low', label: t.stockLow, count: lowStock, color: theme.colors.warningDot },
    { key: 'out', label: t.stockOut, count: outOfStock, color: theme.colors.dangerDot },
  ].filter((part) => part.count > 0);

  return (
    <View style={styles.container}>
      <View
        style={styles.bar}
        accessible
        accessibilityRole="image"
        accessibilityLabel={t.stockSummary(ok, lowStock, outOfStock)}
      >
        {parts.map((part) => (
          <View key={part.key} style={[styles.segment, { flex: part.count, backgroundColor: part.color }]} />
        ))}
      </View>

      <View style={styles.legend} importantForAccessibility="no-hide-descendants">
        {parts.map((part) => (
          <View key={part.key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: part.color }]} />
            <AppText variant="body" style={styles.flex}>
              {part.label}
            </AppText>
            <AppText variant="bodyStrong">{part.count}</AppText>
          </View>
        ))}
      </View>

      {lowStock + outOfStock > 0 ? (
        <Button label={t.stockAction} icon="bell" variant="secondary" onPress={() => router.push('/alerts')} />
      ) : (
        <AppText variant="body" tone="secondary">
          {t.stockAllGood}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { gap: theme.spacing.md },
  bar: { flexDirection: 'row', gap: GAP, height: 12 },
  segment: { borderRadius: 6 },
  legend: { gap: theme.spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
