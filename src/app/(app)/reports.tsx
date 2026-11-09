import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';

import { downloadReport, getSalesSummary, type ReportKind } from '@/features/reports/api';
import { parseCustomPeriod, presetPeriod, type PeriodPreset } from '@/features/reports/periods';
import { isMockApi } from '@/shared/api/apiClient';
import { errorMessage } from '@/shared/api/errors';
import { queryKeys } from '@/shared/api/queryKeys';
import { visibleLoadError } from '@/shared/api/queryPolicy';
import { formatMoney } from '@/shared/format/dates';
import { formatQuantity } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { ChipGroup } from '@/shared/ui/ChipGroup';
import { Banner } from '@/shared/ui/Feedback';
import { IconButton } from '@/shared/ui/IconButton';
import { PageLayout } from '@/shared/ui/PageLayout';
import { TextField } from '@/shared/ui/TextField';
import { theme } from '@/shared/ui/theme';

const t = messages.reports;

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const periodOptions: readonly { value: PeriodPreset; label: string }[] = [
  { value: 'today', label: t.periodToday },
  { value: 'week', label: t.periodWeek },
  { value: 'month', label: t.periodMonth },
  { value: 'lastMonth', label: t.periodLastMonth },
  { value: 'custom', label: t.periodCustom },
];

// Resumen de ventas y reportes en Excel para compartir.
export default function ReportsScreen() {
  const summary = useQuery({ queryKey: queryKeys.salesSummary, queryFn: getSalesSummary });
  const summaryError = visibleLoadError(summary);
  const [preset, setPreset] = useState<PeriodPreset>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [periodError, setPeriodError] = useState<string>();
  const [busy, setBusy] = useState<ReportKind | null>(null);
  const [error, setError] = useState<string>();

  const selectedPeriod = () => {
    if (preset !== 'custom') return presetPeriod(preset);
    const result = parseCustomPeriod(customFrom, customTo);
    if (result.ok) return result.period;
    setPeriodError(t.periodErrors[result.error]);
    return null;
  };

  const share = async (kind: ReportKind) => {
    setError(undefined);
    setPeriodError(undefined);
    const period = kind === 'inventory' ? null : selectedPeriod();
    if (kind !== 'inventory' && !period) return;
    setBusy(kind);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        setError(messages.qr.shareUnavailable);
        return;
      }
      const uri = await downloadReport(kind, period);
      await Sharing.shareAsync(uri, { mimeType: XLSX_TYPE, UTI: 'org.openxmlformats.spreadsheetml.sheet', dialogTitle: t.shareTitle });
    } catch (reason) {
      setError(errorMessage(reason, messages.errors.unexpected));
    } finally {
      setBusy(null);
    }
  };

  const downloadButton = (kind: ReportKind, label: string) => (
    <Button
      label={label}
      icon="share"
      variant="secondary"
      loading={busy === kind}
      disabled={isMockApi || (busy !== null && busy !== kind)}
      onPress={() => void share(kind)}
    />
  );

  const data = summary.data;

  return (
    <PageLayout
      left={<IconButton icon="chevronLeft" accessibilityLabel={messages.common.back} onPress={() => router.back()} />}
      title={t.title}
      refreshControl={
        <RefreshControl refreshing={summary.isRefetching} onRefresh={() => void summary.refetch()} tintColor={theme.colors.ink} />
      }
    >
      <AppText variant="heading" accessibilityRole="header">
        {t.salesTitle}
      </AppText>
      {summary.isPending ? <ActivityIndicator color={theme.colors.ink} /> : null}
      {summaryError ? <Banner message={errorMessage(summaryError, messages.errors.loadFailed)} /> : null}

      {data ? (
        <>
          <View style={styles.stats}>
            <Stat label={t.today} amount={data.today.total} sales={data.today.sales} />
            <Stat label={t.thisWeek} amount={data.week.total} sales={data.week.sales} />
          </View>
          {data.salesWithoutPrice > 0 ? (
            <AppText variant="body" tone="secondary">
              {t.withoutPrice(data.salesWithoutPrice)}
            </AppText>
          ) : null}

          <View style={styles.group}>
            <AppText variant="title" accessibilityRole="header">
              {t.topTitle}
            </AppText>
            {data.topProducts.length === 0 ? (
              <AppText variant="body" tone="secondary">
                {t.topEmpty}
              </AppText>
            ) : (
              data.topProducts.map((product, index) => (
                <View key={`${product.name}-${index}`} style={styles.topRow} accessible>
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong" numberOfLines={1}>
                      {`${index + 1}. ${product.name}`}
                    </AppText>
                    <AppText variant="body" tone="secondary">
                      {formatQuantity(product.quantity, product.unit)}
                    </AppText>
                  </View>
                  <AppText variant="bodyStrong">{formatMoney(product.total)}</AppText>
                </View>
              ))
            )}
          </View>
        </>
      ) : null}

      <AppText variant="heading" accessibilityRole="header" style={styles.excelTitle}>
        {t.excelTitle}
      </AppText>
      {isMockApi ? <Banner tone="info" message={t.demoUnavailable} /> : null}
      {error ? <Banner message={error} /> : null}

      <View style={styles.group}>
        <AppText variant="title">{t.inventoryTitle}</AppText>
        <AppText variant="body" tone="secondary">
          {t.inventoryBody}
        </AppText>
        {downloadButton('inventory', t.inventoryAction)}
      </View>

      <View style={styles.group}>
        <AppText variant="title">{t.periodTitle}</AppText>
        <ChipGroup
          accessibilityLabel={t.periodTitle}
          options={periodOptions}
          value={preset}
          onChange={(value) => {
            setPreset(value);
            setPeriodError(undefined);
          }}
        />
        {preset === 'custom' ? (
          <View style={styles.dates}>
            <View style={styles.flex}>
              <TextField
                label={t.from}
                placeholder={t.datePlaceholder}
                value={customFrom}
                onChangeText={(text) => {
                  setCustomFrom(text);
                  setPeriodError(undefined);
                }}
                keyboardType="numbers-and-punctuation"
                error={periodError}
              />
            </View>
            <View style={styles.flex}>
              <TextField
                label={t.to}
                placeholder={t.datePlaceholder}
                value={customTo}
                onChangeText={(text) => {
                  setCustomTo(text);
                  setPeriodError(undefined);
                }}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
        ) : null}
        <AppText variant="body" tone="secondary">
          {t.salesBody}
        </AppText>
        {downloadButton('sales', t.salesAction)}
        <AppText variant="body" tone="secondary">
          {t.movementsBody}
        </AppText>
        {downloadButton('movements', t.movementsAction)}
      </View>
    </PageLayout>
  );
}

function Stat({ label, amount, sales }: { label: string; amount: number; sales: number }) {
  return (
    <View style={styles.stat} accessible>
      <AppText variant="body" tone="secondary">
        {label}
      </AppText>
      <AppText variant="title" numberOfLines={1} adjustsFontSizeToFit>
        {formatMoney(amount)}
      </AppText>
      <AppText variant="body" tone="secondary">
        {t.salesCount(sales)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stats: { flexDirection: 'row', gap: theme.spacing.md },
  stat: {
    flex: 1,
    gap: 2,
    backgroundColor: theme.colors.field,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  group: { gap: theme.spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  excelTitle: { marginTop: theme.spacing.md },
  dates: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'flex-start' },
});
