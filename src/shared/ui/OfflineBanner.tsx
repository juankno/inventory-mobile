import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatTimeAgo } from '@/shared/format/dates';
import { messages } from '@/shared/i18n/messages';
import { AppText } from './AppText';
import { theme } from './theme';

const ONE_MINUTE_MS = 60_000;

type Props = {
  // offline: el celular no tiene red. unreachable: tiene red, pero la API no responde.
  reason: 'offline' | 'unreachable';
  // Cuándo se cargaron los datos que se ven; 0 si no hay.
  updatedAt: number;
  paddingTop: number;
};

// Franja superior cuando no se pueden actualizar los datos.
export function OfflineBanner({ reason, updatedAt, paddingTop }: Props) {
  const t = messages.offline[reason];
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), ONE_MINUTE_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.banner, { paddingTop }]}>
      <AppText variant="caption" style={styles.text}>
        {updatedAt > 0 ? t.withData(formatTimeAgo(updatedAt, now)) : t.noData}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: theme.colors.warningBg, paddingBottom: theme.spacing.xs, paddingHorizontal: theme.spacing.md },
  text: { color: theme.colors.warningText, textAlign: 'center' },
});
