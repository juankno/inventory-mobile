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
import {
  changeCustomPeriod,
  comparisonFor,
  defaultCustomPeriod,
  fromApiDate,
  presetPeriod,
  toApiDate,
  type PeriodPreset,
} from '@/features/reports/periods';
import { isMockApi } from '@/shared/api/apiClient';
import { errorMessage } from '@/shared/api/errors';
import { visibleLoadError } from '@/shared/api/queryPolicy';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { BottomSheet, SheetAction } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { ChipGroup } from '@/shared/ui/ChipGroup';
import { DateField } from '@/shared/ui/DateField';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Banner } from '@/shared/ui/Feedback';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/IconButton';
import { PageLayout } from '@/shared/ui/PageLayout';
import { Skeleton } from '@/shared/ui/Skeleton';
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
// que antes, cuándo se vendió más, qué se vende más y cómo está el inventario. Los
// reportes en Excel salen del botón de compartir de arriba y usan el mismo período.
export default function ReportsScreen() {
  // La semana abre con varias barras para comparar y su propia comparación.
  const [preset, setPreset] = useState<PeriodPreset>('week');
  // "Otro" arranca con los últimos 7 días; el calendario solo deja elegir períodos válidos.
  const [customPeriod, setCustomPeriod] = useState(() => defaultCustomPeriod());
  const [busy, setBusy] = useState<ReportKind | null>(null);
  const [error, setError] = useState<string>();
  const [exportOpen, setExportOpen] = useState(false);
  const closeExport = () => {
    // No se cierra a mitad de una descarga: la hoja muestra el progreso.
    if (busy) return;
    setExportOpen(false);
    setError(undefined);
  };

  const period = preset === 'custom' ? customPeriod : presetPeriod(preset);
  const comparison = comparisonFor(preset, period);
  const today = new Date();
  const changeDay = (field: 'from' | 'to') => (date: Date) =>
    setCustomPeriod((current) => changeCustomPeriod(current, field, toApiDate(date)));

  const overview = useSalesOverview(period, comparison.period);
  const overviewError = visibleLoadError(overview);
  const data = overview.data;

  const share = async (kind: ReportKind) => {
    setError(undefined);
    setBusy(kind);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        setError(messages.qr.shareUnavailable);
        return;
      }
      const uri = await downloadReport(kind, kind === 'inventory' ? null : period);
      // Se comparte con la hoja abierta (en iOS no se puede abrir el menú de compartir
      // mientras se cierra otra ventana) y se cierra al volver.
      await Sharing.shareAsync(uri, { mimeType: XLSX_TYPE, UTI: 'org.openxmlformats.spreadsheetml.sheet', dialogTitle: t.shareTitle });
      setExportOpen(false);
    } catch (reason) {
      setError(errorMessage(reason, messages.errors.unexpected));
    } finally {
      setBusy(null);
    }
  };

  const reportAction = (kind: ReportKind, icon: IconName, title: string, body: string) => (
    <SheetAction
      icon={icon}
      label={title}
      description={body}
      loading={busy === kind}
      disabled={isMockApi || (busy !== null && busy !== kind)}
      onPress={() => void share(kind)}
    />
  );

  const series = data ? visibleSeries(data.series, data.granularity) : [];
  const notes = data
    ? [
        data.salesWithoutPrice > 0 ? t.withoutPrice(data.salesWithoutPrice) : null,
        data.salesWithoutCost > 0 && data.salesWithoutCost < data.current.sales ? t.withoutCost(data.salesWithoutCost) : null,
      ].filter((note): note is string => note !== null)
    : [];

  return (
    <PageLayout
      left={<IconButton icon="chevronLeft" accessibilityLabel={messages.common.back} onPress={() => router.back()} />}
      title={t.title}
      right={<IconButton icon="share" accessibilityLabel={t.excelTitle} onPress={() => setExportOpen(true)} />}
      refreshControl={
        <RefreshControl refreshing={overview.isRefetching} onRefresh={() => void overview.refetch()} tintColor={theme.colors.ink} />
      }
    >
      <View style={styles.group}>
        <AppText variant="label">{t.periodLabel}</AppText>
        <ChipGroup accessibilityLabel={t.periodLabel} options={periodOptions} value={preset} onChange={setPreset} />
        {preset === 'custom' ? (
          <View style={styles.dates}>
            {/* Sin fechas futuras: todavía no hay ventas que mostrar. */}
            <View style={styles.flex}>
              <DateField label={t.from} value={fromApiDate(customPeriod.from)} maximumDate={today} onChange={changeDay('from')} />
            </View>
            <View style={styles.flex}>
              <DateField label={t.to} value={fromApiDate(customPeriod.to)} maximumDate={today} onChange={changeDay('to')} />
            </View>
          </View>
        ) : null}
      </View>

      {overview.isPending ? <Skeleton variant="stats" /> : null}
      {overviewError ? <Banner message={errorMessage(overviewError, messages.errors.loadFailed)} /> : null}

      {data ? (
        // Mientras llega el período nuevo, el anterior se ve atenuado.
        <View style={[styles.sections, overview.isPlaceholderData && styles.stale]}>
          <SalesHeadline overview={data} preset={preset} comparison={comparison} />
          {/* Avisos de datos incompletos, juntos y discretos bajo el total que afectan. */}
          {notes.length > 0 ? (
            <View style={styles.notes}>
              <Icon name="info" size={20} color={theme.colors.secondary} />
              <View style={styles.flex}>
                {notes.map((note) => (
                  <AppText key={note} variant="body" tone="secondary">
                    {note}
                  </AppText>
                ))}
              </View>
            </View>
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

      <BottomSheet visible={exportOpen} onClose={closeExport}>
        <View>
          <AppText variant="heading">{t.excelTitle}</AppText>
          <AppText variant="body" tone="secondary">
            {t.excelIntro}
          </AppText>
        </View>
        {isMockApi ? <Banner tone="info" message={t.demoUnavailable} /> : null}
        {error ? <Banner message={error} /> : null}
        {reportAction('sales', 'chart', t.salesReportTitle, t.salesBody)}
        {reportAction('movements', 'history', t.movementsReportTitle, t.movementsBody)}
        {reportAction('inventory', 'box', t.inventoryTitle, t.inventoryBody)}
        <Button label={messages.common.close} variant="secondary" disabled={busy !== null} onPress={closeExport} />
      </BottomSheet>
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  group: { gap: theme.spacing.md },
  sections: { gap: theme.spacing.lg },
  stale: { opacity: 0.5 },
  notes: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
  card: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dates: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'flex-start' },
});
