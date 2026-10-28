import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { Tag } from '@/shared/ui/Feedback';
import { AppLogo, Icon } from '@/shared/ui/Icon';
import { theme } from '@/shared/ui/theme';

const t = messages.onboarding.illustrations;

// Ilustraciones de la presentación, armadas con las mismas piezas de la app.

export function WelcomeIllustration() {
  return (
    <View style={styles.stack}>
      <AppLogo size={96} />
      <View style={styles.stats}>
        <View style={[styles.stat, styles.statNeutral]}>
          <AppText variant="caption">{t.registered}</AppText>
          <AppText style={styles.statNumber}>20</AppText>
        </View>
        <View style={[styles.stat, styles.statWarning]}>
          <AppText variant="caption">{t.toRestock}</AppText>
          <AppText style={styles.statNumber}>4</AppText>
        </View>
      </View>
    </View>
  );
}

export function ScanIllustration() {
  return (
    <View style={styles.stack}>
      <View style={styles.scanner}>
        <View style={styles.viewfinder}>
          <Icon name="barcode" size={72} color={theme.colors.onInk} strokeWidth={1.5} />
          <View style={styles.scanLine} />
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>
      <Tag icon="check" label={t.codeRead} />
    </View>
  );
}

export function QrIllustration() {
  return (
    <View style={styles.label}>
      <QRCode value="INV-Q719S5WRA1" size={132} color={theme.colors.ink} backgroundColor="#FFFFFF" />
      <AppText variant="title" style={styles.labelName}>
        {t.bulkProduct}
      </AppText>
    </View>
  );
}

export function AlertsIllustration() {
  return (
    <View style={styles.cards}>
      <View style={styles.bell}>
        <Icon name="bell" color={theme.colors.onInk} size={28} />
        <View style={styles.badge}>
          <AppText variant="caption" tone="inverse" style={styles.badgeText}>
            2
          </AppText>
        </View>
      </View>
      <View style={[styles.alertCard, styles.alertDanger]}>
        <AppText variant="bodyStrong">{t.outName}</AppText>
        <AppText variant="caption" tone="danger">
          {t.outDetail}
        </AppText>
      </View>
      <View style={[styles.alertCard, styles.alertWarning]}>
        <AppText variant="bodyStrong">{t.lowName}</AppText>
        <AppText variant="caption" tone="secondary">
          {t.lowDetail}
        </AppText>
      </View>
    </View>
  );
}

const CORNER = 32;

const styles = StyleSheet.create({
  stack: { alignItems: 'center', gap: theme.spacing.xl },
  stats: { flexDirection: 'row', gap: theme.spacing.md },
  stat: { width: 130, borderRadius: theme.radius.lg, padding: theme.spacing.md, gap: theme.spacing.xs },
  statNeutral: { backgroundColor: theme.colors.surface },
  statWarning: { backgroundColor: theme.colors.warningBg },
  statNumber: { fontFamily: theme.fonts.medium, fontSize: 34, lineHeight: 40, color: theme.colors.text },
  scanner: { backgroundColor: theme.colors.scannerBg, borderRadius: theme.radius.sheet, padding: theme.spacing.xl },
  viewfinder: {
    width: 200,
    height: 150,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.scannerSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLine: { position: 'absolute', left: 20, right: 20, height: 2, backgroundColor: theme.colors.onInk },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: theme.colors.onInk },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: theme.radius.md },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: theme.radius.md },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: theme.radius.md },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: theme.radius.md,
  },
  label: {
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sheet,
    padding: theme.spacing.xl,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  labelName: { fontFamily: theme.fonts.bold },
  cards: { width: 280, gap: theme.spacing.md },
  bell: {
    alignSelf: 'flex-end',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.dangerDot,
    borderWidth: 2,
    borderColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: theme.fonts.bold, fontSize: 12, lineHeight: 14 },
  alertCard: { borderRadius: theme.radius.lg, padding: theme.spacing.md, paddingHorizontal: theme.spacing.lg },
  alertDanger: { backgroundColor: theme.colors.dangerBg },
  alertWarning: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
});
