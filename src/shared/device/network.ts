import { onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { useSyncExternalStore } from 'react';

// Conectado a un wifi sin internet también cuenta como sin conexión. Un valor
// desconocido cuenta como conectado, para no bloquear por un dato que no llegó.
const isOnline = ({ isConnected, isInternetReachable }: Network.NetworkState) =>
  isConnected !== false && isInternetReachable !== false;

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
    return () => subscription.remove();
  });
}

export const useIsOnline = () =>
  useSyncExternalStore(
    (listener) => onlineManager.subscribe(listener),
    () => onlineManager.isOnline(),
  );
