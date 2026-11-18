import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState, type ReactNode } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { downloadReport, type ReportKind } from '@/features/reports/api';
import { visibleSeries } from '@/features/reports/chart';
import { InventoryHealth } from '@/features/reports/components/InventoryHealth';
import { SalesBarChart } from '@/features/reports/components/SalesBarChart';
import { SalesHeadline } from '@/features/reports/components/SalesHeadline';
import { TopProducts } from '@/features/reports/components/TopProducts';
import { useSalesOverview } from '@/features/reports/hooks/useSalesOverview';
import { comparisonFor, parseCustomPeriod, presetPeriod, type PeriodPreset } from '@/features/reports/periods';
import { isMockApi } from '@/shared/api/apiClient';
import { errorMessage } from '@/shared/api/errors';
import { visibleLoadError } from '@/shared/api/queryPolicy';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { ChipGroup } from '@/shared/ui/ChipGroup';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Banner } from '@/shared/ui/Feedback';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/IconButton';
import { PageLayout } from '@/shared/ui/PageLayout';
import { Skeleton } from '@/shared/ui/Skeleton';
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

// Reportes pensados para leerse de un vistazo: cuánto se vendió y si va mejor o peor
// que antes, cuándo se vendió más, qué se vende más y cómo está el inventario. El
// período elegido arriba sirve también para los reportes en Excel.
export default function ReportsScreen() {
  // La semana abre con varias barras para comparar y su propia comparación.
  const [preset, setPreset] = useState<PeriodPreset>('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [busy, setBusy] = useState<ReportKind | null>(null);
  const [error, setError] = useState<string>();

  // Un período a medio escribir no es un error hasta que estén las dos fechas.
  const custom = preset === 'custom' ? parseCustomPeriod(customFrom, customTo) : null;
  const period = preset === 'custom' ? (custom?.ok ? custom.period : null) : presetPeriod(preset);
  const periodError =
    custom && !custom.ok && customFrom.trim() && customTo.trim() ? t.periodErrors[custom.error] : undefined;
  const comparison = period ? comparisonFor(preset, period) : null;

  const overview = useSalesOverview(period, comparison?.period);
  const overviewError = visibleLoadError(overview);
  const data = overview.data;

  const share = async (kind: ReportKind) => {
    setError(undefined);
    if (kind !== 'inventory' && !period) {
      setError(periodError ?? t.periodErrors.invalidDate);
      return;
    }
    setBusy(kind);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        setError(messages.qr.shareUnavailable);
        return;
      }
      const uri = await downloadReport(kind, kind === 'inventory' ? null : period);
      await Sharing.shareAsync(uri, { mimeType: XLSX_TYPE, UTI: 'org.openxmlformats.spreadsheetml.sheet', dialogTitle: t.shareTitle });
    } catch (reason) {
      setError(errorMessage(reason, messages.errors.unexpected));
    } finally {
      setBusy(null);
    }
  };

  const reportCard = (kind: ReportKind, icon: IconName, title: string, body: string, action: string) => (
    <ReportCard icon={icon} title={title} body={body}>
      <Button
        label={action}
        icon="share"
        variant="secondary"
        loading={busy === kind}
        disabled={isMockApi || (busy !== null && busy !== kind)}
        onPress={() => void share(kind)}
      />
    </ReportCard>
  );

  const series = data ? visibleSeries(data.series, data.granularity) : [];

  return (
    <PageLayout
      left={<IconButton icon="chevronLeft" accessibilityLabel={messages.common.back} onPress={() => router.back()} />}
      title={t.title}
      refreshControl={
        <RefreshControl refreshing={overview.isRefetching} onRefresh={() => void overview.refetch()} tintColor={theme.colors.ink} />
      }
    >
      <View style={styles.group}>
        <AppText variant="label">{t.periodLabel}</AppText>
        <ChipGroup accessibilityLabel={t.periodLabel} options={periodOptions} value={preset} onChange={setPreset} />
        {preset === 'custom' ? (
          <View style={styles.dates}>
            <View style={styles.flex}>
              <TextField
                label={t.from}
                placeholder={t.datePlaceholder}
                value={customFrom}
                onChangeText={setCustomFrom}
                keyboardType="numbers-and-punctuation"
                error={periodError}
              />
            </View>
            <View style={styles.flex}>
              <TextField
                label={t.to}
                placeholder={t.datePlaceholder}
                value={customTo}
                onChangeText={setCustomTo}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
        ) : null}
      </View>

      {period && overview.isPending ? <Skeleton variant="stats" /> : null}
      {overviewError ? <Banner message={errorMessage(overviewError, messages.errors.loadFailed)} /> : null}

      {data && comparison ? (
        // Mientras llega el período nuevo, el anterior se ve atenuado.
        <View style={[styles.sections, overview.isPlaceholderData && styles.stale]}>
          <SalesHeadline overview={data} preset={preset} comparison={comparison} />
          {data.salesWithoutPrice > 0 ? (
            <AppText variant="body" tone="secondary">
              {t.withoutPrice(data.salesWithoutPrice)}
            </AppText>
          ) : null}
          {data.salesWithoutCost > 0 && data.salesWithoutCost < data.current.sales ? (
            <AppText variant="body" tone="secondary">
              {t.withoutCost(data.salesWithoutCost)}
            </AppText>
          ) : null}

          {data.current.sales === 0 ? (
            <EmptyState icon="chart" title={t.noSales} body={t.noSalesBody} />
          ) : (
            <>
              <Section title={t.chartTitle[data.granularity]}>
                <SalesBarChart key={`${data.from}-${data.to}`} series={series} granularity={data.granularity} />
              </Section>
              <Section title={t.topTitle}>
                <TopProducts products={data.topProducts} />
              </Section>
            </>
          )}

          {data.inventory.products > 0 ? (
            <Section title={t.stockTitle}>
              <InventoryHealth inventory={data.inventory} />
            </Section>
          ) : null}
        </View>
      ) : null}

      <View style={styles.group}>
        <AppText variant="heading" accessibilityRole="header" style={styles.excelTitle}>
          {t.excelTitle}
        </AppText>
        <AppText variant="body" tone="secondary">
          {t.excelIntro}
        </AppText>
      </View>
      {isMockApi ? <Banner tone="info" message={t.demoUnavailable} /> : null}
      {error ? <Banner message={error} /> : null}

      {reportCard('sales', 'chart', t.salesReportTitle, t.salesBody, t.salesAction)}
      {reportCard('movements', 'history', t.movementsReportTitle, t.movementsBody, t.movementsAction)}
      {reportCard('inventory', 'box', t.inventoryTitle, t.inventoryBody, t.inventoryAction)}
    </PageLayout>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

function ReportCard({ icon, title, body, children }: { icon: IconName; title: string; body: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Icon name={icon} />
        </View>
        <View style={styles.flex}>
          <AppText variant="title">{title}</AppText>
          <AppText variant="body" tone="secondary">
            {body}
          </AppText>
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  group: { gap: theme.spacing.md },
  sections: { gap: theme.spacing.lg },
  stale: { opacity: 0.5 },
  excelTitle: { marginTop: theme.spacing.md },
  card: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dates: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'flex-start' },
});
