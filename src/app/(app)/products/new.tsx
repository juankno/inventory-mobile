import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';

import { ProductFormFields } from '@/features/products/components/ProductFormFields';
import { useCreateProduct } from '@/features/products/hooks/useProducts';
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

const t = messages.productForm;

// Registro de producto con o sin código de barras (RF-05, RF-06, RF-16).
// Con ?code= viene del escáner (GTIN nuevo); sin código se le asigna un QR interno.
export default function NewProductScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const hasBarcode = !!code;
  const createMutation = useCreateProduct();
  const { control, handleSubmit, formState } = useForm<ProductForm>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      unit: hasBarcode ? 'UNIT' : 'KILOGRAM',
      stock: '',
      requireStock: true,
      minStock: '',
      salePrice: '',
    },
  });

  const onSubmit = handleSubmit((form) =>
    createMutation.mutate(
      {
        name: form.name.trim(),
        unit: form.unit,
        codeType: hasBarcode ? 'GTIN' : 'INTERNAL',
        code: hasBarcode ? code : undefined,
        initialStock: parseQuantity(form.stock) ?? 0,
        minStock: parseOptionalQuantity(form.minStock),
        salePrice: parsePrice(form.salePrice),
      },
      {
        onSuccess: (product) =>
          product.codeType === 'INTERNAL'
            ? router.replace({ pathname: '/products/[id]/qr', params: { id: product.id, created: '1' } })
            : router.replace({ pathname: '/products/[id]', params: { id: product.id } }),
      },
    ),
  );

  return (
    <PageLayout
      left={<IconButton icon="close" accessibilityLabel={messages.common.close} onPress={() => router.back()} />}
      title={t.newTitle}
      header={
        <>
          {hasBarcode ? <Tag icon="check" label={t.codeRead(code)} /> : <Tag icon="qrCode" label={t.withoutCode} />}
          <AppText variant="lead" tone="secondary">
            {hasBarcode ? t.withCodeIntro : t.withoutCodeIntro}
          </AppText>
        </>
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
      <ProductFormFields
        control={control}
        errors={formState.errors}
        mode="create"
        namePlaceholder={hasBarcode ? t.namePlaceholderCode : t.namePlaceholderBulk}
      />
    </PageLayout>
  );
}
