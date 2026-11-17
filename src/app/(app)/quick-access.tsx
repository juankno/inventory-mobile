import { router } from 'expo-router';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { useQuickBubble } from '@/shared/device/quickBubble';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { Banner } from '@/shared/ui/Feedback';
import { IconButton } from '@/shared/ui/IconButton';
import { PageLayout } from '@/shared/ui/PageLayout';
import { theme } from '@/shared/ui/theme';

const t = messages.quickAccess;

// Configura la burbuja flotante que lleva de vuelta a la app (solo Android).
// El menú solo muestra esta opción si el módulo nativo está en la app instalada.
export default function QuickAccessScreen() {
  const bubble = useQuickBubble();
  // Activada a la vista solo si de verdad puede aparecer.
  const on = bubble.enabled && bubble.permitted;
  const permissionLost = bubble.enabled && !bubble.permitted;
  const showPermission = permissionLost || bubble.waitingPermission;

  return (
    <PageLayout
      left={<IconButton icon="chevronLeft" accessibilityLabel={messages.common.back} onPress={() => router.back()} />}
      title={t.title}
    >
      <AppText variant="heading" accessibilityRole="header">
        {t.heading}
      </AppText>
      <AppText variant="lead" tone="secondary">
        {t.intro}
      </AppText>

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: on }}
        onPress={() => bubble.setEnabled(!on)}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
      >
        <AppText variant="title" style={styles.flex}>
          {t.toggle}
        </AppText>
        <Switch
          value={on}
          onValueChange={bubble.setEnabled}
          trackColor={{ false: theme.colors.border, true: theme.colors.ink }}
          thumbColor={theme.colors.surface}
          importantForAccessibility="no"
        />
      </Pressable>

      {showPermission ? (
        <View style={styles.group}>
          <Banner tone="info" message={permissionLost ? t.permissionLost : t.permissionNeeded} />
          <Button label={t.givePermission} icon="lock" onPress={bubble.openSettings} />
        </View>
      ) : on ? (
        <Banner tone="success" message={t.enabled} />
      ) : null}

      <View style={styles.group}>
        <AppText variant="title" accessibilityRole="header">
          {t.howTitle}
        </AppText>
        {t.how.map((line) => (
          <View key={line} style={styles.bullet}>
            <AppText variant="body">•</AppText>
            <AppText variant="body" tone="secondary" style={styles.flex}>
              {line}
            </AppText>
          </View>
        ))}
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  group: { gap: theme.spacing.md },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: theme.minTouchSize,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.field,
  },
  pressed: { opacity: 0.7 },
  bullet: { flexDirection: 'row', gap: theme.spacing.sm },
});
