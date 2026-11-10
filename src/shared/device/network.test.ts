import type { NetworkState } from 'expo-network';

import { isOnline } from './network';

jest.mock('expo-network', () => ({}));

const state = (value: Partial<NetworkState>) => value as NetworkState;

describe('isOnline', () => {
  it('con red cuenta como conectado, aunque Android diga que no hay internet', () => {
    expect(isOnline(state({ isConnected: true, isInternetReachable: false }))).toBe(true);
  });

  it('sin red cuenta como desconectado', () => {
    expect(isOnline(state({ isConnected: false }))).toBe(false);
  });

  it('un dato que no llegó cuenta como conectado', () => {
    expect(isOnline(state({}))).toBe(true);
  });
});
