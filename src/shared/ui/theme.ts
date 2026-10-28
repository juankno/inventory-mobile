// Tema de la app según el diseño de interfaz (docs/diseno): monocromático,
// fondo hueso, superficies blancas redondeadas y controles tipo píldora.
// Área táctil mínima de 48 × 48 dp y texto de al menos 16 sp (RIU-02, M-12).
export const theme = {
  colors: {
    background: '#F1F0EC',
    surface: '#FFFFFF',
    field: '#F1F0EC',
    border: '#E7E6E1',
    ink: '#1F1F1E',
    onInk: '#FFFFFF',
    text: '#1F1F1E',
    secondary: '#6B6A66',
    muted: '#8C8B85',
    disabled: '#A3A29D',
    warningBg: '#FDEFD9',
    warningText: '#8A4B00',
    warningDot: '#E08A00',
    dangerBg: '#F8E1DF',
    dangerText: '#8E1B12',
    dangerDot: '#B3261E',
    success: '#1E7A4C',
    scannerBg: '#161616',
    scannerSurface: '#262626',
    scannerButton: '#333333',
  },
  fonts: {
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    semibold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    extrabold: 'Manrope_800ExtraBold',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 20, xl: 24, xxl: 32 },
  radius: { md: 16, lg: 24, sheet: 32, pill: 999 },
  fontSize: { caption: 16, body: 16, label: 16, lead: 17, title: 19, heading: 24, display: 32 },
  // Con la letra grande del sistema, los números y títulos enormes crecen hasta
  // este factor; el resto del texto crece sin límite.
  maxFontScale: { display: 1.4, number: 1.25 },
  minTouchSize: 48,
  controlHeight: 56,
  buttonHeight: 60,
} as const;
