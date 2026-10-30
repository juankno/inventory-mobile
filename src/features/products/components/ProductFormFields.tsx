import { Controller, useWatch, type Control, type FieldErrors } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { allowsDecimals, formatNumber, parseQuantity, unitOptions, unitWord } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { ChipGroup } from '@/shared/ui/ChipGroup';
import { TextField } from '@/shared/ui/TextField';
import { theme } from '@/shared/ui/theme';
import { formatPriceInput, type ProductForm } from '../schemas';

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

  const priceField = (
    <Controller
      control={control}
      name="salePrice"
      render={({ field }) => (
        <TextField
          label={
            <AppText variant="label">
              {t.price}
              {mode === 'create' ? (
                <AppText variant="body" tone="secondary">{` ${messages.common.optional}`}</AppText>
              ) : null}
            </AppText>
          }
          prefix="$"
          placeholder="0"
          value={field.value}
          onChangeText={(text) => field.onChange(formatPriceInput(text))}
          onBlur={field.onBlur}
          error={errors.salePrice?.message}
          keyboardType="number-pad"
        />
      )}
    />
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
          {priceField}
        </>
      ) : (
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={styles.cell}>{minStockField}</View>
            <View style={styles.cell}>{priceField}</View>
          </View>
          {minStockHint}
        </View>
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
