import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { theme } from './theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

// Hoja inferior modal (menús, ayuda y formularios cortos).
export function BottomSheet({ visible, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={styles.root}>
        <Pressable accessibilityLabel="Cerrar" style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) + theme.spacing.md }]}>
          <View style={styles.handle} />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Fila de acción de un menú dentro de la hoja.
export function SheetAction({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const color = destructive ? theme.colors.dangerText : theme.colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
    >
      <View style={styles.actionIcon}>
        <Icon name={icon} color={color} size={22} />
      </View>
      <AppText variant="lead" tone={destructive ? 'danger' : 'default'} style={styles.actionLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.sheet,
    borderTopRightRadius: theme.radius.sheet,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 60,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.field,
  },
  pressed: { opacity: 0.85 },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontFamily: theme.fonts.bold },
});
