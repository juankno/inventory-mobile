import { StyleSheet, View } from 'react-native';

import type { Movement, Unit } from '@/shared/api/types';
import { formatRelativeDateTime } from '@/shared/format/dates';
import { formatNumber, formatQuantity } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { theme } from '@/shared/ui/theme';

const labels = messages.movement.labels;

function movementTitle(movement: Movement, isFirst: boolean): string {
  if (isFirst && movement.type === 'INBOUND') return messages.movement.initialStock;
  if (movement.type === 'OUTBOUND' && movement.reason) return `${labels.OUTBOUND} · ${labels[movement.reason]}`;
  return labels[movement.type];
}

// Historial de movimientos (RF-15). La diferencia de cada fila se calcula con la
// existencia que dejó el movimiento anterior, así también sirve para los ajustes.
export function MovementHistory({ movements, unit }: { movements: Movement[]; unit: Unit }) {
  if (movements.length === 0) {
    return (
      <AppText variant="body" tone="secondary">
        {messages.product.historyEmpty}
      </AppText>
    );
  }

  return (
    <View>
      {movements.map((movement, index) => {
        const older = movements[index + 1];
        const delta = movement.resultingStock - (older?.resultingStock ?? 0);
        const isLast = index === movements.length - 1;
        const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
        return (
          <View
            key={movement.id}
            style={[styles.row, !isLast && styles.divider]}
            accessible
          >
            <View style={styles.icon}>
              <AppText variant="title">{delta >= 0 ? '+' : '–'}</AppText>
            </View>
            <View style={styles.main}>
              <AppText variant="title" numberOfLines={1}>
                {movementTitle(movement, isLast)}
              </AppText>
              <AppText variant="body" tone="secondary">
                {formatRelativeDateTime(movement.createdAt)}
              </AppText>
            </View>
            <View style={styles.amount}>
              <AppText variant="title">{`${sign}${formatQuantity(Math.abs(delta), unit)}`}</AppText>
              <AppText variant="body" tone="secondary">
                {messages.product.remaining(formatNumber(movement.resultingStock))}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: { flex: 1 },
  amount: { alignItems: 'flex-end' },
});
