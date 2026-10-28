import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ProductFormFields } from '@/features/products/components/ProductFormFields';
import { useProduct, useUpdateProduct } from '@/features/products/hooks/useProducts';
import {
  parseOptionalQuantity,
  parsePrice,
  productFormSchema,
  type ProductForm,
} from '@/features/products/schemas';
import { errorMessage } from '@/shared/api/errors';
import type { Product } from '@/shared/api/types';
import { formatNumber, unitWord } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { Banner } from '@/shared/ui/Feedback';
import { Icon } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/IconButton';
import { PageLayout } from '@/shared/ui/PageLayout';
import { theme } from '@/shared/ui/theme';
import { useToast } from '@/shared/ui/Toast';
import { useDiscardGuard } from '@/shared/ui/useDiscardGuard';

const t = messages.productForm;

const toForm = (product: Product): ProductForm => ({
  name: product.name,
  unit: product.unit,
  stock: '',
  requireStock: false,
  minStock: product.minStock === null ? '' : String(product.minStock),
  // Pesos sin decimales: el punto del campo se lee como separador de miles.
  salePrice: product.salePrice === null ? '' : String(Math.round(product.salePrice)),
});

// Edición del producto (RF-07, RF-16). El código y las existencias no se editan aquí.
export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = useProduct(id);
  const updateMutation = useUpdateProduct(id);
  const showToast = useToast();
  const { control, handleSubmit, formState, reset } = useForm<ProductForm>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product.data ? toForm(product.data) : undefined,
  });

  // Carga los valores cuando el producto llega de la API (solo si no se ha editado nada).
  useEffect(() => {
    if (product.data && !formState.isDirty) reset(toForm(product.data));
  }, [product.data, formState.isDirty, reset]);

  const { allowLeave, discardSheet } = useDiscardGuard(formState.isDirty && !updateMutation.isSuccess);

  const close = <IconButton icon="close" accessibilityLabel={messages.common.close} onPress={() => router.back()} />;

  if (!product.data) {
    return (
      <PageLayout left={close} title={t.editTitle}>
        {product.error ? (
          <Banner message={errorMessage(product.error, messages.errors.loadFailed)} />
        ) : (
          <ActivityIndicator color={theme.colors.ink} />
        )}
      </PageLayout>
    );
  }

  const item = product.data;
  const [before, quantity, after] = t.stockLocked(`${formatNumber(item.stock)} ${unitWord(item.stock, item.unit)}`);

  const onSubmit = handleSubmit((form) =>
    updateMutation.mutate(
      {
        name: form.name.trim(),
        unit: form.unit,
        minStock: parseOptionalQuantity(form.minStock),
        salePrice: parsePrice(form.salePrice),
      },
      {
        onSuccess: () => {
          allowLeave();
          showToast({ message: messages.toast.productUpdated });
          router.back();
        },
      },
    ),
  );

  return (
    <PageLayout
      left={close}
      title={t.editTitle}
      header={
        <>
          <AppText variant="display">{item.name}</AppText>
          <View style={styles.locked}>
            <Icon name="lock" size={20} color={theme.colors.secondary} />
            <AppText variant="lead" tone="secondary" style={styles.flex}>
              {t.lockedCode(item.code)}
            </AppText>
          </View>
        </>
      }
      footer={<Button label={t.saveChanges} onPress={onSubmit} loading={updateMutation.isPending} />}
    >
      {updateMutation.error ? (
        <Banner message={errorMessage(updateMutation.error, messages.errors.unexpected)} />
      ) : null}
      <ProductFormFields control={control} errors={formState.errors} mode="edit" />

      <View style={styles.notice}>
        <AppText variant="lead" tone="secondary">
          {before}
          <AppText variant="lead" style={styles.bold}>
            {quantity}
          </AppText>
          {after}
        </AppText>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.replace({ pathname: '/products/[id]/movement', params: { id } })}
          style={styles.touch}
        >
          <AppText variant="bodyStrong" style={styles.link}>
            {t.registerMovement}
          </AppText>
        </Pressable>
      </View>
      {discardSheet}
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontFamily: theme.fonts.bold, color: theme.colors.text },
  locked: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  notice: {
    backgroundColor: theme.colors.field,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  touch: { alignSelf: 'flex-start', minHeight: theme.minTouchSize, justifyContent: 'center' },
  link: { textDecorationLine: 'underline', fontSize: theme.fontSize.lead },
});
