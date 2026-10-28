import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { theme } from './theme';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

// Opciones en píldoras de tres por fila; la elegida va en negro.
export function ChipGroup<T extends string>({ options, value, onChange, accessibilityLabel }: Props<T>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={styles.group}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
          >
            <AppText
              variant="lead"
              style={[selected ? styles.selectedText : styles.text, styles.center]}
              numberOfLines={2}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: {
    width: '31.5%',
    minHeight: 52,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.field,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  selected: { backgroundColor: theme.colors.ink },
  pressed: { opacity: 0.85 },
  text: { fontFamily: theme.fonts.medium },
  center: { textAlign: 'center' },
  selectedText: { fontFamily: theme.fonts.bold, color: theme.colors.onInk },
});
