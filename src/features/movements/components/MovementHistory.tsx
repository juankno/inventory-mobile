import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Movement, Unit } from '@/shared/api/types';
import { formatDayHeading, formatMoney, formatTime, localDayKey } from '@/shared/format/dates';
import { formatNumber, formatQuantity } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { theme } from '@/shared/ui/theme';

const labels = messages.movement.labels;
const p = messages.product;
const r = messages.product.historyRow;
const ICON_SIZE = 44;

// Cómo se ve cada clase de movimiento. La entrada va rellena porque suma mercancía; la salida,
// en gris como el botón "Salida" del detalle; el ajuste, solo con borde porque corrige un
// conteo; y la corrección de "Deshacer", con la flecha que vuelve.
type Kind = 'inbound' | 'outbound' | 'adjustment' | 'undo';

const KIND_ICONS: Record<Kind, IconName> = {
  inbound: 'plus',
  outbound: 'minus',
  adjustment: 'pencil',
  undo: 'undo',
};

function kindOf(movement: Movement): Kind {
  if (movement.revertsMovementId) return 'undo';
  if (movement.type === 'INBOUND') return 'inbound';
  if (movement.type === 'OUTBOUND') return 'outbound';
  return 'adjustment';
}

// "venta", "entrada"...: lo que deshizo una corrección, para "Deshacer venta".
function undoTarget(movement: Movement): string {
  if (movement.type === 'OUTBOUND' && movement.reason) return r.undoTargets[movement.reason];
  return r.undoTargets[movement.type === 'INBOUND' ? 'INBOUND' : 'ADJUSTMENT'];
}

function movementTitle(movement: Movement, isOldest: boolean, reverts: Movement | undefined): string {
  if (movement.revertsMovementId) return reverts ? r.undoOf(undoTarget(reverts)) : r.undo;
  if (isOldest && movement.type === 'INBOUND') return messages.movement.initialStock;
  // Venta, consumo y pérdida ya son salidas: no hace falta decir "Salida · Venta".
  if (movement.type === 'OUTBOUND') return movement.reason ? labels[movement.reason] : labels.OUTBOUND;
  return labels[movement.type];
}

// Lo que se cobró y lo que dejó la venta. Solo en ventas que siguen contando.
function SaleLine({ movement }: { movement: Movement }) {
  const { quantity, unitPrice, unitCost } = movement;
  if (unitPrice === null) {
    return (
      <AppText variant="body" tone="secondary">
        {r.noPrice}
      </AppText>
    );
  }
  const profit = unitCost === null ? null : quantity * (unitPrice - unitCost);
  return (
    <AppText variant="body" tone="secondary">
      {r.charged(formatMoney(quantity * unitPrice))}
      {' · '}
      {profit === null ? (
        r.noCost
      ) : profit >= 0 ? (
        <AppText variant="bodyStrong">{r.gained(formatMoney(profit))}</AppText>
      ) : (
        <AppText variant="bodyStrong" tone="danger">
          {r.lost(formatMoney(-profit))}
        </AppText>
      )}
    </AppText>
  );
}

type RowProps = {
  movement: Movement;
  unit: Unit;
  // El movimiento más antiguo del producto es su existencia inicial.
  isOldest: boolean;
  // Si esta fila es la corrección de un "Deshacer" y el movimiento deshecho está cargado.
  reverts?: Movement;
  divider?: boolean;
};

