import { requireOptionalNativeModule } from 'expo';

// Burbuja flotante de acceso rápido (solo Android). Es null en iOS, en la web y en
// Expo Go, que no incluyen este módulo: ahí la opción no se muestra.
export type QuickBubbleModule = {
  // Si Android le dio a la app el permiso "Mostrar sobre otras apps".
  canDrawOverlays(): boolean;
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
  // Abre el ajuste del permiso; el usuario vuelve con el botón Atrás.
  openOverlaySettings(): void;
};

export default requireOptionalNativeModule<QuickBubbleModule>('QuickBubble');
