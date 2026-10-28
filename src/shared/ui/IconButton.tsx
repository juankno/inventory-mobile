import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { theme } from './theme';

type Props = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: 'light' | 'dark' | 'scanner';
  active?: boolean;
  badge?: number;
};

// Botón circular de 48 dp para la barra superior (volver, cerrar, menú, linterna…).
export function IconButton({ icon, onPress, accessibilityLabel, variant = 'light', active, badge }: Props) {
  const background =
    variant === 'dark' ? theme.colors.ink : variant === 'scanner' && !active ? theme.colors.scannerButton : theme.colors.surface;
  const color = variant === 'dark' || (variant === 'scanner' && !active) ? theme.colors.onInk : theme.colors.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={active === undefined ? undefined : { selected: active }}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.button, { backgroundColor: background }, pressed && styles.pressed]}
    >
      <Icon name={icon} size={24} color={color} />
      {badge ? (
        <View style={styles.badge}>
          <AppText variant="caption" tone="inverse" style={styles.badgeText} maxFontSizeMultiplier={theme.maxFontScale.number}>
            {badge > 99 ? '99+' : badge}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.8 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 22,
    minHeight: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: theme.colors.dangerDot,
    borderWidth: 2,
    borderColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: theme.fonts.bold, fontSize: 12, lineHeight: 14 },
});
