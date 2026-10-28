import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from './Icon';
import { theme } from './theme';

type Props = {
  value: string;
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  allowDecimals?: boolean;
  accessibilityLabel: string;
};

// Cantidad con botones − y +; el número también se puede escribir.
export function QuantityStepper({ value, onChange, step = 1, min = 0, allowDecimals, accessibilityLabel }: Props) {
  const current = Number(value.replace(',', '.'));
  const numeric = Number.isFinite(current) ? current : 0;
  const canDecrease = numeric - step >= min;

  const change = (delta: number) => {
    const next = Math.max(min, Math.round((numeric + delta) * 100) / 100);
    onChange(String(next));
  };

  const handleText = (text: string) => {
    const cleaned = allowDecimals ? text.replace(/[^\d.,]/g, '') : text.replace(/\D/g, '');
    onChange(cleaned);
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Restar"
        disabled={!canDecrease}
        onPress={() => change(-step)}
        style={({ pressed }) => [styles.button, styles.minus, (!canDecrease || pressed) && styles.dimmed]}
      >
        <Icon name="minus" size={28} />
      </Pressable>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={handleText}
        keyboardType={allowDecimals ? 'decimal-pad' : 'number-pad'}
        style={styles.input}
        selectTextOnFocus
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sumar"
        onPress={() => change(step)}
        style={({ pressed }) => [styles.button, styles.plus, pressed && styles.dimmed]}
      >
        <Icon name="plus" size={28} color={theme.colors.onInk} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.field,
    borderRadius: theme.radius.pill,
    padding: 10,
  },
  button: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  minus: { backgroundColor: theme.colors.surface },
  plus: { backgroundColor: theme.colors.ink },
  dimmed: { opacity: 0.5 },
  input: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.fonts.semibold,
    fontSize: 40,
    color: theme.colors.text,
    paddingVertical: 0,
  },
});
