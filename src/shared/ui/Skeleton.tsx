import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { messages } from '@/shared/i18n/messages';
import { theme } from './theme';

// Opacidad que sube y baja mientras carga. Con "reducir movimiento" se queda quieta.
function usePulse() {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce || cancelled) return;
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      );
      animation.start();
    });
    return () => {
      cancelled = true;
      animation?.stop();
    };
  }, [opacity]);

  return opacity;
}

type Variant = 'card' | 'row' | 'stats';

type Props = {
  // card: filas con borde del inventario; row: filas del historial; stats: dos tarjetas de cifras.
  variant: Variant;
  count?: number;
};

// Forma gris del contenido que viene: la pantalla no salta cuando llega.
export function Skeleton({ variant, count = 3 }: Props) {
  const opacity = usePulse();
  const items = variant === 'stats' ? 1 : count;

  return (
    <Animated.View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={messages.common.loading}
      style={[styles.group, variant === 'card' && styles.cardGroup, { opacity }]}
    >
      {Array.from({ length: items }, (_, index) =>
        variant === 'stats' ? (
          <View key={index} style={styles.stats}>
            <Block style={styles.stat} />
            <Block style={styles.stat} />
          </View>
        ) : (
          <View key={index} style={variant === 'card' ? styles.card : styles.row}>
            <Block style={variant === 'card' ? styles.cardIcon : styles.rowIcon} />
            <View style={styles.lines}>
              <Block style={styles.title} />
              <Block style={styles.subtitle} />
            </View>
          </View>
        ),
      )}
    </Animated.View>
  );
}

function Block({ style }: { style: StyleProp<ViewStyle> }) {
  return <View style={[styles.block, style]} />;
}

const styles = StyleSheet.create({
  group: { gap: 0 },
  cardGroup: { gap: theme.spacing.sm },
  block: { backgroundColor: theme.colors.field, borderRadius: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.md },
  cardIcon: { width: 48, height: 48, borderRadius: 24 },
  rowIcon: { width: 44, height: 44, borderRadius: 22 },
  lines: { flex: 1, gap: theme.spacing.sm },
  title: { height: 18, width: '60%' },
  subtitle: { height: 14, width: '35%' },
  stats: { flexDirection: 'row', gap: theme.spacing.md },
  stat: { flex: 1, height: 130, borderRadius: theme.radius.lg },
});
