import { StyleSheet, View } from 'react-native';

import { unitMeasure } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';
import { theme } from '@/shared/ui/theme';
import type { ProductSuggestion } from '../api';

const t = messages.productForm;

type Props = {
  suggestion: ProductSuggestion;
  onAccept: () => void;
  onReject: () => void;
};

// Ofrece el nombre y la unidad que ya se conocen para el código leído. No llena nada
// por sí sola: el mismo código puede ser de otro producto, así que decide el usuario.
export function ProductSuggestionCard({ suggestion, onAccept, onReject }: Props) {
  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.header}>
        <View style={styles.icon}>
          <Icon name="barcode" />
        </View>
        <View style={styles.flex}>
          <AppText variant="label" tone="secondary">
            {t.suggestionTitle}
          </AppText>
          <AppText variant="title">{suggestion.name}</AppText>
          <AppText variant="body" tone="secondary">
            {suggestion.source === 'OPEN_FOOD_FACTS'
              ? `${t.suggestionUnit(unitMeasure(suggestion.unit))} · ${t.suggestionPublicSource}`
              : t.suggestionUnit(unitMeasure(suggestion.unit))}
          </AppText>
        </View>
      </View>
      <View style={styles.actions}>
        <Button label={t.suggestionReject} variant="secondary" onPress={onReject} style={styles.flex} />
        <Button label={t.suggestionAccept} icon="check" onPress={onAccept} style={styles.flex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: theme.spacing.md },
});
