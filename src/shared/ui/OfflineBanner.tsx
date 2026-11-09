import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatTimeAgo } from '@/shared/format/dates';
import { messages } from '@/shared/i18n/messages';
import { AppText } from './AppText';
import { theme } from './theme';

const ONE_MINUTE_MS = 60_000;

// Franja superior sin conexión. updatedAt es cuándo se cargaron los datos que se ven; 0 si no hay.
export function OfflineBanner({ updatedAt, paddingTop }: { updatedAt: number; paddingTop: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), ONE_MINUTE_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.banner, { paddingTop }]}>
      <AppText variant="caption" style={styles.text}>
        {updatedAt > 0 ? messages.offline.withData(formatTimeAgo(updatedAt, now)) : messages.offline.noData}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: theme.colors.warningBg, paddingBottom: theme.spacing.xs, paddingHorizontal: theme.spacing.md },
  text: { color: theme.colors.warningText, textAlign: 'center' },
});
