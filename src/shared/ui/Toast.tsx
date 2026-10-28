import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { messages } from '@/shared/i18n/messages';
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
// El aviso es pasajero y no es texto de lectura: va en 14 sp para que quepa en
// una o dos líneas. Los botones se ven compactos pero conservan 48 dp de área
// táctil con hitSlop.
const BUTTON_SIZE = 36;
const BUTTON_SLOP = (theme.minTouchSize - BUTTON_SIZE) / 2;
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
            <Icon name="check" size={18} color={theme.colors.onInk} />
            <AppText tone="inverse" style={styles.message} numberOfLines={2}>
              {toast.message}
            </AppText>
            {toast.action ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  toast.action?.onPress();
                  hide();
                }}
                hitSlop={BUTTON_SLOP}
                style={styles.action}
              >
                <AppText style={styles.actionText}>
                  {toast.action.label}
                </AppText>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={messages.common.close}
              onPress={hide}
              hitSlop={BUTTON_SLOP}
              style={styles.close}
            >
              <Icon name="close" size={18} color={theme.colors.onInk} />
            </Pressable>
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
    gap: theme.spacing.sm,
    minHeight: 48,
    paddingLeft: theme.spacing.md,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.ink,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  message: { flex: 1, fontFamily: theme.fonts.semibold, fontSize: 14, lineHeight: 19 },
  action: {
    minHeight: BUTTON_SIZE,
    paddingHorizontal: theme.spacing.sm,
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
  },
  actionText: { color: theme.colors.warningDot, fontFamily: theme.fonts.extrabold, fontSize: 14, lineHeight: 19 },
  close: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
});
