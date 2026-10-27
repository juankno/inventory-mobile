import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { configureApiClient } from '@/shared/api/apiClient';
import { clearSession, loadSession, saveSession, type StoredSession } from './tokenStorage';

type SessionContextValue = {
  session: StoredSession | null;
  isLoading: boolean;
  signIn: (session: StoredSession) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

// Contexto de sesión (M-03). Al cerrar sesión o recibir un 401 se borra el
// token y se vacía la caché de consultas (DDS 7.5).
export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<StoredSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  const signIn = useCallback(async (next: StoredSession) => {
    await saveSession(next);
    tokenRef.current = next.token;
    setSession(next);
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    tokenRef.current = null;
    queryClient.clear();
    setSession(null);
  }, [queryClient]);

  useEffect(() => {
    configureApiClient({ getToken: () => tokenRef.current, onUnauthorized: () => void signOut() });
  }, [signOut]);

  useEffect(() => {
    loadSession()
      .then((stored) => {
        tokenRef.current = stored?.token ?? null;
        setSession(stored);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo(() => ({ session, isLoading, signIn, signOut }), [session, isLoading, signIn, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession debe usarse dentro de SessionProvider');
  return context;
}
