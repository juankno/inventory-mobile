import * as Crypto from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useCreateMovement, useUndoMovement } from '@/features/movements/hooks/useMovements';
import { getLastChoice, rememberChoice } from '@/features/movements/lastChoice';
import { movementQuantitySchema, resultingStock } from '@/features/movements/schemas';
import { ProductImage } from '@/features/products/components/ProductImage';
import { useProduct } from '@/features/products/hooks/useProducts';
import { formatPriceInput, parsePrice, priceToInput } from '@/features/products/schemas';
import { errorMessage, hasErrorCode } from '@/shared/api/errors';
import { hapticSuccess } from '@/shared/device/haptics';
import type { MovementType, OutboundReason } from '@/shared/api/types';
import { formatMoney } from '@/shared/format/dates';
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
import { TextField } from '@/shared/ui/TextField';
import { Skeleton } from '@/shared/ui/Skeleton';
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
  // Precio y costo de esta venta. null: todavía no se editaron y se muestran los del producto.
  const [priceText, setPriceText] = useState<string | null>(null);
  const [costText, setCostText] = useState<string | null>(null);
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
          <Skeleton variant="product" />
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
  // En las ventas se pueden cambiar el precio y el costo; uno distinto queda como el nuevo
  // precio o costo del producto.
  const isSale = type === 'OUTBOUND' && reason === 'SALE';
  const price = priceText ?? priceToInput(item.salePrice);
  const unitPrice = parsePrice(price);
  const priceError = amountError(price, unitPrice, item.salePrice);
  const priceChanged = unitPrice !== null && unitPrice !== item.salePrice;
  const cost = costText ?? priceToInput(item.costPrice);
  const unitCost = parsePrice(cost);
  const costError = amountError(cost, unitCost, item.costPrice);
  const costChanged = unitCost !== null && unitCost !== item.costPrice;
  const saleProfit =
    unitPrice !== null && unitCost !== null && value !== null ? value * (unitPrice - unitCost) : null;
  // Lo que hay que cobrar: la cantidad por el precio de esta venta.
  const saleTotal = unitPrice !== null && value !== null ? value * unitPrice : null;
  const saleQuantity = value !== null ? `${formatNumber(value)} ${unitWord(value, item.unit)}` : '';
  // Vender por debajo del costo se permite (liquidar, producto por vencer), pero se avisa.
  const losing = saleProfit !== null && saleProfit < 0;
  const saleHint =
    priceError || costError
      ? null
      : unitPrice === null
        ? t.noPrice
        : unitCost === null
          ? t.noCost
          : saleProfit === null
            ? null
            : saleProfit >= 0
              ? t.saleProfit(formatMoney(saleProfit))
              : t.saleLoss(formatMoney(-saleProfit), formatMoney(unitCost - unitPrice), unitWord(1, item.unit));
  const savedNote =
    priceChanged && costChanged ? t.newPriceAndCost : priceChanged ? t.newPrice : costChanged ? t.newCost : null;

  const canSubmit = !disabledLabel && value !== null && !insufficient && !(isSale && (priceError || costError));

  const submit = () => {
    if (!type || value === null || !canSubmit) return;
    const previousStock = item.stock;
    const movementReason = type === 'OUTBOUND' ? reason : null;
    createMutation.mutate(
      {
        productId: item.id,
        type,
        reason: movementReason,
        quantity: value,
        idempotencyKey,
        ...(isSale && unitPrice !== null && { unitPrice }),
        ...(isSale && unitCost !== null && { unitCost }),
      },
      {
        onSuccess: ({ movement, stock }) => {
          hapticSuccess();
          if (scanned) rememberChoice({ type, reason: movementReason });
          const remaining = `${formatNumber(stock)} ${unitWord(stock, item.unit)}`;
          showToast({
            message: messages.toast.remaining(messages.toast.registered[type], remaining),
            // Sin movimiento (el ajuste coincidió con la existencia) no hay nada que deshacer.
            action: movement
              ? {
                  label: messages.toast.undo,
                  onPress: () =>
                    undoMovement(item.id, movement.id, previousStock)
                      .then(() => showToast({ message: messages.toast.undone }))
                      .catch(() => showToast({ message: messages.toast.undoFailed })),
                }
              : undefined,
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
          {params.scanned ? (
            <View style={styles.scannedRow}>
              <Tag icon="check" label={t.codeRead} />
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push({ pathname: '/products/[id]', params: { id: item.id } })}
                style={styles.detailLink}
              >
                <AppText variant="bodyStrong" style={styles.underline}>
                  {t.viewDetail}
                </AppText>
              </Pressable>
            </View>
          ) : null}
          {/* La foto confirma de un vistazo que es el producto correcto antes de registrar. */}
          <View style={styles.nameRow}>
            <ProductImage imageUrl={item.imageUrl} imageLargeUrl={item.imageLargeUrl} size={56} zoomable />
            <AppText variant="heading" style={styles.flexName}>
              {item.name}
            </AppText>
          </View>
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

      {isSale && saleTotal !== null ? (
        // Lo primero que necesita quien vende: cuánto cobrar. Se actualiza con la cantidad y el precio.
        <View
          style={styles.total}
          accessible
          accessibilityLabel={t.saleTotalLabel(formatMoney(saleTotal), saleQuantity, formatMoney(unitPrice!), unitWord(1, item.unit))}
          accessibilityLiveRegion="polite"
        >
          <View style={styles.totalRow}>
            <AppText variant="title">{t.saleTotal}</AppText>
            <AppText
              maxFontSizeMultiplier={theme.maxFontScale.number}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={styles.totalAmount}
            >
              {formatMoney(saleTotal)}
            </AppText>
          </View>
          <AppText variant="body" tone="secondary">
            {t.saleBreakdown(saleQuantity, formatMoney(unitPrice!))}
          </AppText>
        </View>
      ) : null}

      {isSale ? (
        <View style={styles.group}>
          <TextField
            label={t.unitPrice(unitWord(1, item.unit))}
            prefix="$"
            placeholder="0"
            value={price}
            onChangeText={(text) => setPriceText(formatPriceInput(text))}
            error={priceError}
            keyboardType="number-pad"
          />
          <TextField
            label={t.unitCost(unitWord(1, item.unit))}
            prefix="$"
            placeholder="0"
            value={cost}
            onChangeText={(text) => setCostText(formatPriceInput(text))}
            error={costError}
            keyboardType="number-pad"
          />
          {saleHint ? (
            <AppText variant="body" tone={losing ? 'danger' : 'secondary'} accessibilityLiveRegion="polite">
              {saleHint}
              {savedNote ? ` ${savedNote}` : ''}
            </AppText>
          ) : null}
        </View>
      ) : null}

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

// Vacío, el backend usaría el valor guardado: si el producto ya tiene uno, se pide escribirlo.
function amountError(text: string, amount: number | null, saved: number | null): string | undefined {
  if (text.trim() === '') return saved !== null ? messages.common.required : undefined;
  return amount === null ? messages.validation.number : undefined;
}

const styles = StyleSheet.create({
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  flexName: { flex: 1 },
  group: { gap: theme.spacing.md },
  total: {
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.field,
  },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: theme.spacing.md },
  totalAmount: { flexShrink: 1, fontFamily: theme.fonts.medium, fontSize: 32, lineHeight: 40, color: theme.colors.text },
  scannedRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: theme.spacing.md },
  detailLink: { minHeight: theme.minTouchSize, justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
  bold: { fontFamily: theme.fonts.bold, color: theme.colors.text },
  stock: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', columnGap: theme.spacing.sm },
  stockNumber: { fontFamily: theme.fonts.medium, fontSize: 64, lineHeight: 72, color: theme.colors.text },
  stockUnit: { marginBottom: theme.spacing.md, fontFamily: theme.fonts.medium },
});
