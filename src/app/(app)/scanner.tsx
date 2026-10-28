import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCodeResolver } from '@/features/scanner/hooks/useCodeResolver';
import {
  classifyManualEntry,
  classifyScan,
  scannerBarcodeTypes,
  type ScannedCode,
} from '@/features/scanner/schemas';
import { errorMessage } from '@/shared/api/errors';
import { hapticSuccess, hapticWarning } from '@/shared/device/haptics';
import { messages } from '@/shared/i18n/messages';
import { AppText, Headline } from '@/shared/ui/AppText';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { Banner } from '@/shared/ui/Feedback';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/IconButton';
import { PageLayout } from '@/shared/ui/PageLayout';
import { TextField } from '@/shared/ui/TextField';
import { theme } from '@/shared/ui/theme';
import { useScreenSize } from '@/shared/ui/useScreenSize';

const t = messages.scanner;
const NO_READ_TIMEOUT_MS = 10_000;

type Panel = 'idle' | 'searching' | 'noRead' | 'foreign' | 'error';

const close = () => router.back();
const searchByName = () => router.dismissTo({ pathname: '/', params: { focusSearch: '1' } });

// Escáner de códigos (RF-09, RR-01).
export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const asked = useRef(false);

  // Se pide el permiso una sola vez al entrar; si lo niega, queda la pantalla explicativa.
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain && !asked.current) {
      asked.current = true;
      void requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) return <View style={styles.root} />;
  if (!permission.granted) {
    return <PermissionScreen canAskAgain={permission.canAskAgain} onRequest={() => void requestPermission()} />;
  }
  return <CameraScanner />;
}

// El visor ocupa el 78 % del ancho (68 % con un aviso abierto), sin pasar de
// una parte del alto: en pantallas bajas se achica para dejar sitio al panel.
const FRAME_RATIO = 1.3;

