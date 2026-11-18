import { onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { AppState } from 'react-native';
import { useSyncExternalStore } from 'react';

// Solo cuenta si el celular dice que no tiene red. isInternetReachable no se usa:
// en algunos Android marca "sin internet" aunque sí haya. Un wifi sin internet
// se detecta igual, porque las peticiones fallan (connectionNotice).
export const isOnline = ({ isConnected }: Network.NetworkState) => isConnected !== false;

// Le dice a TanStack Query cuándo hay conexión: al volver, repite las consultas.
export function watchConnection() {
  onlineManager.setEventListener((setOnline) => {
    let received = false;
    const subscription = Network.addNetworkStateListener((state) => {
      received = true;
      setOnline(isOnline(state));
    });
    void Network.getNetworkStateAsync().then((state) => {
      if (!received) setOnline(isOnline(state));
    });
    // En segundo plano Android puede avisar que se fue la red y no avisar cuando
    // vuelve: el aviso quedaría fijo. Al volver a la app se pregunta de nuevo.
    const appState = AppState.addEventListener('change', (status) => {
      if (status !== 'active') return;
      void Network.getNetworkStateAsync()
        .then((state) => setOnline(isOnline(state)))
        .catch(() => {});
    });
    return () => {
      subscription.remove();
      appState.remove();
    };
  });
}

export const useIsOnline = () =>
  useSyncExternalStore(
    (listener) => onlineManager.subscribe(listener),
    () => onlineManager.isOnline(),
  );
