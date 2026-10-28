import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { theme } from './theme';

// Aviso en bloque: error (rojo), éxito o información (gris).
export function Banner({ message, tone = 'danger' }: { message: string; tone?: 'danger' | 'success' | 'info' }) {
  const isDanger = tone === 'danger';
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, isDanger ? styles.dangerBanner : styles.infoBanner]}
    >
      <Icon
        name={tone === 'success' ? 'check' : isDanger ? 'alert' : 'info'}
        color={isDanger ? theme.colors.dangerText : tone === 'success' ? theme.colors.success : theme.colors.ink}
        size={26}
      />
      <AppText variant="lead" tone={isDanger ? 'danger' : 'default'} style={styles.bannerText}>
        {message}
      </AppText>
    </View>
  );
}

// Etiqueta corta de estado de existencias ("Por agotarse", "Agotado").
export function StatusBadge({ label, tone }: { label: string; tone: 'warning' | 'danger' }) {
  return (
    <View style={[styles.badge, tone === 'warning' ? styles.warningBadge : styles.dangerBadge]}>
      <AppText variant="bodyStrong" tone={tone}>
        {label}
      </AppText>
    </View>
  );
}

// Marca "Código leído" / "Sin código de barras" sobre el encabezado.
export function Tag({ label, icon }: { label: string; icon: 'check' | 'qrCode' }) {
  return (
    <View style={styles.tag}>
      <Icon name={icon} size={20} color={icon === 'check' ? theme.colors.success : theme.colors.ink} />
      <AppText variant="label" style={styles.tagText}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    alignItems: 'flex-start',
  },
  dangerBanner: { backgroundColor: theme.colors.dangerBg },
  infoBanner: { backgroundColor: theme.colors.field },
  bannerText: { flex: 1 },
  badge: { paddingHorizontal: theme.spacing.md, paddingVertical: 6, borderRadius: theme.radius.pill },
  warningBadge: { backgroundColor: theme.colors.warningBg },
  dangerBadge: { backgroundColor: theme.colors.dangerBg },
  tag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  tagText: { fontFamily: theme.fonts.bold },
});
