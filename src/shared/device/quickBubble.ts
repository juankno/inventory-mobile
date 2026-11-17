import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import QuickBubble from '../../../modules/quick-bubble';

// La burbuja solo existe en la app instalada en Android (no en iOS ni en Expo Go).
export const quickBubbleAvailable = QuickBubble !== null;

export type QuickBubbleState = {
  // Lo que eligió el usuario.
  enabled: boolean;
  // Si Android le dio el permiso "Mostrar sobre otras apps".
  permitted: boolean;
  // El usuario la activó y fue a dar el permiso: al volver se termina de activar.
  waitingPermission: boolean;
};

const read = () => ({
  enabled: QuickBubble?.isEnabled() ?? false,
  permitted: QuickBubble?.canDrawOverlays() ?? false,
});

// Estado y acciones de la burbuja. El permiso se concede fuera de la app, así que se
// vuelve a leer cada vez que la app regresa a primer plano.
export function useQuickBubble() {
  const waiting = useRef(false);
  const [state, setState] = useState<QuickBubbleState>(() => ({ ...read(), waitingPermission: false }));

  const refresh = useCallback(() => {
    const current = read();
    // Volvió de los ajustes con el permiso dado: se activa sin pedirle que toque otra vez.
    if (waiting.current && current.permitted && !current.enabled) {
      QuickBubble?.setEnabled(true);
      current.enabled = true;
    }
    if (current.permitted) waiting.current = false;
    setState({ ...current, waitingPermission: waiting.current });
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const openSettings = useCallback(() => {
    if (!QuickBubble) return;
    waiting.current = true;
    setState((previous) => ({ ...previous, waitingPermission: true }));
    QuickBubble.openOverlaySettings();
  }, []);

  const setEnabled = useCallback(
    (enabled: boolean) => {
      if (!QuickBubble) return;
      if (enabled && !QuickBubble.canDrawOverlays()) {
        openSettings();
        return;
      }
      waiting.current = false;
      QuickBubble.setEnabled(enabled);
      refresh();
    },
    [openSettings, refresh],
  );

  return { ...state, setEnabled, openSettings };
}
