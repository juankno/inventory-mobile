import { StyleSheet, View } from 'react-native';

import { formatMoney } from '@/shared/format/dates';
import { formatQuantity } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { theme } from '@/shared/ui/theme';
import type { TopProduct } from '../api';

const t = messages.reports;

// Los más vendidos con una barra proporcional a lo que vendió cada uno: se compara
// de un vistazo sin leer las cifras. Si ninguno tenía precio, la barra usa la cantidad.
export function TopProducts({ products }: { products: TopProduct[] }) {
  const byTotal = products.some((product) => product.total > 0);
  const value = (product: TopProduct) => (byTotal ? product.total : product.quantity);
  const max = Math.max(...products.map(value));

  return (
    <View style={styles.list}>
      {products.map((product, index) => {
        const quantity = formatQuantity(product.quantity, product.unit);
        return (
          <View
            key={`${product.name}-${index}`}
            style={styles.item}
            accessible
            accessibilityLabel={`${index + 1}. ${product.name}: ${formatMoney(product.total)}, ${t.topQuantity(quantity)}`}
          >
            <View style={styles.row}>
              <AppText variant="bodyStrong" numberOfLines={1} style={styles.flex}>
                {product.name}
              </AppText>
              <AppText variant="bodyStrong">{formatMoney(product.total)}</AppText>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${max > 0 ? (value(product) / max) * 100 : 0}%` }]} />
            </View>
            <AppText variant="caption" tone="secondary">
              {t.topQuantity(quantity)}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: theme.spacing.lg },
  item: { gap: theme.spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  track: { height: 8, borderRadius: 4, backgroundColor: theme.colors.field, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: theme.colors.ink },
});