function CameraScanner() {
  const insets = useSafeAreaInsets();
  const { width, height, short } = useScreenSize();
  const resolver = useCodeResolver();
  const [panel, setPanel] = useState<Panel>('idle');
  const frameWidth = Math.min(
    width * (panel === 'idle' ? 0.78 : 0.68),
    height * (short ? 0.22 : 0.3) * FRAME_RATIO,
  );
  const [torch, setTorch] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState<string>();
  const [errorText, setErrorText] = useState('');
  const busy = useRef(false);

  const scanning = panel === 'idle' && !manualOpen;

  // Si en 10 s no se lee nada, se muestran consejos (diseño "sin lectura tras 10 s").
  useEffect(() => {
    if (!scanning) return;
    const timer = setTimeout(() => setPanel('noRead'), NO_READ_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [scanning]);

  const resolve = useCallback(
    (scanned: ScannedCode) => {
      busy.current = true;
      setPanel('searching');
      resolver.mutate(scanned, {
        onSuccess: (outcome) => {
          if (outcome !== 'navigated') {
            hapticWarning();
            setPanel('foreign');
          }
        },
        onError: (error) => {
          setErrorText(errorMessage(error, messages.errors.unexpected));
          setPanel('error');
        },
        onSettled: () => {
          busy.current = false;
        },
      });
    },
    [resolver],
  );

  const onScanned = useCallback(
    ({ type, data }: BarcodeScanningResult) => {
      if (busy.current) return;
      const scanned = classifyScan(type, data);
      // Una lectura con dígito de control incorrecto suele ser un error de la cámara: se sigue leyendo.
      if (scanned.kind === 'invalid') return;
      // Vibra al leer, para saber que tomó el código sin mirar la pantalla.
      hapticSuccess();
      resolve(scanned);
    },
    [resolve],
  );

  const keepTrying = () => setPanel('idle');

  const submitManual = () => {
    const scanned = classifyManualEntry(manualCode);
    if (scanned.kind === 'invalid') {
      setManualError(t.invalidBarcode);
      return;
    }
    setManualOpen(false);
    setManualCode('');
    setManualError(undefined);
    resolve(scanned);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + theme.spacing.md }]}>
      <StatusBar style="light" />
      <View style={styles.topBar}>
        <IconButton icon="close" variant="scanner" accessibilityLabel={messages.common.close} onPress={close} />
        <AppText variant="title" tone="inverse" style={styles.title}>
          {t.title}
        </AppText>
        {panel === 'foreign' ? (
          <View style={styles.slot} />
        ) : (
          <IconButton
            icon="flashlight"
            variant="scanner"
            active={torch}
            accessibilityLabel={t.torch}
            onPress={() => setTorch((value) => !value)}
          />
        )}
      </View>

      <View style={[styles.viewfinderArea, short && styles.viewfinderAreaShort]}>
        {panel === 'idle' ? (
          <AppText variant={short ? 'title' : 'heading'} tone="inverse" style={styles.aim}>
            {t.aim}
          </AppText>
        ) : null}
        <View style={[styles.frame, { width: frameWidth }]}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torch}
            barcodeScannerSettings={{ barcodeTypes: [...scannerBarcodeTypes] }}
            onBarcodeScanned={scanning ? onScanned : undefined}
          />
          {panel === 'foreign' ? <View style={styles.paused} /> : null}
          {panel === 'idle' ? <View style={styles.scanLine} /> : null}
          <Corners dimmed={panel !== 'idle'} />
        </View>
        {panel === 'idle' && !short ? (
          <AppText variant="lead" style={styles.autoRead}>
            {t.autoRead}
          </AppText>
        ) : null}
      </View>

      <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) + theme.spacing.sm }]}>
        {/* Si los consejos o avisos no caben en pantallas bajas, el panel se desplaza. */}
        <ScrollView
          style={{ maxHeight: height * 0.6 }}
          contentContainerStyle={styles.panelContent}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {panel === 'idle' ? (
            <>
              <OptionRow icon="plus" label={t.noCode} onPress={() => router.replace('/products/new')} />
              <OptionRow icon="keyboard" label={t.manual} onPress={() => setManualOpen(true)} />
            </>
          ) : null}

          {panel === 'searching' ? (
            <View style={styles.searching}>
              <ActivityIndicator color={theme.colors.ink} />
              <AppText variant="lead">{t.searching}</AppText>
            </View>
          ) : null}

          {panel === 'noRead' ? (
            <>
              <AppText variant="heading">{t.noReadTitle}</AppText>
              <AppText variant="lead" tone="secondary">
                {t.noReadIntro}
              </AppText>
              <Tip icon="resize" text={t.tipDistance} />
              <Tip icon="sun" text={t.tipLight} />
              <Tip icon="barcode" text={t.tipStraight} />
              <Button label={t.keepTrying} onPress={keepTrying} style={styles.firstAction} />
              <Button label={t.searchByName} variant="secondary" onPress={searchByName} />
            </>
          ) : null}

          {panel === 'foreign' ? (
            <>
              <View style={styles.alertIcon}>
                <Icon name="alert" size={30} color={theme.colors.dangerDot} />
              </View>
              <AppText variant="heading">{t.foreignTitle}</AppText>
              <AppText variant="lead" tone="secondary">
                {t.foreignBody}
              </AppText>
              <Button label={t.scanAnother} onPress={keepTrying} style={styles.firstAction} />
              <Button label={t.searchByName} variant="secondary" onPress={searchByName} />
            </>
          ) : null}

          {panel === 'error' ? (
            <>
              <Banner message={errorText} />
              <Button label={t.keepTrying} onPress={keepTrying} />
              <Button label={t.searchByName} variant="secondary" onPress={searchByName} />
            </>
          ) : null}
        </ScrollView>
      </View>

      <BottomSheet visible={manualOpen} onClose={() => setManualOpen(false)}>
        <AppText variant="heading">{t.manualTitle}</AppText>
        <AppText variant="body" tone="secondary">
          {t.manualIntro}
        </AppText>
        <TextField
          label={t.manualLabel}
          placeholder={t.manualPlaceholder}
          value={manualCode}
          onChangeText={(text) => {
            setManualCode(text);
            setManualError(undefined);
          }}
          error={manualError}
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={submitManual}
        />
        <Button label={t.manualSubmit} onPress={submitManual} disabled={!manualCode.trim()} />
      </BottomSheet>
    </View>
  );
}

