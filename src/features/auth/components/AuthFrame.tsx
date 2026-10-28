import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { isMockApi } from '@/shared/api/apiClient';
import { useConfirmExit } from '@/shared/device/useConfirmExit';
import { messages } from '@/shared/i18n/messages';
import { AppText, Headline } from '@/shared/ui/AppText';
import { AppLogo } from '@/shared/ui/Icon';
import { PageLayout } from '@/shared/ui/PageLayout';
import { theme } from '@/shared/ui/theme';

type Props = {
  tab: 'login' | 'register';
  children: ReactNode;
  footer: ReactNode;
  // Mientras se envía el formulario no se puede cambiar de pestaña.
  busy?: boolean;
};

// Encabezado de marca y pestañas Ingresar / Crear cuenta (diseño "Inicio de sesión y registro").
// Cada pestaña es su propia ruta; al cambiar se reemplaza la pantalla.
export function AuthFrame({ tab, children, footer, busy = false }: Props) {
  // Login y registro son la primera pantalla sin sesión: atrás saldría de la app.
  useConfirmExit();
  return (
    <PageLayout
      header={
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <AppLogo size={56} />
            {isMockApi ? (
              <View accessibilityLabel={messages.auth.demoLabel} style={styles.demo}>
                <AppText variant="caption" tone="inverse" style={styles.demoText}>
                  {messages.auth.demoTag}
                </AppText>
              </View>
            ) : null}
          </View>
          <Headline strong={messages.auth.headlineStrong} soft={messages.auth.headlineSoft} />
          <AppText variant="bodyStrong" tone="secondary" style={styles.brand}>
            {messages.app.name.toUpperCase()}
          </AppText>
        </View>
      }
      footer={footer}
    >
      <View accessibilityRole="tablist" style={styles.tabs}>
        <Tab
          label={messages.auth.tabLogin}
          selected={tab === 'login'}
          disabled={busy}
          onPress={() => router.replace('/login')}
        />
        <Tab
          label={messages.auth.tabRegister}
          selected={tab === 'register'}
          disabled={busy}
          onPress={() => router.replace('/register')}
        />
      </View>
      {children}
    </PageLayout>
  );
}

type TabProps = { label: string; selected: boolean; disabled: boolean; onPress: () => void };

function Tab({ label, selected, disabled, onPress }: TabProps) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected, disabled }}
      onPress={selected ? undefined : onPress}
      disabled={disabled}
      style={[styles.tab, selected && styles.tabSelected, disabled && !selected && styles.tabDisabled]}
    >
      <AppText variant="lead" style={selected ? styles.tabTextSelected : styles.tabText}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { gap: theme.spacing.lg },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  demo: {
    backgroundColor: theme.colors.warningDot,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  demoText: { fontFamily: theme.fonts.extrabold, letterSpacing: 1.5 },
  brand: { letterSpacing: 1 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.field,
    borderRadius: theme.radius.pill,
    padding: 4,
  },
  tab: { flex: 1, minHeight: 48, borderRadius: theme.radius.pill, alignItems: 'center', justifyContent: 'center' },
  tabSelected: { backgroundColor: theme.colors.ink },
  tabDisabled: { opacity: 0.4 },
  tabText: { fontFamily: theme.fonts.semibold },
  tabTextSelected: { fontFamily: theme.fonts.bold, color: theme.colors.onInk },
});
