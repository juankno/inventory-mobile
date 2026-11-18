import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { unitMeasure } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';
import { theme } from '@/shared/ui/theme';
import type { ProductSuggestion } from '../api';
import { ProductImageViewer } from './ProductImageViewer';

const t = messages.productForm;

type Props = {
  suggestion: ProductSuggestion;
  onAccept: () => void;
  onReject: () => void;
};

// Ofrece el nombre y la unidad que ya se conocen para el código leído. No llena nada
// por sí sola: el mismo código puede ser de otro producto, así que decide el usuario.
export function ProductSuggestionCard({ suggestion, onAccept, onReject }: Props) {
  // Si la foto no carga (sin datos, servidor lento), queda el ícono de siempre.
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = imageFailed ? null : (suggestion.imageUrl ?? null);
  const [viewerOpen, setViewerOpen] = useState(false);
  // Las bases públicas piden citarlas. Lo de otras tiendas (o una fuente que esta versión
  // no conoce) no lleva nombre.
  const publicSource = suggestion.source === 'COMMUNITY' ? undefined : t.suggestionPublicSource[suggestion.source];

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.header}>
        {imageUrl ? (
          // Al tocarla se ve en pantalla completa, para leer la etiqueta.
          <Pressable
            accessibilityRole="imagebutton"
            accessibilityLabel={t.suggestionImageOpen}
            onPress={() => setViewerOpen(true)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="contain"
              onError={() => setImageFailed(true)}
            />
            <View style={styles.zoomBadge}>
              <Icon name="resize" size={14} color={theme.colors.onInk} />
            </View>
          </Pressable>
        ) : (
          <View style={styles.icon}>
            <Icon name="barcode" />
          </View>
        )}
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
      {imageUrl ? (
        <ProductImageViewer
          visible={viewerOpen}
          smallUrl={imageUrl}
          largeUrl={suggestion.imageLargeUrl}
          onClose={() => setViewerOpen(false)}
        />
      ) : null}
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
  // Foto del frente del producto, sobre fondo blanco para que se vea su empaque.
  image: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  // Señal de que la foto se puede ampliar.
  zoomBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
  actions: { flexDirection: 'row', gap: theme.spacing.sm },
});
