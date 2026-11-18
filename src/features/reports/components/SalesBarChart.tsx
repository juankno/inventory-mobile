import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import { formatMoney } from '@/shared/format/dates';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { theme } from '@/shared/ui/theme';
import type { SeriesGranularity, SeriesPoint } from '../api';
import { axisLabel, bestIndex, bucketName, compactMoney, niceMax } from '../chart';

const t = messages.reports;

const PLOT_HEIGHT = 160;
// Barras finas con aire entre ellas: nunca más de 24 px de ancho, y 2 px de separación.
const MAX_BAR_WIDTH = 24;
const MIN_GAP = 2;
const CORNER = 4;
// Cuántas etiquetas caben en el eje sin encimarse.
const MAX_AXIS_LABELS = 5;
const AXIS_LABEL_WIDTH = 72;

type Props = {
  series: SeriesPoint[];
  granularity: SeriesGranularity;
};

// Barra con el extremo de arriba redondeado y la base recta, sobre la línea de base.
function barPath(x: number, width: number, height: number): string {
  const r = Math.min(CORNER, width / 2, height);
  const top = PLOT_HEIGHT - height;
  return [
    `M ${x} ${PLOT_HEIGHT}`,
    `V ${top + r}`,
    `Q ${x} ${top} ${x + r} ${top}`,
    `H ${x + width - r}`,
    `Q ${x + width} ${top} ${x + width} ${top + r}`,
    `V ${PLOT_HEIGHT}`,
    'Z',
  ].join(' ');
}

// Cómo se repartieron las ventas en el período. Arranca mostrando el valor más alto;
// al tocar una barra se ve el de esa barra.
export function SalesBarChart({ series, granularity }: Props) {
  const [width, setWidth] = useState(0);
  const best = bestIndex(series);
  const [selected, setSelected] = useState<number | null>(best);

  const max = niceMax(Math.max(...series.map((point) => point.total)));
  const slot = width / series.length;
  const barWidth = Math.max(1, Math.min(MAX_BAR_WIDTH, slot - MIN_GAP, slot * 0.7));
  const labelEvery = Math.ceil(series.length / MAX_AXIS_LABELS);
  const salesText = (point: SeriesPoint) => t.salesCount(point.sales);
  const current = selected === null ? null : series[selected];

  return (
    <View style={styles.container}>
      <View style={styles.detail} accessibilityLiveRegion="polite">
        {current ? (
          <>
            <AppText variant="label" tone="secondary">
              {selected === best ? t.chartBest : bucketName(current.start, granularity)}
            </AppText>
            <AppText variant="title">
              {selected === best ? `${bucketName(current.start, granularity)} · ` : ''}
              {formatMoney(current.total)}
            </AppText>
            <AppText variant="body" tone="secondary">
              {salesText(current)}
            </AppText>
          </>
        ) : null}
      </View>

      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {/* Escala: la mitad y el tope, en líneas finas que no compiten con las barras. */}
        <View style={styles.plot}>
          {width > 0 ? (
            <Svg width={width} height={PLOT_HEIGHT}>
              {[max / 2, max].map((value) => {
                const y = PLOT_HEIGHT - (value / max) * PLOT_HEIGHT + 0.5;
                return <Line key={value} x1={0} x2={width} y1={y} y2={y} stroke={theme.colors.border} strokeWidth={1} />;
              })}
              <Line x1={0} x2={width} y1={PLOT_HEIGHT - 0.5} y2={PLOT_HEIGHT - 0.5} stroke={theme.colors.disabled} strokeWidth={1} />
              {series.map((point, index) => {
                if (point.total <= 0) return null;
                const height = Math.max(2, (point.total / max) * PLOT_HEIGHT);
                const x = index * slot + (slot - barWidth) / 2;
                return (
                  <Path
                    key={point.start}
                    d={barPath(x, barWidth, height)}
                    fill={index === selected ? theme.colors.ink : theme.colors.muted}
                  />
                );
              })}
            </Svg>
          ) : null}
          {[max, max / 2].map((value) => (
            <AppText
              key={value}
              variant="caption"
              tone="secondary"
              style={[styles.scaleLabel, { top: PLOT_HEIGHT - (value / max) * PLOT_HEIGHT - 24 }]}
              importantForAccessibility="no"
            >
              {compactMoney(value)}
            </AppText>
          ))}
          {/* Zonas táctiles de alto completo: más grandes que la barra para acertar con el dedo. */}
          {width > 0
            ? series.map((point, index) => (
                <Pressable
                  key={point.start}
                  accessibilityRole="button"
                  accessibilityState={{ selected: index === selected }}
                  accessibilityLabel={t.barLabel(bucketName(point.start, granularity), formatMoney(point.total), salesText(point))}
                  onPress={() => setSelected(index)}
                  style={[styles.hit, { left: index * slot, width: slot }]}
                />
              ))
            : null}
        </View>

        <View style={styles.axis} importantForAccessibility="no-hide-descendants">
          {width > 0
            ? series.map((point, index) =>
                index % labelEvery === 0 ? (
                  <AppText
                    key={point.start}
                    variant="caption"
                    tone="secondary"
                    numberOfLines={1}
                    style={[
                      styles.axisLabel,
                      // Centrada bajo su barra, sin salirse por los bordes.
                      { left: Math.min(Math.max(index * slot + slot / 2 - AXIS_LABEL_WIDTH / 2, 0), width - AXIS_LABEL_WIDTH) },
                    ]}
                  >
                    {axisLabel(point.start, granularity, series.length)}
                  </AppText>
                ) : null,
              )
            : null}
        </View>
      </View>

      <AppText variant="caption" tone="secondary">
        {t.chartHint}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing.md },
  detail: { minHeight: 88, gap: 2 },
  // Espacio arriba para la etiqueta del tope de la escala.
  plot: { height: PLOT_HEIGHT, marginTop: 24 },
  scaleLabel: { position: 'absolute', left: 0 },
  hit: { position: 'absolute', top: 0, height: PLOT_HEIGHT },
  axis: { height: 28, marginTop: theme.spacing.xs },
  axisLabel: { position: 'absolute', width: AXIS_LABEL_WIDTH, textAlign: 'center' },
});
