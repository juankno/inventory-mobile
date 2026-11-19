import { StyleSheet, View } from 'react-native';

import { unitMeasure } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { theme } from '@/shared/ui/theme';
import type { ProductSuggestion } from '../api';
import { ProductImage } from './ProductImage';

const t = messages.productForm;

type Props = {
  suggestion: ProductSuggestion;
  onAccept: () => void;
  onReject: () => void;
};

// Ofrece el nombre y la unidad que ya se conocen para el código leído. No llena nada
// por sí sola: el mismo código puede ser de otro producto, así que decide el usuario.
export function ProductSuggestionCard({ suggestion, onAccept, onReject }: Props) {
  // Las bases públicas piden citarlas. Lo de otras tiendas (o una fuente que esta versión
  // no conoce) no lleva nombre.
  const publicSource = suggestion.source === 'COMMUNITY' ? undefined : t.suggestionPublicSource[suggestion.source];

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.header}>
        <ProductImage
          imageUrl={suggestion.imageUrl}
          imageLargeUrl={suggestion.imageLargeUrl}
          size={72}
          fallbackIcon="barcode"
          zoomable
        />
        <View style={styles.flex}>
          <AppText variant="label" tone="secondary">
            {t.suggestionTitle}
          </AppText>
          <AppText variant="title">{suggestion.name}</AppText>
          <AppText variant="body" tone="secondary">
            {publicSource
              ? `${t.suggestionUnit(unitMeasure(suggestion.unit))} · ${publicSource}`
              : t.suggestionUnit(unitMeasure(suggestion.unit))}
          </AppText>
        </View>
      </View>
      <View style={styles.actions}>
        <Button label={t.suggestionReject} variant="secondary" size="compact" onPress={onReject} style={styles.flex} />
        <Button label={t.suggestionAccept} size="compact" onPress={onAccept} style={styles.flex} />
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
  actions: { flexDirection: 'row', gap: theme.spacing.sm },
});
