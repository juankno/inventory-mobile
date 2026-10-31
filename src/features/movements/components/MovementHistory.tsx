import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Movement, Unit } from '@/shared/api/types';
import { formatRelativeDateTime } from '@/shared/format/dates';
import { formatNumber, formatQuantity } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { theme } from '@/shared/ui/theme';

const labels = messages.movement.labels;

function movementTitle(movement: Movement, isOldest: boolean): string {
  if (isOldest && movement.type === 'INBOUND') return messages.movement.initialStock;
  if (movement.type === 'OUTBOUND' && movement.reason) return `${labels.OUTBOUND} · ${labels[movement.reason]}`;
  return labels[movement.type];
}

type RowProps = {
  movement: Movement;
  unit: Unit;
  // El movimiento más antiguo del producto es su existencia inicial.
  isOldest: boolean;
  divider?: boolean;
};

// Una fila del historial (RF-15). La diferencia sale de la existencia antes y
// después del movimiento, así también sirve para los ajustes.
export const MovementRow = memo(function MovementRow({ movement, unit, isOldest, divider }: RowProps) {
  const delta = movement.resultingStock - movement.previousStock;
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  return (
    <View style={[styles.row, divider && styles.divider]} accessible>
      <View style={styles.icon}>
        <AppText variant="title">{delta >= 0 ? '+' : '–'}</AppText>
      </View>
      <View style={styles.main}>
        <AppText variant="title" numberOfLines={1}>
          {movementTitle(movement, isOldest)}
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
});

// Lista corta de movimientos para el detalle del producto. complete indica que
// no hay movimientos más antiguos, así el último es la existencia inicial.
export function MovementHistory({ movements, unit, complete }: { movements: Movement[]; unit: Unit; complete: boolean }) {
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
        const isLast = index === movements.length - 1;
        return (
          <MovementRow
            key={movement.id}
            movement={movement}
            unit={unit}
            isOldest={complete && isLast}
            divider={!isLast}
          />
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
