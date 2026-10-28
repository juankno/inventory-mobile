import * as Crypto from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useCreateMovement, useUndoMovement } from '@/features/movements/hooks/useMovements';
import { getLastChoice, rememberChoice } from '@/features/movements/lastChoice';
import { movementQuantitySchema, resultingStock } from '@/features/movements/schemas';
import { useProduct } from '@/features/products/hooks/useProducts';
import { errorMessage, hasErrorCode } from '@/shared/api/errors';
import { hapticSuccess } from '@/shared/device/haptics';
import type { MovementType, OutboundReason } from '@/shared/api/types';
import { allowsDecimals, formatNumber, unitWord } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { ChipGroup } from '@/shared/ui/ChipGroup';
import { Banner, Tag } from '@/shared/ui/Feedback';
import { IconButton } from '@/shared/ui/IconButton';
import { PageLayout } from '@/shared/ui/PageLayout';
import { QuantityStepper } from '@/shared/ui/QuantityStepper';
import { theme } from '@/shared/ui/theme';
import { useToast } from '@/shared/ui/Toast';

const t = messages.movement;

const typeOptions = [
  { value: 'INBOUND', label: t.inbound },
  { value: 'OUTBOUND', label: t.outbound },
  { value: 'ADJUSTMENT', label: t.adjustment },
] as const satisfies readonly { value: MovementType; label: string }[];

const reasonOptions = [
  { value: 'SALE', label: t.sale },
  { value: 'CONSUMPTION', label: t.consumption },
  { value: 'LOSS', label: t.loss },
] as const satisfies readonly { value: OutboundReason; label: string }[];

const isMovementType = (value: string | undefined): value is MovementType =>
  typeOptions.some((option) => option.value === value);

// Elección inicial: el tipo pedido por la pantalla anterior o, si viene del
// escáner, el último tipo y motivo usados (venta continua, RU-01).
function initialChoice(typeParam: string | undefined, scanned: boolean) {
  if (isMovementType(typeParam)) return { type: typeParam, reason: null };
  return (scanned ? getLastChoice() : null) ?? { type: null, reason: null };
}

