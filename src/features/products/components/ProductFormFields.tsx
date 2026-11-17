import { Controller, useWatch, type Control, type FieldErrors } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { formatMoney } from '@/shared/format/dates';
import { allowsDecimals, formatNumber, parseQuantity, unitOptions, unitWord } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { ChipGroup } from '@/shared/ui/ChipGroup';
import { TextField } from '@/shared/ui/TextField';
import { theme } from '@/shared/ui/theme';
import { formatPriceInput, parsePrice, type ProductForm } from '../schemas';

type Props = {
  control: Control<ProductForm>;
  errors: FieldErrors<ProductForm>;
  mode: 'create' | 'edit';
  namePlaceholder?: string;
};

const t = messages.productForm;

// Campos del producto (diseños "Producto nuevo" y "Editar producto").
// Al crear se piden las existencias de hoy; al editar no, porque solo cambian con movimientos.
export function ProductFormFields({ control, errors, mode, namePlaceholder }: Props) {
  const unit = useWatch({ control, name: 'unit' });
  const minStock = useWatch({ control, name: 'minStock' });
  const salePrice = parsePrice(useWatch({ control, name: 'salePrice' }));
  const costPrice = parsePrice(useWatch({ control, name: 'costPrice' }));
  const decimals = allowsDecimals(unit);
  const minValue = parseQuantity(minStock);

  const minStockField = (
    <Controller
      control={control}
      name="minStock"
      render={({ field }) => (
        <TextField
          label={t.minStock}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={errors.minStock?.message}
          keyboardType={decimals ? 'decimal-pad' : 'number-pad'}
        />
      )}
    />
  );

  // Costo y precio en pesos, con puntos de miles mientras se escribe.
  const moneyField = (name: 'salePrice' | 'costPrice', label: string) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField
          label={label}
          prefix="$"
          placeholder="0"
          value={field.value}
          onChangeText={(text) => field.onChange(formatPriceInput(text))}
          onBlur={field.onBlur}
          error={errors[name]?.message}
          keyboardType="number-pad"
        />
      )}
    />
  );

  // Con costo y precio se muestra cuánto se gana por unidad; si no, que son opcionales.
  const margin = salePrice !== null && costPrice !== null ? salePrice - costPrice : null;
  const unitName = unitWord(1, unit);
  const pricesHint =
    margin === null || errors.salePrice || errors.costPrice
      ? t.pricesHint
      : margin >= 0
        ? t.margin(formatMoney(margin), unitName)
        : t.loss(formatMoney(-margin), unitName);

  const pricesGroup = (
    <View style={styles.group}>
      <View style={styles.row}>
        <View style={styles.cell}>{moneyField('costPrice', t.cost)}</View>
        <View style={styles.cell}>{moneyField('salePrice', t.price)}</View>
      </View>
      <AppText
        variant="caption"
        tone={margin !== null && margin < 0 ? 'danger' : 'secondary'}
        style={styles.hint}
        accessibilityLiveRegion="polite"
      >
        {pricesHint}
      </AppText>
    </View>
  );

  const minStockHint =
    minValue !== null && !errors.minStock ? (
      <AppText variant="caption" tone="secondary" style={styles.hint}>
        {t.minStockHint(formatNumber(minValue), unitWord(minValue, unit))}
      </AppText>
    ) : (
      <AppText variant="caption" tone="secondary" style={styles.hint}>
        {t.minStockEmpty}
      </AppText>
    );

  return (
    <>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextField
            label={t.name}
            placeholder={namePlaceholder}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.name?.message}
            maxLength={80}
            autoCapitalize="sentences"
          />
        )}
      />

      <View style={styles.group}>
        <AppText variant="label">{t.unit}</AppText>
        <Controller
          control={control}
          name="unit"
          render={({ field }) => (
            <ChipGroup
              accessibilityLabel={t.unit}
              options={unitOptions}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </View>

      {mode === 'create' ? (
        <>
          <View style={styles.group}>
            <View style={styles.row}>
              <View style={styles.cell}>
                <Controller
                  control={control}
                  name="stock"
                  render={({ field }) => (
                    <TextField
                      label={t.stock}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.stock?.message}
                      keyboardType={decimals ? 'decimal-pad' : 'number-pad'}
                    />
                  )}
                />
              </View>
              <View style={styles.cell}>{minStockField}</View>
            </View>
            {minStockHint}
          </View>
          {pricesGroup}
        </>
      ) : (
        <>
          <View style={styles.group}>
            {minStockField}
            {minStockHint}
          </View>
          {pricesGroup}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  group: { gap: theme.spacing.md },
  row: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'flex-start' },
  cell: { flex: 1 },
  hint: { paddingHorizontal: theme.spacing.sm, marginTop: -theme.spacing.sm },
});
