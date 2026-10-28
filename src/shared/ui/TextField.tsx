import { forwardRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { useScrollToFocusedInput } from './PageLayout';
import { theme } from './theme';

type Props = TextInputProps & {
  label?: ReactNode;
  error?: string;
  hint?: string;
  prefix?: string;
  secureToggle?: boolean;
};

// Campo de texto tipo píldora con etiqueta, ayuda y mensaje de error.
export const TextField = forwardRef<TextInputInstance, Props>(function TextField(
  { label, error, hint, prefix, secureToggle, secureTextEntry, style, onFocus, ...props },
  ref,
) {
  const [hidden, setHidden] = useState(true);
  const isSecure = secureToggle ? hidden : secureTextEntry;
  const scrollToFocused = useScrollToFocusedInput();

  return (
    <View style={styles.container}>
      {label ? (
        typeof label === 'string' ? <AppText variant="label">{label}</AppText> : label
      ) : null}
      <View style={[styles.field, !!error && styles.fieldError]}>
        {prefix ? (
          <AppText variant="bodyStrong" tone="secondary" style={styles.prefix}>
            {prefix}
          </AppText>
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.muted}
          secureTextEntry={isSecure}
          style={[styles.input, style]}
          aria-invalid={!!error}
          onFocus={(event) => {
            onFocus?.(event);
            scrollToFocused?.();
          }}
          {...props}
        />
        {secureToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            onPress={() => setHidden((value) => !value)}
            style={styles.toggle}
            hitSlop={8}
          >
            <Icon name={hidden ? 'eye' : 'eyeOff'} color={theme.colors.secondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="secondary">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: theme.spacing.sm, flexShrink: 1 },
  field: {
    minHeight: theme.controlHeight,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.field,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  fieldError: { borderColor: theme.colors.dangerDot },
  prefix: { marginRight: theme.spacing.sm },
  input: {
    flex: 1,
    minHeight: theme.controlHeight - 4,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.lead,
    color: theme.colors.text,
    paddingVertical: 0,
  },
  toggle: { marginLeft: theme.spacing.sm, padding: 4 },
});
