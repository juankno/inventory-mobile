import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';

import { MovementHistory } from '@/features/movements/components/MovementHistory';
import { useMovements } from '@/features/movements/hooks/useMovements';
import { useDeleteProduct, useProduct } from '@/features/products/hooks/useProducts';
import { errorMessage } from '@/shared/api/errors';
import type { MovementType } from '@/shared/api/types';
import { formatMoney } from '@/shared/format/dates';
import { stockStatus, stockStatusLabel } from '@/shared/format/stock';
import { formatNumber, formatQuantity, unitLabel, unitWord } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { BottomSheet, SheetAction } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { Banner, StatusBadge } from '@/shared/ui/Feedback';
import { IconButton } from '@/shared/ui/IconButton';
import { PageLayout } from '@/shared/ui/PageLayout';
import { theme } from '@/shared/ui/theme';
import { useToast } from '@/shared/ui/Toast';

const t = messages.product;

// Detalle, existencia e historial del producto (RF-08, RF-15).
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = useProduct(id);
  const movements = useMovements(id);
  const deleteMutation = useDeleteProduct(id);
  const showToast = useToast();
  // Una sola hoja inferior que muestra las opciones o la confirmación de eliminar.
  const [sheet, setSheet] = useState<'options' | 'confirmDelete' | null>(null);
  const closeSheet = () => {
    setSheet(null);
    deleteMutation.reset();
  };

  const back = <IconButton icon="chevronLeft" accessibilityLabel={messages.common.back} onPress={() => router.back()} />;

  if (!product.data) {
    return (
      <PageLayout left={back} title={t.title}>
        {product.error ? (
          <Banner message={errorMessage(product.error, messages.errors.loadFailed)} />
        ) : (
          <ActivityIndicator color={theme.colors.ink} />
        )}
      </PageLayout>
    );
  }

  const item = product.data;
  const status = stockStatus(item);
  const registerMovement = (type: MovementType) =>
    router.push({ pathname: '/products/[id]/movement', params: { id, type } });
  const openFromMenu = (path: '/products/[id]/edit' | '/products/[id]/qr') => {
    setSheet(null);
    router.push({ pathname: path, params: { id } });
  };

  return (
    <PageLayout
      left={back}
      title={t.title}
      right={<IconButton icon="more" accessibilityLabel={t.options} onPress={() => setSheet('options')} />}
      header={
        <>
          <AppText variant="display" accessibilityRole="header">
            {item.name}
          </AppText>
          <AppText variant="lead" tone="secondary" selectable>
            {item.codeType === 'GTIN' ? t.barcode(item.code) : t.internalCode(item.code)}
          </AppText>
          <View style={styles.stockLabel}>
            <AppText variant="lead" tone="secondary">
              {t.stock}
            </AppText>
            {status === 'ok' ? null : (
              <StatusBadge label={stockStatusLabel[status]} tone={status === 'out' ? 'danger' : 'warning'} />
            )}
          </View>
          <View style={styles.stock}>
            <AppText maxFontSizeMultiplier={theme.maxFontScale.number} style={styles.stockNumber}>{formatNumber(item.stock)}</AppText>
            <AppText variant="heading" tone="secondary" style={styles.stockUnit}>
              {unitWord(item.stock, item.unit)}
            </AppText>
          </View>
        </>
      }
      refreshControl={
        <RefreshControl
          refreshing={product.isRefetching || movements.isRefetching}
          onRefresh={() => {
            void product.refetch();
            void movements.refetch();
          }}
          tintColor={theme.colors.ink}
        />
      }
    >
      <View style={styles.facts}>
        <Fact label={t.unit} value={unitLabel(item.unit)} />
        <Fact label={t.minimum} value={item.minStock === null ? t.noValue : formatQuantity(item.minStock, item.unit)} />
        <Fact label={t.price} value={item.salePrice === null ? t.noValue : formatMoney(item.salePrice)} />
      </View>

      <View style={styles.actions}>
        <Button label={t.inbound} icon="plus" onPress={() => registerMovement('INBOUND')} style={styles.flex} />
        <Button
          label={t.outbound}
          icon="minus"
          variant="secondary"
          onPress={() => registerMovement('OUTBOUND')}
          style={styles.flex}
        />
      </View>

      <AppText variant="heading" accessibilityRole="header">
        {t.history}
      </AppText>
      {movements.error ? <Banner message={errorMessage(movements.error, messages.errors.loadFailed)} /> : null}
      {movements.data ? (
        <MovementHistory movements={movements.data} unit={item.unit} />
      ) : movements.isPending ? (
        <ActivityIndicator color={theme.colors.ink} />
      ) : null}

      <BottomSheet visible={sheet !== null} onClose={closeSheet}>
        {sheet === 'confirmDelete' ? (
          <>
            <AppText variant="heading">{t.deleteTitle(item.name)}</AppText>
            <AppText variant="lead" tone="secondary">
              {t.deleteBody}
            </AppText>
            {deleteMutation.error ? (
              <Banner message={errorMessage(deleteMutation.error, messages.errors.unexpected)} />
            ) : null}
            <Button
              label={t.deleteConfirm}
              variant="danger"
              icon="trash"
              loading={deleteMutation.isPending}
              onPress={() =>
                deleteMutation.mutate(undefined, {
                  onSuccess: () => {
                    setSheet(null);
                    showToast({ message: messages.toast.productDeleted });
                    router.dismissTo('/');
                  },
                })
              }
            />
            <Button label={messages.common.cancel} variant="secondary" onPress={closeSheet} />
          </>
        ) : (
          <>
            <AppText variant="heading">{item.name}</AppText>
            <SheetAction icon="pencil" label={t.edit} onPress={() => openFromMenu('/products/[id]/edit')} />
            {item.codeType === 'INTERNAL' ? (
              <SheetAction icon="qrCode" label={t.viewQr} onPress={() => openFromMenu('/products/[id]/qr')} />
            ) : null}
            <SheetAction icon="trash" label={t.delete} destructive onPress={() => setSheet('confirmDelete')} />
            <Button label={messages.common.close} variant="secondary" onPress={closeSheet} />
          </>
        )}
      </BottomSheet>
    </PageLayout>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <AppText variant="caption" tone="secondary">
        {label}
      </AppText>
      <AppText variant="title" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stockLabel: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginTop: theme.spacing.sm },
  stock: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', columnGap: theme.spacing.sm },
  stockNumber: { fontFamily: theme.fonts.medium, fontSize: 72, lineHeight: 80, color: theme.colors.text },
  stockUnit: { marginBottom: theme.spacing.md, fontFamily: theme.fonts.medium },
  facts: { flexDirection: 'row', gap: theme.spacing.sm },
  fact: {
    flex: 1,
    backgroundColor: theme.colors.field,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    gap: 2,
  },
  actions: { flexDirection: 'row', gap: theme.spacing.md },
});
