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

// Fila de acción de un menú dentro de la hoja. destructive la separa y la pinta de
// rojo claro; navigates muestra una flecha porque abre otra pantalla.
export function SheetAction({
  icon,
  label,
  description,
  onPress,
  destructive,
  navigates,
}: {
  icon: IconName;
  label: string;
  // Qué hace la opción, en una línea, para quien no la conoce.
  description?: string;
  onPress: () => void;
  destructive?: boolean;
  navigates?: boolean;
}) {
  const color = destructive ? theme.colors.dangerText : theme.colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={description}
      onPress={onPress}
      style={({ pressed }) => [styles.action, destructive && styles.destructive, pressed && styles.pressed]}
    >
      <View style={styles.actionIcon}>
        <Icon name={icon} color={color} size={22} />
      </View>
      <View style={styles.actionText}>
        <AppText variant="lead" tone={destructive ? 'danger' : 'default'} style={styles.actionLabel}>
          {label}
        </AppText>
        {description ? (
          <AppText variant="body" tone={destructive ? 'danger' : 'secondary'}>
            {description}
          </AppText>
        ) : null}
      </View>
      {navigates ? <Icon name="chevronRight" color={theme.colors.secondary} size={22} /> : null}
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
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.field,
  },
  // Separada de las demás para no tocarla por error.
  destructive: { backgroundColor: theme.colors.dangerBg, marginTop: theme.spacing.sm },
  pressed: { opacity: 0.85 },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { flex: 1 },
  actionLabel: { fontFamily: theme.fonts.bold },
});