// Entrada, salida o ajuste (RF-11 a RF-13, RU-01).
// ?type= preselecciona el tipo (desde el detalle o las alertas); ?scanned=1 indica que viene del escáner,
// y al registrar se vuelve a él para seguir con el siguiente producto.
export default function MovementScreen() {
  const params = useLocalSearchParams<{ id: string; type?: string; scanned?: string }>();
  const scanned = params.scanned === '1';
  const product = useProduct(params.id);
  const createMutation = useCreateMovement();
  const undoMovement = useUndoMovement();
  const showToast = useToast();
  const [initial] = useState(() => initialChoice(params.type, scanned));
  const [type, setType] = useState<MovementType | null>(initial.type);
  const [reason, setReason] = useState<OutboundReason | null>(initial.reason);
  const [quantity, setQuantity] = useState('1');
  const [helpOpen, setHelpOpen] = useState(false);
  // La misma clave en cada reintento evita registrar dos veces el movimiento (RU-01).
  const [idempotencyKey] = useState(() => Crypto.randomUUID());

  const back = <IconButton icon="chevronLeft" accessibilityLabel={messages.common.back} onPress={() => router.back()} />;
  const help = <IconButton icon="info" accessibilityLabel={t.help} onPress={() => setHelpOpen(true)} />;

  if (!product.data) {
    return (
      <PageLayout left={back} title={t.title} right={help}>
        {product.error ? (
          <Banner message={errorMessage(product.error, messages.errors.loadFailed)} />
        ) : (
          <ActivityIndicator color={theme.colors.ink} />
        )}
      </PageLayout>
    );
  }

  const item = product.data;
  const decimals = allowsDecimals(item.unit);

  const chooseType = (next: MovementType) => {
    setType(next);
    if (next !== 'OUTBOUND') setReason(null);
    // En el ajuste se parte de la existencia actual y se corrige al número contado.
    if (next === 'ADJUSTMENT') setQuantity(String(item.stock));
    else if (type === 'ADJUSTMENT' || type === null) setQuantity('1');
  };

  const parsed = type ? movementQuantitySchema(type, item.unit).safeParse(quantity) : null;
  const quantityError = parsed && !parsed.success ? parsed.error.issues[0]?.message : undefined;
  const value = parsed?.success ? parsed.data : null;
  const after = type && value !== null ? resultingStock(type, item.stock, value) : null;
  const insufficient = after !== null && after < 0;
  const unchanged = type === 'ADJUSTMENT' && value === item.stock;

  const disabledLabel = !type
    ? t.chooseType
    : type === 'OUTBOUND' && !reason
      ? t.chooseReason
      : unchanged
        ? t.noChange
        : null;
  const canSubmit = !disabledLabel && value !== null && !insufficient;

  const submit = () => {
    if (!type || value === null || !canSubmit) return;
    const previousStock = item.stock;
    const movementReason = type === 'OUTBOUND' ? reason : null;
    createMutation.mutate(
      { productId: item.id, type, reason: movementReason, quantity: value, idempotencyKey },
      {
        onSuccess: (movement) => {
          hapticSuccess();
          if (scanned) rememberChoice({ type, reason: movementReason });
          const remaining = `${formatNumber(movement.resultingStock)} ${unitWord(movement.resultingStock, item.unit)}`;
          showToast({
            message: messages.toast.remaining(messages.toast.registered[type], remaining),
            action: {
              label: messages.toast.undo,
              onPress: () =>
                undoMovement(movement, previousStock)
                  .then(() => showToast({ message: messages.toast.undone }))
                  .catch(() => showToast({ message: messages.toast.undoFailed })),
            },
          });
          if (scanned) router.replace('/scanner');
          else router.back();
        },
      },
    );
  };

  const stockText = `${formatNumber(item.stock)} ${unitWord(item.stock, item.unit)}`;
  const mutationError = createMutation.error;
  // Una salida mayor a la existencia se rechaza y se ofrece un ajuste por conteo (RF-12).
  const offerAdjustment =
    type === 'OUTBOUND' && (insufficient || hasErrorCode(mutationError, 'INSUFFICIENT_STOCK'));
  const switchToAdjustment = () => {
    createMutation.reset();
    chooseType('ADJUSTMENT');
  };

  return (
    <PageLayout
      left={back}
      title={t.title}
      right={help}
      header={
        <>
          {params.scanned ? <Tag icon="check" label={t.codeRead} /> : null}
          <AppText variant="heading">{item.name}</AppText>
          <View style={styles.stock}>
            <AppText maxFontSizeMultiplier={theme.maxFontScale.number} style={styles.stockNumber}>{formatNumber(item.stock)}</AppText>
            <AppText variant="title" tone="secondary" style={styles.stockUnit}>
              {t.inStock(unitWord(item.stock, item.unit))}
            </AppText>
          </View>
        </>
      }
      footer={
        <Button
          label={disabledLabel ?? t.submit[type!]}
          disabled={!canSubmit}
          onPress={submit}
          loading={createMutation.isPending}
        />
      }
    >
      {mutationError ? (
        <Banner
          message={
            hasErrorCode(mutationError, 'INSUFFICIENT_STOCK')
              ? t.insufficient(stockText)
              : errorMessage(mutationError, messages.errors.unexpected)
          }
        />
      ) : null}

      <View style={styles.group}>
        <AppText variant="label">{t.question}</AppText>
        <ChipGroup accessibilityLabel={t.question} options={typeOptions} value={type} onChange={chooseType} />
      </View>

      {type === 'OUTBOUND' ? (
        <View style={styles.group}>
          <AppText variant="label">{t.reason}</AppText>
          <ChipGroup accessibilityLabel={t.reason} options={reasonOptions} value={reason} onChange={setReason} />
        </View>
      ) : null}

      <View style={styles.group}>
        <AppText variant="label">{type === 'ADJUSTMENT' ? t.counted : t.quantity}</AppText>
        <QuantityStepper
          accessibilityLabel={type === 'ADJUSTMENT' ? t.counted : t.quantity}
          value={quantity}
          onChange={setQuantity}
          min={type === 'ADJUSTMENT' ? 0 : decimals ? 0 : 1}
          allowDecimals={decimals}
        />
        {quantityError ? (
          <AppText variant="caption" tone="danger">
            {quantityError}
          </AppText>
        ) : insufficient ? (
          <AppText variant="body" tone="danger" accessibilityLiveRegion="polite">
            {t.insufficient(stockText)}
          </AppText>
        ) : after !== null ? (
          <AppText variant="body" tone="secondary">
            {type === 'ADJUSTMENT' ? `${t.countedHint} ` : ''}
            {t.resulting(`${formatNumber(after)} ${unitWord(after, item.unit)}`)}
          </AppText>
        ) : null}
        {offerAdjustment ? (
          <Button label={t.switchToAdjustment} variant="secondary" icon="pencil" onPress={switchToAdjustment} />
        ) : null}
      </View>

      <BottomSheet visible={helpOpen} onClose={() => setHelpOpen(false)}>
        <AppText variant="heading">{t.helpTitle}</AppText>
        {[t.helpInbound, t.helpOutbound, t.helpAdjustment].map(([term, description]) => (
          <AppText key={term} variant="lead" tone="secondary">
            <AppText variant="lead" style={styles.bold}>
              {term}
            </AppText>
            {description}
          </AppText>
        ))}
        <Button label={messages.common.understood} onPress={() => setHelpOpen(false)} />
      </BottomSheet>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  group: { gap: theme.spacing.md },
  bold: { fontFamily: theme.fonts.bold, color: theme.colors.text },
  stock: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', columnGap: theme.spacing.sm },
  stockNumber: { fontFamily: theme.fonts.medium, fontSize: 64, lineHeight: 72, color: theme.colors.text },
  stockUnit: { marginBottom: theme.spacing.md, fontFamily: theme.fonts.medium },
});
