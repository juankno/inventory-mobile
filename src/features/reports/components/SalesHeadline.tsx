import { StyleSheet, View } from 'react-native';

import { formatMoney } from '@/shared/format/dates';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { Icon } from '@/shared/ui/Icon';
import { theme } from '@/shared/ui/theme';
import type { SalesOverview } from '../api';
import { capitalize, comparisonName, trend } from '../chart';
import type { Comparison, PeriodPreset } from '../periods';

const t = messages.reports;

type Props = {
  overview: SalesOverview;
  preset: PeriodPreset;
  comparison: Comparison;
};

// La cifra que más importa, en grande, y si va mejor o peor que antes, en palabras.
export function SalesHeadline({ overview, preset, comparison }: Props) {
  const { current, previous } = overview;
  const name = comparisonName(comparison);
  const change = trend(current.total, previous.total);

  // La ganancia solo se muestra si alguna venta tenía costo; si no, sería un $0 engañoso.
  const details = [t.salesCount(current.sales)];
  if (overview.salesWithoutCost < current.sales) details.push(t.profit(formatMoney(current.profit)));

  return (
    <View style={styles.card} accessible>
      <AppText variant="lead">{t.soldIn[preset]}</AppText>
      <AppText maxFontSizeMultiplier={theme.maxFontScale.number} numberOfLines={1} adjustsFontSizeToFit style={styles.hero}>
        {formatMoney(current.total)}
      </AppText>
      <AppText variant="body" tone="secondary">
        {details.join(' · ')}
      </AppText>

      {change.direction === 'up' || change.direction === 'down' || change.direction === 'same' ? (
        <View style={styles.trend}>
          {change.direction !== 'same' ? (
            <View style={[styles.trendIcon, change.direction === 'up' ? styles.upIcon : styles.downIcon]}>
              <Icon
                name={change.direction === 'up' ? 'arrowUp' : 'arrowDown'}
                size={18}
                color={change.direction === 'up' ? theme.colors.success : theme.colors.dangerText}
              />
            </View>
          ) : null}
          <AppText variant="bodyStrong" style={styles.flex}>
            {change.direction === 'up'
              ? t.trendUp(change.percent, name)
              : change.direction === 'down'
                ? t.trendDown(change.percent, name)
                : t.trendSame(name)}
          </AppText>
        </View>
      ) : null}
      {change.direction === 'new' ? (
        <AppText variant="body" tone="secondary">
          {t.trendNew(capitalize(name))}
        </AppText>
      ) : change.direction !== 'none' ? (
        <AppText variant="body" tone="secondary">
          {t.previousTotal(capitalize(name), formatMoney(previous.total))}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.field,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  hero: { fontFamily: theme.fonts.semibold, fontSize: 48, lineHeight: 58, color: theme.colors.text },
  trend: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.xs },
  trendIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  upIcon: { backgroundColor: theme.colors.successBg },
  downIcon: { backgroundColor: theme.colors.dangerBg },
});
