import { StyleSheet, Text } from 'react-native';

import { messages } from '@/shared/i18n/messages';
import { Screen } from './Screen';
import { theme } from './theme';

// Pantalla temporal mientras se implementa cada historia de usuario.
export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <Screen title={title}>
      <Text style={styles.text}>{messages.common.pending}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: theme.fontSize.body, color: theme.colors.muted },
});
