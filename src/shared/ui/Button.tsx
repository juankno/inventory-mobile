import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { theme } from './theme';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  // compact: 48 dp, el mínimo táctil, para acciones secundarias dentro de una tarjeta
  // que no deben pesar lo mismo que el botón principal de la pantalla.
  size?: 'default' | 'compact';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  // Para el lector de pantalla, si la etiqueta visible no basta ("Restaurar" qué).
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

// Botón tipo píldora: negro (principal), gris claro (secundario) o rojo (eliminar).
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'default',
  icon,
  disabled,
  loading,
  accessibilityLabel,
  style,
}: Props) {
  const compact = size === 'compact';
  const isPrimary = variant === 'primary';
  const inactive = disabled || loading;
  const foreground = variant === 'secondary' ? theme.colors.ink : theme.colors.onInk;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
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
          {icon ? <Icon name={icon} size={compact ? 20 : 22} color={foreground} /> : null}
          {/* Con letra grande del sistema, el botón compacto pasa a dos líneas en vez de cortar el texto. */}
          <AppText
            variant={compact ? 'body' : 'title'}
            style={[styles.label, compact && styles.compactLabel, { color: foreground }]}
            numberOfLines={compact ? 2 : 1}
          >
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
  compact: { minHeight: theme.minTouchSize, paddingHorizontal: theme.spacing.md },
  primary: { backgroundColor: theme.colors.ink },
  primaryDisabled: { backgroundColor: theme.colors.disabled },
  secondary: { backgroundColor: theme.colors.field },
  danger: { backgroundColor: theme.colors.dangerDot },
  pressed: { opacity: 0.85 },
  content: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  label: { fontFamily: theme.fonts.bold },
  compactLabel: { textAlign: 'center', flexShrink: 1 },
});
