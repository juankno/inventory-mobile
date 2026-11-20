import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { messages } from '@/shared/i18n/messages';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { theme } from '@/shared/ui/theme';
import { ProductImageViewer } from './ProductImageViewer';

type Props = {
  imageUrl: string | null | undefined;
  imageLargeUrl?: string | null;
  size: number;
  // Ícono cuando no hay foto o no cargó. Sin él, no se muestra nada.
  fallbackIcon?: IconName;
  // Al tocarla se ve en pantalla completa, para leer la etiqueta.
  zoomable?: boolean;
};

// Foto pública del producto (Open Food Facts u Open Beauty Facts). Si no hay foto o no
// carga (sin datos, servidor lento), queda el ícono de siempre.
export function ProductImage({ imageUrl, imageLargeUrl, size, fallbackIcon, zoomable }: Props) {
  const [failed, setFailed] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const url = failed ? null : (imageUrl ?? null);
  const box = { width: size, height: size };

  if (!url) {
    return fallbackIcon ? (
      <View style={styles.icon}>
        <Icon name={fallbackIcon} />
      </View>
    ) : null;
  }

  const image = (
    <Image source={{ uri: url }} style={[styles.image, box]} resizeMode="contain" onError={() => setFailed(true)} />
  );
  if (!zoomable) return image;

  return (
    <>
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel={messages.productForm.suggestionImageOpen}
        onPress={() => setViewerOpen(true)}
        style={({ pressed }) => pressed && styles.pressed}
      >
        {image}
        <View style={styles.zoomBadge}>
          <Icon name="resize" size={14} color={theme.colors.onInk} />
        </View>
      </Pressable>
      <ProductImageViewer
        visible={viewerOpen}
        smallUrl={url}
        largeUrl={imageLargeUrl}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // El círculo de ícono de toda la app, del mismo tamaño aunque la foto sea más grande.
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sobre fondo blanco para que se vea el empaque.
  image: {
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
});
