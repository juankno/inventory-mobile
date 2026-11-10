import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { theme } from './theme';

type Props = {
  icon: IconName;
  title: string;
  body?: string;
  // Acciones para salir del estado vacío (por ejemplo, agregar el primer producto).
  children?: ReactNode;
};

// Cuando no hay nada que mostrar: con ícono se lee como un estado esperado, no como un error.
export function EmptyState({ icon, title, body, children }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.icon}>
        <Icon name={icon} size={30} color={theme.colors.secondary} />
      </View>
      <AppText variant="title" style={styles.text}>
        {title}
      </AppText>
      {body ? (
        <AppText variant="body" tone="secondary" style={styles.text}>
          {body}
        </AppText>
      ) : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.xl },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.field,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  text: { textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: theme.spacing.sm, marginTop: theme.spacing.md },
});
