import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Vibración corta para confirmar sin mirar la pantalla (código leído, movimiento
// registrado). En Android se usa la API recomendada, que no pide permiso de vibración.
export function hapticSuccess() {
  const result =
    Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  void result.catch(() => undefined);
}

export function hapticWarning() {
  const result =
    Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  void result.catch(() => undefined);
}
