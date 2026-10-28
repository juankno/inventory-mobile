import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

// Recuerda en el celular si ya se vio la presentación de la app,
// para mostrarla solo la primera vez.
const ONBOARDING_KEY = 'onboardingSeen';

type OnboardingContextValue = {
  seen: boolean;
  isLoading: boolean;
  finish: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [seen, setSeen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(ONBOARDING_KEY)
      .then((value) => setSeen(value === 'true'))
      .catch(() => setSeen(false))
      .finally(() => setIsLoading(false));
  }, []);

  const finish = useCallback(async () => {
    setSeen(true);
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true').catch(() => undefined);
  }, []);

  const value = useMemo(() => ({ seen, isLoading, finish }), [seen, isLoading, finish]);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding debe usarse dentro de OnboardingProvider');
  return context;
}
