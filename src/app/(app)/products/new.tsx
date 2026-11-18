import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { ProductFormFields } from '@/features/products/components/ProductFormFields';
import { ProductSuggestionCard } from '@/features/products/components/ProductSuggestionCard';
import { useCreateProduct, useProductSuggestion } from '@/features/products/hooks/useProducts';
import {
  parseOptionalQuantity,
  parsePrice,
  productFormSchema,
  type ProductForm,
} from '@/features/products/schemas';
import { errorMessage } from '@/shared/api/errors';
import { parseQuantity } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { Banner, Tag } from '@/shared/ui/Feedback';
import { IconButton } from '@/shared/ui/IconButton';
import { PageLayout } from '@/shared/ui/PageLayout';
import { theme } from '@/shared/ui/theme';
import { useToast } from '@/shared/ui/Toast';
import { useDiscardGuard } from '@/shared/ui/useDiscardGuard';

const t = messages.productForm;

// Registro de producto con o sin código de barras (RF-05, RF-06, RF-16).
// Con ?code= viene del escáner (GTIN nuevo); sin código se le asigna un QR interno.
export default function NewProductScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const hasBarcode = !!code;
  const createMutation = useCreateProduct();
  const showToast = useToast();
  const suggestion = useProductSuggestion(hasBarcode ? code : undefined);
  const [suggestionChoice, setSuggestionChoice] = useState<'accepted' | 'rejected' | null>(null);
  const [introOpen, setIntroOpen] = useState(false);
  const { control, handleSubmit, formState, setValue } = useForm<ProductForm>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      unit: hasBarcode ? 'UNIT' : 'KILOGRAM',
      stock: '',
      requireStock: true,
      minStock: '',
      salePrice: '',
      costPrice: '',
    },
  });

  // Usar la sugerencia solo llena el nombre y la unidad; el resto lo escribe el usuario.
  const acceptSuggestion = () => {
    if (!suggestion.data) return;
    setValue('name', suggestion.data.name, { shouldDirty: true, shouldValidate: true });
    setValue('unit', suggestion.data.unit, { shouldDirty: true, shouldValidate: true });
    setSuggestionChoice('accepted');
  };

  const { allowLeave, discardSheet } = useDiscardGuard(formState.isDirty && !createMutation.isSuccess);

  const onSubmit = handleSubmit((form) =>
    createMutation.mutate(
      {
        name: form.name.trim(),
        unit: form.unit,
        code: hasBarcode ? code : undefined,
        stock: parseQuantity(form.stock) ?? 0,
        minStock: parseOptionalQuantity(form.minStock),
        salePrice: parsePrice(form.salePrice),
        costPrice: parsePrice(form.costPrice),
      },
      {
        onSuccess: (product) => {
          allowLeave();
          showToast({ message: messages.toast.productCreated });
          if (product.codeType === 'INTERNAL') {
            router.replace({ pathname: '/products/[id]/qr', params: { id: product.id, created: '1' } });
          } else {
            router.replace({ pathname: '/products/[id]', params: { id: product.id } });
          }
        },
      },
    ),
  );

  return (
    <PageLayout
      left={<IconButton icon="close" accessibilityLabel={messages.common.close} onPress={() => router.back()} />}
      title={t.newTitle}
      header={
        hasBarcode ? (
          // Con código, la explicación va detrás del ícono de información para dejarle
          // el espacio al formulario y a la sugerencia.
          <>
            <View style={styles.tagRow}>
              <Tag icon="check" label={t.codeRead(code)} style={styles.tagInRow} />
              <IconButton
                icon="info"
                accessibilityLabel={t.introToggle}
                active={introOpen}
                onPress={() => setIntroOpen((open) => !open)}
              />
            </View>
            {introOpen ? (
              <AppText variant="lead" tone="secondary" accessibilityLiveRegion="polite">
                {t.withCodeIntro}
              </AppText>
            ) : null}
          </>
        ) : (
          // Sin código se deja a la vista: avisa que al guardar se crea un QR para pegar.
          <>
            <Tag icon="qrCode" label={t.withoutCode} />
            <AppText variant="lead" tone="secondary">
              {t.withoutCodeIntro}
            </AppText>
          </>
        )
      }
      footer={
        <Button
          label={hasBarcode ? t.save : t.saveWithQr}
          onPress={onSubmit}
          loading={createMutation.isPending}
        />
      }
    >
      {createMutation.error ? (
        <Banner message={errorMessage(createMutation.error, messages.errors.unexpected)} />
      ) : null}
      {suggestion.data && suggestionChoice === null ? (
        <ProductSuggestionCard
          suggestion={suggestion.data}
          onAccept={acceptSuggestion}
          onReject={() => setSuggestionChoice('rejected')}
        />
      ) : null}
      {suggestionChoice === 'accepted' ? <Banner tone="info" message={t.suggestionUsed} /> : null}
      <ProductFormFields
        control={control}
        errors={formState.errors}
        mode="create"
        namePlaceholder={hasBarcode ? t.namePlaceholderCode : t.namePlaceholderBulk}
      />
      {discardSheet}
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  tagRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  // La etiqueta trae alignSelf: 'flex-start'; en la fila se centra con el ícono de información.
  tagInRow: { alignSelf: 'center', flexShrink: 1 },
});