function PermissionScreen({ canAskAgain, onRequest }: { canAskAgain: boolean; onRequest: () => void }) {
  const steps = [t.permissionStep1, t.permissionStep2, t.permissionStep3];
  return (
    <PageLayout
      left={<IconButton icon="close" accessibilityLabel={messages.common.close} onPress={close} />}
      header={
        <>
          <View style={styles.cameraOff}>
            <Icon name="cameraOff" size={34} color={theme.colors.onInk} />
          </View>
          <Headline strong={t.permissionTitleStrong} soft={t.permissionTitleSoft} />
          <AppText variant="lead" tone="secondary">
            {t.permissionBody}
          </AppText>
        </>
      }
      footer={
        <>
          {canAskAgain ? (
            <Button label={t.allowCamera} onPress={onRequest} />
          ) : (
            <Button label={t.openSettings} onPress={() => void Linking.openSettings()} />
          )}
          <Button label={t.searchByName} variant="secondary" onPress={searchByName} />
          <AppText variant="caption" tone="secondary" style={styles.center}>
            {t.withoutCamera}
          </AppText>
        </>
      }
    >
      {canAskAgain ? null : (
        <>
          <AppText variant="title">{t.permissionHowTo}</AppText>
          {steps.map((parts, index) => (
            <View key={index} style={styles.step}>
              <View style={styles.stepNumber}>
                <AppText variant="bodyStrong">{index + 1}</AppText>
              </View>
              <AppText variant="lead" style={styles.flex}>
                {parts.map((part, partIndex) =>
                  partIndex % 2 === 1 ? (
                    <AppText key={partIndex} variant="lead" style={styles.bold}>
                      {part}
                    </AppText>
                  ) : (
                    part
                  ),
                )}
              </AppText>
            </View>
          ))}
        </>
      )}
    </PageLayout>
  );
}

function OptionRow({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
      <View style={styles.optionIcon}>
        <Icon name={icon} />
      </View>
      <AppText variant="title" style={styles.optionLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

function Tip({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.tip}>
      <View style={styles.stepNumber}>
        <Icon name={icon} size={20} />
      </View>
      <AppText variant="lead" style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

// Esquinas del visor dibujadas con bordes.
function Corners({ dimmed }: { dimmed: boolean }) {
  const color = dimmed ? theme.colors.muted : theme.colors.onInk;
  return (
    <>
      <View style={[styles.corner, styles.topLeft, { borderColor: color }]} />
      <View style={[styles.corner, styles.topRight, { borderColor: color }]} />
      <View style={[styles.corner, styles.bottomLeft, { borderColor: color }]} />
      <View style={[styles.corner, styles.bottomRight, { borderColor: color }]} />
    </>
  );
}

const CORNER = 48;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.scannerBg },
  flex: { flex: 1 },
  bold: { fontFamily: theme.fonts.bold },
  center: { textAlign: 'center' },
  pressed: { opacity: 0.85 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md },
  slot: { width: 52 },
  title: { flex: 1, textAlign: 'center', fontFamily: theme.fonts.bold },
  viewfinderArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xl, padding: theme.spacing.lg },
  viewfinderAreaShort: { gap: theme.spacing.md, padding: theme.spacing.md },
  aim: { textAlign: 'center' },
  frame: {
    aspectRatio: FRAME_RATIO,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.scannerSurface,
    justifyContent: 'center',
  },
  paused: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(22,22,22,0.85)' },
  scanLine: { height: 2, marginHorizontal: '10%', backgroundColor: theme.colors.onInk, opacity: 0.9 },
  autoRead: { color: '#C9C8C3', textAlign: 'center' },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: theme.colors.onInk },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: theme.radius.lg },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: theme.radius.lg },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: theme.radius.lg },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: theme.radius.lg,
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.sheet,
    borderTopRightRadius: theme.radius.sheet,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  panelContent: { gap: theme.spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 60,
    padding: theme.spacing.sm,
    paddingLeft: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.field,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: { fontFamily: theme.fonts.bold },
  searching: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, minHeight: 120, justifyContent: 'center' },
  tip: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  firstAction: { marginTop: theme.spacing.sm },
  alertIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOff: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
