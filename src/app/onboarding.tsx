import { useRef, useState, type ComponentType } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AlertsIllustration,
  QrIllustration,
  ScanIllustration,
  WelcomeIllustration,
} from '@/features/onboarding/components/Illustrations';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { useConfirmExit } from '@/shared/device/useConfirmExit';
import { messages } from '@/shared/i18n/messages';
import { AppText, Headline } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { theme } from '@/shared/ui/theme';
import { useScreenSize } from '@/shared/ui/useScreenSize';

const t = messages.onboarding;

const illustrations: ComponentType[] = [WelcomeIllustration, ScanIllustration, QrIllustration, AlertsIllustration];
const slides = t.slides.map((slide, index) => ({ ...slide, key: String(index), Illustration: illustrations[index] }));
type Slide = (typeof slides)[number];

// Presentación de la app la primera vez que se abre: qué hace y cómo se usa.
// Al terminar o saltarla se recuerda en el celular y se pasa al inicio de sesión.
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // En pantallas bajas las ilustraciones se reducen y el texto no reserva alto mínimo.
  const { short } = useScreenSize();
  const { finish } = useOnboarding();
  const listRef = useRef<FlatList<Slide>>(null);
  const [scrollX] = useState(() => new Animated.Value(0));
  const [index, setIndex] = useState(0);
  const isLast = index === slides.length - 1;
  useConfirmExit();

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));

  const next = () => {
    if (isLast) {
      void finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    setIndex(index + 1);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + theme.spacing.md }]}>
      <View style={styles.topBar}>
        <AppText variant="bodyStrong" tone="secondary">
          {t.step(index + 1, slides.length)}
        </AppText>
        {isLast ? null : (
          <Pressable accessibilityRole="button" onPress={() => void finish()} style={styles.skip}>
            <AppText variant="bodyStrong">{t.skip}</AppText>
          </Pressable>
        )}
      </View>

      <Animated.FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(slide) => slide.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        getItemLayout={(_, itemIndex) => ({ length: width, offset: width * itemIndex, index: itemIndex })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.illustration, short && styles.illustrationShort]}>
              <View style={short ? styles.scaledDown : undefined}>
                <item.Illustration />
              </View>
            </View>
            <View style={[styles.text, short && styles.textShort]}>
              <Headline strong={item.strong} soft={item.soft} />
              <AppText variant="lead" tone="secondary">
                {item.body}
              </AppText>
            </View>
          </View>
        )}
      />

      <View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) + theme.spacing.sm }]}>
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {slides.map((slide, dotIndex) => {
            const range = [(dotIndex - 1) * width, dotIndex * width, (dotIndex + 1) * width];
            return (
              <Animated.View
                key={slide.key}
                style={[
                  styles.dot,
                  {
                    width: scrollX.interpolate({ inputRange: range, outputRange: [8, 28, 8], extrapolate: 'clamp' }),
                    opacity: scrollX.interpolate({ inputRange: range, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' }),
                  },
                ]}
              />
            );
          })}
        </View>
        <Button label={isLast ? t.start : t.next} onPress={next} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    minHeight: 48,
  },
  skip: { minHeight: theme.minTouchSize, minWidth: theme.minTouchSize, alignItems: 'center', justifyContent: 'center' },
  slide: { flex: 1 },
  illustration: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  illustrationShort: { padding: theme.spacing.sm },
  scaledDown: { transform: [{ scale: 0.8 }] },
  text: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.sheet,
    borderTopRightRadius: theme.radius.sheet,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md,
    minHeight: 230,
  },
  textShort: { minHeight: 0, paddingTop: theme.spacing.xl },
  controls: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.sm },
  dot: { height: 8, borderRadius: 4, backgroundColor: theme.colors.ink },
});
