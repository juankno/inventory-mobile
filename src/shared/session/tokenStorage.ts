import * as SecureStore from 'expo-secure-store';

// El token y los datos básicos del usuario se guardan cifrados (M-05, DDS 7.5).
const SESSION_KEY = 'session';

export type StoredSession = {
  token: string;
  businessName: string;
  ownerName: string;
};

export async function loadSession(): Promise<StoredSession | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  return raw ? (JSON.parse(raw) as StoredSession) : null;
}

export async function saveSession(session: StoredSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
