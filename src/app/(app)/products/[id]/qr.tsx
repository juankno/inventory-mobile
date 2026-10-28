import * as Print from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, type ViewInstance } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';

import { useProduct } from '@/features/products/hooks/useProducts';
import { errorMessage } from '@/shared/api/errors';
import { unitMeasure } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { Banner } from '@/shared/ui/Feedback';
import { IconButton } from '@/shared/ui/IconButton';
import { PageLayout } from '@/shared/ui/PageLayout';
import { theme } from '@/shared/ui/theme';

const t = messages.qr;

type QrSvg = { toDataURL: (callback: (base64: string) => void) => void };

// Escapa el nombre antes de ponerlo en el HTML de impresión.
const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

// Ver, compartir e imprimir la etiqueta QR (RF-10).
export default function ProductQrScreen() {
  const { id, created } = useLocalSearchParams<{ id: string; created?: string }>();
  const product = useProduct(id);
  const labelRef = useRef<ViewInstance>(null);
  const qrRef = useRef<QrSvg | null>(null);
  const [busy, setBusy] = useState<'share' | 'print' | null>(null);
  const [error, setError] = useState<string>();

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

  const share = async () => {
    setError(undefined);
    setBusy('share');
    try {
      if (!(await Sharing.isAvailableAsync())) {
        setError(t.shareUnavailable);
        return;
      }
      const uri = await captureRef(labelRef, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: item.name });
    } catch {
      setError(messages.errors.unexpected);
    } finally {
      setBusy(null);
    }
  };

  const print = () => {
    setError(undefined);
    if (!qrRef.current) return;
    setBusy('print');
    qrRef.current.toDataURL((base64) => {
      const name = escapeHtml(item.name);
      const html = `<html><body style="font-family: sans-serif; text-align: center; padding-top: 32px;">
        <div style="display: inline-block; border: 1px dashed #999; border-radius: 16px; padding: 24px;">
          <img src="data:image/png;base64,${base64}" style="width: 220px; height: 220px;" />
          <p style="font-size: 20px; font-weight: bold; margin: 12px 0 4px;">${name}</p>
          <p style="font-size: 12px; color: #555; margin: 0;">${item.code}</p>
        </div>
      </body></html>`;
      Print.printAsync({ html })
        .catch(() => undefined) // Cancelar la impresión también rechaza la promesa.
        .finally(() => setBusy(null));
    });
  };

  return (
    <PageLayout
      left={back}
      title={t.title}
      header={
        <>
          <AppText variant="display">{item.name}</AppText>
          <AppText variant="lead" tone="secondary">
            {[created ? t.created : null, t.measuredBy(unitMeasure(item.unit))].filter(Boolean).join(' · ')}
          </AppText>
          {item.codeType === 'INTERNAL' ? (
            <View style={styles.labelArea}>
              <View ref={labelRef} collapsable={false} style={styles.label}>
                <QRCode
                  value={item.code}
                  size={200}
                  backgroundColor="#FFFFFF"
                  color={theme.colors.ink}
                  getRef={(ref: QrSvg | null) => {
                    qrRef.current = ref;
                  }}
                />
                <AppText variant="title" style={styles.labelName} numberOfLines={2}>
                  {item.name}
                </AppText>
                <AppText variant="caption" tone="secondary">
                  {item.code}
                </AppText>
              </View>
            </View>
          ) : null}
        </>
      }
      footer={
        item.codeType === 'INTERNAL' ? (
          <View style={styles.actions}>
            <Button
              label={t.share}
              icon="share"
              variant="secondary"
              onPress={() => void share()}
              loading={busy === 'share'}
              style={styles.flex}
            />
            <Button label={t.print} icon="printer" onPress={print} loading={busy === 'print'} style={styles.flex} />
          </View>
        ) : null
      }
    >
      {error ? <Banner message={error} /> : null}
      <AppText variant="lead" tone="secondary">
        {item.codeType === 'INTERNAL' ? t.instructions : t.gtinNotice}
      </AppText>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  labelArea: { alignItems: 'center', paddingVertical: theme.spacing.xl },
  label: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sheet,
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  labelName: { marginTop: theme.spacing.md, textAlign: 'center', fontFamily: theme.fonts.bold, maxWidth: 220 },
  actions: { flexDirection: 'row', gap: theme.spacing.md },
});
