import { focusManager } from '@tanstack/react-query';
import { AppState } from 'react-native';

// Le dice a TanStack Query cuándo la app vuelve a primer plano: en React Native no
// lo detecta por su cuenta. Al volver, repite las consultas visibles que ya estén viejas.
export function watchAppFocus() {
  focusManager.setEventListener((setFocused) => {
    const subscription = AppState.addEventListener('change', (status) => setFocused(status === 'active'));
    return () => subscription.remove();
  });
}
