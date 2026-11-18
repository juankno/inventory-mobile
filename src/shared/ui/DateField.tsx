import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { formatDay } from '@/shared/format/dates';
import { messages } from '@/shared/i18n/messages';
import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Icon } from './Icon';
import { theme } from './theme';

type Props = {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

// Campo de fecha que abre el calendario del celular: se toca el día en vez de escribir
// la fecha, así no hay formato que aprender ni fechas que no existen. Se ve como los
// demás campos de texto.
export function DateField({ label, value, onChange, minimumDate, maximumDate }: Props) {
  // En iOS el calendario va en una hoja inferior; en Android se abre el diálogo nativo.
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        minimumDate,
        maximumDate,
        onValueChange: (_event, date) => onChange(date),
      });
      return;
    }
    setDraft(value);
    setSheetOpen(true);
  };

  return (
    <View style={styles.container}>
      <AppText variant="label">{label}</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={messages.common.changeDate(label, formatDay(value))}
        onPress={open}
        style={({ pressed }) => [styles.field, pressed && styles.pressed]}
      >
        <AppText variant="lead" numberOfLines={1} style={styles.value}>
          {formatDay(value)}
        </AppText>
        <Icon name="calendar" size={22} color={theme.colors.secondary} />
      </Pressable>

      {Platform.OS === 'ios' ? (
        <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
          <DateTimePicker
            value={draft}
            mode="date"
            display="inline"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onValueChange={(_event, date) => setDraft(date)}
          />
          <Button
            label={messages.common.done}
            onPress={() => {
              setSheetOpen(false);
              onChange(draft);
            }}
          />
        </BottomSheet>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing.sm, flexShrink: 1 },
  // Igual que el campo de TextField.
  field: {
    minHeight: theme.controlHeight,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.field,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  value: { flex: 1 },
  pressed: { opacity: 0.8 },
});
