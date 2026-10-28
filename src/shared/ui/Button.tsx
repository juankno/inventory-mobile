import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { theme } from './theme';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Botón tipo píldora: negro (principal), gris claro (secundario) o rojo (eliminar).
export function Button({ label, onPress, variant = 'primary', icon, disabled, loading, style }: Props) {
  const isPrimary = variant === 'primary';
  const inactive = disabled || loading;
  const foreground = variant === 'secondary' ? theme.colors.ink : theme.colors.onInk;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && isPrimary && styles.primaryDisabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={22} color={foreground} /> : null}
          <AppText variant="title" style={[styles.label, { color: foreground }]} numberOfLines={1}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: theme.buttonHeight,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: theme.colors.ink },
  primaryDisabled: { backgroundColor: theme.colors.disabled },
  secondary: { backgroundColor: theme.colors.field },
  danger: { backgroundColor: theme.colors.dangerDot },
  pressed: { opacity: 0.85 },
  content: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  label: { fontFamily: theme.fonts.bold },
});
