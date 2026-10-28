import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { theme } from './theme';

type ToastOptions = {
  message: string;
  // Acción opcional, por ejemplo "Deshacer".
  action?: { label: string; onPress: () => void };
  durationMs?: number;
};

type ToastState = ToastOptions & { id: number };

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);

const DEFAULT_DURATION_MS = 3500;
const WITH_ACTION_DURATION_MS = 6000;

// Aviso breve al pie de la pantalla que confirma una acción (registrar, guardar,
// eliminar). Vive sobre la navegación, así se ve aunque la pantalla se cierre.
export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [progress] = useState(() => new Animated.Value(0));
  const nextId = useRef(0);

  const hide = useCallback(() => {
    Animated.timing(progress, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setToast(null));
  }, [progress]);

  const show = useCallback(
    (options: ToastOptions) => {
      nextId.current += 1;
      setToast({ ...options, id: nextId.current });
      AccessibilityInfo.announceForAccessibility(options.message);
    },
    [],
  );

  useEffect(() => {
    if (!toast) return;
    progress.setValue(0);
    Animated.spring(progress, { toValue: 1, useNativeDriver: true, bounciness: 4 }).start();
    const duration = toast.durationMs ?? (toast.action ? WITH_ACTION_DURATION_MS : DEFAULT_DURATION_MS);
    const timer = setTimeout(hide, duration);
    return () => clearTimeout(timer);
  }, [toast, progress, hide]);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={[styles.container, { bottom: insets.bottom + 92 }]}>
          <Animated.View
            accessibilityLiveRegion="polite"
            style={[
              styles.toast,
              {
                opacity: progress,
                transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
              },
            ]}
          >
            <Icon name="check" size={22} color={theme.colors.onInk} />
            <AppText variant="bodyStrong" tone="inverse" style={styles.message}>
              {toast.message}
            </AppText>
            {toast.action ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  toast.action?.onPress();
                  hide();
                }}
                style={styles.action}
              >
                <AppText variant="bodyStrong" style={styles.actionText}>
                  {toast.action.label}
                </AppText>
              </Pressable>
            ) : null}
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast debe usarse dentro de ToastProvider');
  return show;
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: theme.spacing.lg, right: theme.spacing.lg },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 56,
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.ink,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  message: { flex: 1, paddingVertical: theme.spacing.sm },
  action: {
    minHeight: theme.minTouchSize,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
  },
  actionText: { color: theme.colors.warningDot, fontFamily: theme.fonts.extrabold },
});
