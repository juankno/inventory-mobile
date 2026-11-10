import { onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';
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
    return () => subscription.remove();
  });
}

export const useIsOnline = () =>
  useSyncExternalStore(
    (listener) => onlineManager.subscribe(listener),
    () => onlineManager.isOnline(),
  );
