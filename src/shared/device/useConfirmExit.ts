import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';

import { messages } from '@/shared/i18n/messages';
import { useToast } from '@/shared/ui/Toast';

const EXIT_WINDOW_MS = 2000;

// En las pantallas desde donde "atrás" cerraría la app (inicio, login,
// presentación), el primer toque avisa y solo un segundo toque seguido sale.
// Evita salir por accidente al tocar atrás varias veces. Solo aplica en Android.
export function useConfirmExit() {
  const showToast = useToast();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      let lastPress = 0;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        const now = Date.now();
        // Segundo toque a tiempo: se deja que Android cierre la app como siempre.
        if (now - lastPress < EXIT_WINDOW_MS) return false;
        lastPress = now;
        showToast({ message: messages.exit.pressAgain, durationMs: EXIT_WINDOW_MS });
        return true;
      });
      return () => subscription.remove();
    }, [showToast]),
  );
}
