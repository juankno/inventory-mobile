import { useState } from 'react';
import { ActivityIndicator, Image, Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { messages } from '@/shared/i18n/messages';
import { IconButton } from '@/shared/ui/IconButton';
import { theme } from '@/shared/ui/theme';

type Props = {
  visible: boolean;
  // Foto grande; si no hay o no carga, se amplía la miniatura.
  largeUrl: string | null | undefined;
  smallUrl: string;
  onClose: () => void;
};

// Foto del producto en pantalla completa, sobre fondo oscuro, para leer la etiqueta y
// confirmar que el código es de ese producto. Se cierra con el botón o con "atrás".
export function ProductImageViewer({ visible, largeUrl, smallUrl, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [largeFailed, setLargeFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const uri = largeUrl && !largeFailed ? largeUrl : smallUrl;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.bar}>
          <IconButton icon="close" variant="scanner" accessibilityLabel={messages.common.close} onPress={onClose} />
        </View>
        <View style={styles.body}>
          <Image
            source={{ uri }}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel={messages.productForm.suggestionImage}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => setLargeFailed(true)}
          />
          {loading ? <ActivityIndicator style={StyleSheet.absoluteFill} color={theme.colors.onInk} size="large" /> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.scannerBg },
  bar: { flexDirection: 'row', justifyContent: 'flex-end', padding: theme.spacing.md },
  body: { flex: 1, padding: theme.spacing.md },
  image: { flex: 1 },
});
