import type { ReactElement, ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View, type RefreshControlProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './AppText';
import { theme } from './theme';

type Props = {
  // Barra superior: botón izquierdo, título centrado y botón derecho.
  left?: ReactNode;
  title?: string;
  right?: ReactNode;
  // Contenido sobre el fondo hueso, antes de la hoja blanca.
  header?: ReactNode;
  children?: ReactNode;
  // Acciones fijas al pie de la hoja (botón principal).
  footer?: ReactNode;
  refreshControl?: ReactElement<RefreshControlProps>;
};

// Estructura común de las pantallas del diseño: encabezado sobre fondo hueso
// y una hoja blanca con esquinas superiores redondeadas.
export function PageLayout({ left, title, right, header, children, footer, refreshControl }: Props) {
  const insets = useSafeAreaInsets();
  const hasTopBar = !!(left || title || right);

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.root}>
      <View style={[styles.root, { paddingTop: insets.top + theme.spacing.md }]}>
        {hasTopBar ? (
          <View style={styles.topBar}>
            <View style={styles.slot}>{left}</View>
            <AppText variant="title" style={styles.title} numberOfLines={1} accessibilityRole="header">
              {title}
            </AppText>
            <View style={[styles.slot, styles.slotRight]}>{right}</View>
          </View>
        ) : null}
        {header ? <View style={styles.header}>{header}</View> : null}
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            refreshControl={refreshControl}
          >
            {children}
          </ScrollView>
          {footer ? (
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) + theme.spacing.sm }]}>
              {footer}
            </View>
          ) : null}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    minHeight: 52,
  },
  slot: { width: 52, alignItems: 'flex-start' },
  slotRight: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center', fontFamily: theme.fonts.bold },
  header: { paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.xl, gap: theme.spacing.sm },
  sheet: {
    flex: 1,
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.sheet,
    borderTopRightRadius: theme.radius.sheet,
    overflow: 'hidden',
  },
  sheetContent: { padding: theme.spacing.lg, paddingTop: theme.spacing.xl, gap: theme.spacing.lg, flexGrow: 1 },
  footer: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm, gap: theme.spacing.sm },
});