// Una fila del historial (RF-15): título y hora a la izquierda, cantidad y existencia a la
// derecha. En un ajuste, quantity ya trae la diferencia con signo; así cada fila se calcula
// sola, sin depender de las demás páginas.
export const MovementRow = memo(function MovementRow({ movement, unit, isOldest, reverts, divider }: RowProps) {
  const kind = kindOf(movement);
  const delta = movement.type === 'OUTBOUND' ? -movement.quantity : movement.quantity;
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  const isSale = movement.type === 'OUTBOUND' && movement.reason === 'SALE';
  const { reverted } = movement;

  return (
    <View style={[styles.item, divider && styles.divider]} accessible>
      <View style={styles.row}>
        <View style={[styles.icon, styles[kind]]}>
          <Icon name={KIND_ICONS[kind]} size={22} color={kind === 'inbound' ? theme.colors.onInk : theme.colors.ink} />
        </View>
        <View style={styles.main}>
          <View style={styles.titleRow}>
            <AppText variant="title" numberOfLines={1} style={styles.title}>
              {movementTitle(movement, isOldest, reverts)}
            </AppText>
            {reverted ? (
              <View style={styles.undoneTag}>
                <AppText variant="label" tone="secondary">
                  {r.undone}
                </AppText>
              </View>
            ) : null}
          </View>
          <AppText variant="body" tone="secondary">
            {formatTime(movement.createdAt)}
          </AppText>
        </View>
        <View style={styles.amount}>
          {/* Deshecho, la cantidad se tacha: el movimiento quedó compensado por su corrección. */}
          <AppText variant="title" tone={reverted ? 'secondary' : undefined} style={reverted && styles.struck}>
            {`${sign}${formatQuantity(Math.abs(delta), unit)}`}
          </AppText>
          <AppText variant="body" tone="secondary">
            {p.remaining(formatNumber(movement.resultingStock))}
          </AppText>
        </View>
      </View>
      {isSale ? (
        // Debajo del título, alineado con el texto y no con el ícono.
        <View style={styles.sale}>
          {reverted ? (
            <AppText variant="body" tone="secondary">
              {r.undoneSale}
            </AppText>
          ) : (
            <SaleLine movement={movement} />
          )}
        </View>
      ) : null}
    </View>
  );
});

// Encabezado de cada día: las filas solo muestran la hora.
export function DayHeading({ createdAt, first }: { createdAt: string; first?: boolean }) {
  return (
    <AppText variant="label" tone="secondary" accessibilityRole="header" style={[styles.day, first && styles.firstDay]}>
      {formatDayHeading(createdAt)}
    </AppText>
  );
}

// Si la fila abre un día nuevo (lleva encabezado) y si la sigue otra del mismo día (lleva línea).
export function dayBoundaries(movements: Movement[], index: number) {
  const current = movements[index];
  const previous = movements[index - 1];
  const next = movements[index + 1];
  const day = localDayKey(current.createdAt);
  return {
    startsDay: !previous || localDayKey(previous.createdAt) !== day,
    divider: !!next && localDayKey(next.createdAt) === day,
  };
}

// Lista corta de movimientos para el detalle del producto, agrupada por día. complete indica
// que no hay movimientos más antiguos, así el último es la existencia inicial.
export function MovementHistory({ movements, unit, complete }: { movements: Movement[]; unit: Unit; complete: boolean }) {
  if (movements.length === 0) {
    return <EmptyState icon="history" title={messages.product.historyEmpty} />;
  }

  const byId = new Map(movements.map((movement) => [movement.id, movement]));
  return (
    <View>
      {movements.map((movement, index) => {
        const { startsDay, divider } = dayBoundaries(movements, index);
        return (
          <View key={movement.id}>
            {startsDay ? <DayHeading createdAt={movement.createdAt} first={index === 0} /> : null}
            <MovementRow
              movement={movement}
              unit={unit}
              isOldest={complete && index === movements.length - 1}
              reverts={movement.revertsMovementId ? byId.get(movement.revertsMovementId) : undefined}
              divider={divider}
            />
          </View>
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
  day: { paddingTop: theme.spacing.xl },
  firstDay: { paddingTop: theme.spacing.sm },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inbound: { backgroundColor: theme.colors.ink },
  outbound: { backgroundColor: theme.colors.field },
  adjustment: { borderWidth: 2, borderColor: theme.colors.ink },
  undo: { backgroundColor: theme.colors.field },
  main: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: theme.spacing.sm },
  title: { flexShrink: 1 },
  undoneTag: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.field,
  },
  amount: { alignItems: 'flex-end' },
  struck: { textDecorationLine: 'line-through' },
});
