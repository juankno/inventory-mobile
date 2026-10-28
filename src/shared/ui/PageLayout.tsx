import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type RefreshControlProps,
  type ScrollViewInstance,
  type ViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './AppText';
import { theme } from './theme';

type Props = {
  // Barra superior: botón izquierdo, título centrado y botón derecho.
  left?: ReactNode;
  title?: string;
  right?: ReactNode;
  // Contenido sobre el fondo hueso, antes de la hoja blanca.
  header?: ReactNode;
  children?: ReactNode;
  // Acciones fijas al pie de la hoja (botón principal).
  footer?: ReactNode;
  refreshControl?: ReactElement<RefreshControlProps>;
};

// Espacio que se deja sobre el campo enfocado para que se vea su etiqueta.
const FOCUS_OFFSET = 96;
// Tiempo para que la hoja termine de acomodarse al teclado antes de desplazar.
const LAYOUT_DELAY_MS = 80;

// Permite que los campos pidan quedar visibles al enfocarse, aunque el teclado
// ya esté abierto (por ejemplo, al pasar del correo a la contraseña).
const FocusScrollContext = createContext<(() => void) | null>(null);

export function useScrollToFocusedInput() {
  return useContext(FocusScrollContext);
}

// Hace seguimiento del teclado para quitar el margen inferior mientras está abierto.
function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () =>
      setVisible(true),
    );
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

// Estructura común de las pantallas del diseño: encabezado sobre fondo hueso
// y una hoja blanca con esquinas superiores redondeadas. Encabezado y hoja se
// desplazan juntos, así al abrir el teclado el encabezado sube en lugar de
// aplastar el formulario.
export function PageLayout({ left, title, right, header, children, footer, refreshControl }: Props) {
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const contentRef = useRef<ViewInstance>(null);
  const hasTopBar = !!(left || title || right);

  // Lleva el campo enfocado cerca de la parte de arriba de la zona visible.
  const scrollToFocused = useCallback(() => {
    setTimeout(() => {
      const input = TextInput.State.currentlyFocusedInput();
      const content = contentRef.current;
      if (!input || !content) return;
      input.measureLayout(content, (_x, y) => {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - FOCUS_OFFSET), animated: true });
      });
    }, LAYOUT_DELAY_MS);
  }, []);

  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', scrollToFocused);
    return () => subscription.remove();
  }, [scrollToFocused]);

  const bottomPadding = keyboardVisible ? theme.spacing.md : Math.max(insets.bottom, theme.spacing.md) + theme.spacing.sm;

  return (
    <FocusScrollContext.Provider value={scrollToFocused}>
      <KeyboardAvoidingView behavior="padding" style={styles.root}>
        <View style={[styles.root, { paddingTop: insets.top + theme.spacing.md }]}>
          {hasTopBar ? (
            <View style={styles.topBar}>
              <View style={styles.slot}>{left}</View>
              <AppText variant="title" style={styles.title} numberOfLines={1} accessibilityRole="header">
                {title}
              </AppText>
              <View style={[styles.slot, styles.slotRight]}>{right}</View>
            </View>
          ) : null}
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            refreshControl={refreshControl}
          >
            <View ref={contentRef} collapsable={false} style={styles.scrollContent}>
              {header ? <View style={styles.header}>{header}</View> : null}
              <View style={[styles.sheet, !footer && styles.sheetUntilBottom]}>{children}</View>
            </View>
          </ScrollView>
          {footer ? <View style={[styles.footer, { paddingBottom: bottomPadding }]}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </FocusScrollContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    minHeight: 52,
  },
  slot: { width: 52, alignItems: 'flex-start' },
  slotRight: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center', fontFamily: theme.fonts.bold },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: { paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.xl, gap: theme.spacing.sm },
  sheet: {
    flexGrow: 1,
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.sheet,
    borderTopRightRadius: theme.radius.sheet,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  // Sin pie, la hoja blanca debe llegar hasta abajo aunque el contenido sea corto.
  sheetUntilBottom: { paddingBottom: theme.spacing.xxl },
  footer: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
});
