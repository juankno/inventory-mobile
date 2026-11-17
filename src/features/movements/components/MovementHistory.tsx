import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Movement, Unit } from '@/shared/api/types';
import { formatMoney, formatRelativeDateTime } from '@/shared/format/dates';
import { formatNumber, formatQuantity } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { theme } from '@/shared/ui/theme';

const labels = messages.movement.labels;
const ICON_SIZE = 44;
const p = messages.product;

// Un ícono por tipo: el ajuste se distingue de una entrada o una salida aunque cambie la existencia.
const MOVEMENT_ICONS: Record<Movement['type'], IconName> = {
  INBOUND: 'plus',
  OUTBOUND: 'minus',
  ADJUSTMENT: 'pencil',
};

function movementTitle(movement: Movement, isOldest: boolean): string {
  if (isOldest && movement.type === 'INBOUND') return messages.movement.initialStock;
  if (movement.type === 'OUTBOUND' && movement.reason) return `${labels.OUTBOUND} · ${labels[movement.reason]}`;
  return labels[movement.type];
}

// Lo que se cobró, a qué precio y costo, y lo que dejó la venta. Solo para ventas.
function saleDetails(movement: Movement): { line: string; result: string | null; loss: boolean } | null {
  if (movement.type !== 'OUTBOUND' || movement.reason !== 'SALE') return null;
  const { quantity, unitPrice, unitCost } = movement;
  const parts = [
    ...(unitPrice !== null
      ? [p.saleCharged(formatMoney(quantity * unitPrice)), p.salePrice(formatMoney(unitPrice))]
      : [p.saleNoPrice]),
    unitCost !== null ? p.saleCost(formatMoney(unitCost)) : p.saleNoCost,
  ];
  const profit = unitPrice !== null && unitCost !== null ? quantity * (unitPrice - unitCost) : null;
  return {
    line: parts.join(' · '),
    result: profit === null ? null : profit >= 0 ? p.saleProfit(formatMoney(profit)) : p.saleLoss(formatMoney(-profit)),
    loss: profit !== null && profit < 0,
  };
}

type RowProps = {
  movement: Movement;
  unit: Unit;
  // El movimiento más antiguo del producto es su existencia inicial.
  isOldest: boolean;
  divider?: boolean;
};

// Una fila del historial (RF-15). En un ajuste, quantity ya trae la diferencia con
// signo; así cada fila se calcula sola, sin depender de las demás páginas.
export const MovementRow = memo(function MovementRow({ movement, unit, isOldest, divider }: RowProps) {
  const delta = movement.type === 'OUTBOUND' ? -movement.quantity : movement.quantity;
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  const sale = saleDetails(movement);
  return (
    <View style={[styles.item, divider && styles.divider]} accessible>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Icon name={MOVEMENT_ICONS[movement.type]} size={22} />
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
      {sale ? (
        // Debajo del título, alineado con el texto y no con el ícono.
        <View style={styles.sale}>
          <AppText variant="body" tone="secondary">
            {sale.line}
          </AppText>
          {sale.result ? (
            <AppText variant="bodyStrong" tone={sale.loss ? 'danger' : undefined}>
              {sale.result}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

// Lista corta de movimientos para el detalle del producto. complete indica que
// no hay movimientos más antiguos, así el último es la existencia inicial.
export function MovementHistory({ movements, unit, complete }: { movements: Movement[]; unit: Unit; complete: boolean }) {
  if (movements.length === 0) {
    return <EmptyState icon="history" title={messages.product.historyEmpty} />;
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
  item: { gap: theme.spacing.xs, paddingVertical: theme.spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  sale: { marginLeft: ICON_SIZE + theme.spacing.md },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: theme.colors.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: { flex: 1 },
  amount: { alignItems: 'flex-end' },
});
