import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { theme } from './theme';

type Option<T extends string> = { value: T; label: string; count?: number };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

// Filtros en píldoras que se ajustan al texto, con su número de resultados.
// Se desplazan de lado si no caben en pantallas angostas. Se ven de 40 dp de
// alto, pero hitSlop completa los 48 dp de área táctil (RIU-02).
const CHIP_HEIGHT = 40;
const TOUCH_SLOP = (theme.minTouchSize - CHIP_HEIGHT) / 2;

export function FilterChips<T extends string>({ options, value, onChange, accessibilityLabel }: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={option.count === undefined ? option.label : `${option.label}: ${option.count}`}
            onPress={() => onChange(option.value)}
            hitSlop={{ top: TOUCH_SLOP, bottom: TOUCH_SLOP }}
            style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
          >
            <AppText variant="body" style={[styles.label, selected && styles.selectedText]}>
              {option.label}
            </AppText>
            {option.count === undefined ? null : (
              <View style={[styles.count, selected && styles.countSelected]}>
                <AppText variant="body" style={[styles.countText, selected && styles.selectedText]}>
                  {option.count}
                </AppText>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Espacio vertical para que el hitSlop no quede recortado por el ScrollView.
  row: { gap: theme.spacing.sm, paddingVertical: TOUCH_SLOP },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: CHIP_HEIGHT,
    paddingLeft: 14,
    paddingRight: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.field,
  },
  selected: { backgroundColor: theme.colors.ink },
  pressed: { opacity: 0.85 },
  label: { fontFamily: theme.fonts.medium },
  selectedText: { color: theme.colors.onInk },
  count: {
    minWidth: 26,
    minHeight: 28,
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  countText: { fontFamily: theme.fonts.semibold, lineHeight: 20 },
  countSelected: { backgroundColor: theme.colors.scannerButton },
});
