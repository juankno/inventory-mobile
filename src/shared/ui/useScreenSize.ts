import { useWindowDimensions } from 'react-native';

// Umbrales en dp. El diseño está hecho para un celular de 390 × 844; por debajo
// de estos valores las pantallas reacomodan su contenido.
const NARROW_WIDTH = 380;
const SHORT_HEIGHT = 720;
// Letra del sistema agrandada (Ajustes > Tamaño de fuente) a partir de la cual
// conviene apilar en lugar de poner elementos lado a lado.
const LARGE_FONT_SCALE = 1.15;

export function useScreenSize() {
  const { width, height, fontScale } = useWindowDimensions();
  const largeText = fontScale > LARGE_FONT_SCALE;
  return {
    width,
    height,
    // Poco ancho para poner texto y botón lado a lado.
    narrow: width < NARROW_WIDTH || largeText,
    // Poco alto para ilustraciones y paneles de tamaño fijo.
    short: height < SHORT_HEIGHT || largeText,
  };
}
