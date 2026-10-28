import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { theme } from './theme';

// Íconos de trazo (24 × 24) dibujados con react-native-svg, sin bibliotecas
// de íconos adicionales. Los trazos siguen el estilo de los del diseño.
type Shape =
  | { d: string }
  | { circle: [cx: number, cy: number, r: number]; fill?: boolean }
  | { rect: [x: number, y: number, width: number, height: number, rx: number] };

const icons = {
  box: [
    { d: 'M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z' },
    { d: 'M12 22V12' },
    { d: 'm3.3 7 8.7 5 8.7-5' },
  ],
  bell: [
    { d: 'M10.268 21a2 2 0 0 0 3.464 0' },
    { d: 'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326' },
  ],
  menu: [{ d: 'M4 7h16' }, { d: 'M4 12h16' }, { d: 'M4 17h12' }],
  search: [{ circle: [11, 11, 8] }, { d: 'm21 21-4.3-4.3' }],
  chevronRight: [{ d: 'm9 18 6-6-6-6' }],
  chevronLeft: [{ d: 'm15 18-6-6 6-6' }],
  close: [{ d: 'M18 6 6 18' }, { d: 'm6 6 12 12' }],
  plus: [{ d: 'M5 12h14' }, { d: 'M12 5v14' }],
  minus: [{ d: 'M5 12h14' }],
  arrowUpRight: [{ d: 'M7 7h10v10' }, { d: 'M7 17 17 7' }],
  alert: [{ circle: [12, 12, 10] }, { d: 'M12 8v4' }, { d: 'M12 16h.01' }],
  eye: [
    { d: 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0' },
    { circle: [12, 12, 3] },
  ],
  eyeOff: [
    { d: 'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49' },
    { d: 'M14.084 14.158a3 3 0 0 1-4.242-4.242' },
    { d: 'M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143' },
    { d: 'm2 2 20 20' },
  ],
  lock: [{ rect: [4, 11, 16, 10, 2] }, { d: 'M8 11V7a4 4 0 0 1 8 0v4' }],
  check: [{ d: 'M20 6 9 17l-5-5' }],
  info: [{ circle: [12, 12, 10] }, { d: 'M12 16v-4' }, { d: 'M12 8h.01' }],
  more: [
    { circle: [5, 12, 1.2], fill: true },
    { circle: [12, 12, 1.2], fill: true },
    { circle: [19, 12, 1.2], fill: true },
  ],
  flashlight: [
    { d: 'M18 6c0 2-2 2-2 4v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10c0-2-2-2-2-4V2h12z' },
    { d: 'M6 6h12' },
    { d: 'M12 12v1' },
  ],
  scanBarcode: [
    { d: 'M3 7V5a2 2 0 0 1 2-2h2' },
    { d: 'M17 3h2a2 2 0 0 1 2 2v2' },
    { d: 'M21 17v2a2 2 0 0 1-2 2h-2' },
    { d: 'M7 21H5a2 2 0 0 1-2-2v-2' },
    { d: 'M8 7v10' },
    { d: 'M12 7v10' },
    { d: 'M16 7v10' },
  ],
  keyboard: [
    { rect: [2, 5, 20, 14, 2] },
    { d: 'M6 9h.01' },
    { d: 'M10 9h.01' },
    { d: 'M14 9h.01' },
    { d: 'M18 9h.01' },
    { d: 'M7 15h10' },
  ],
  cameraOff: [
    { d: 'M14.564 14.558a3 3 0 1 1-4.122-4.121' },
    { d: 'm2 2 20 20' },
    { d: 'M20 20H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 .819-.175' },
    { d: 'M9.695 4.024A2 2 0 0 1 10.004 4h3.993a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v7.344' },
  ],
  resize: [{ d: 'M15 3h6v6' }, { d: 'M9 21H3v-6' }, { d: 'm21 3-7 7' }, { d: 'm3 21 7-7' }],
  sun: [
    { circle: [12, 12, 4] },
    { d: 'M12 2v2' },
    { d: 'M12 20v2' },
    { d: 'm4.93 4.93 1.41 1.41' },
    { d: 'm17.66 17.66 1.41 1.41' },
    { d: 'M2 12h2' },
    { d: 'M20 12h2' },
    { d: 'm6.34 17.66-1.41 1.41' },
    { d: 'm19.07 4.93-1.41 1.41' },
  ],
  barcode: [{ rect: [3, 6, 18, 12, 2] }, { d: 'M7 10v4' }, { d: 'M10 10v4' }, { d: 'M13 10v4' }, { d: 'M17 10v4' }],
  share: [
    { circle: [18, 5, 3] },
    { circle: [6, 12, 3] },
    { circle: [18, 19, 3] },
    { d: 'm8.59 13.51 6.83 3.98' },
    { d: 'm15.41 6.51-6.82 3.98' },
  ],
  printer: [
    { d: 'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2' },
    { d: 'M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6' },
    { rect: [6, 14, 12, 8, 1] },
  ],
  qrCode: [
    { rect: [3, 3, 7, 7, 1] },
    { rect: [14, 3, 7, 7, 1] },
    { rect: [3, 14, 7, 7, 1] },
    { d: 'M14 14h3v3h-3z' },
    { d: 'M20 14v.01' },
    { d: 'M20 20h-3' },
    { d: 'M14 20v.01' },
  ],
  pencil: [
    { d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z' },
    { d: 'm15 5 4 4' },
  ],
  logOut: [{ d: 'm16 17 5-5-5-5' }, { d: 'M21 12H9' }, { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' }],
} satisfies Record<string, Shape[]>;

export type IconName = keyof typeof icons;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 24, color = theme.colors.ink, strokeWidth = 2 }: Props) {
  const shapes: Shape[] = icons[name];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shapes.map((shape, index) => {
        if ('d' in shape) return <Path key={index} d={shape.d} />;
        if ('circle' in shape) {
          const [cx, cy, r] = shape.circle;
          return <Circle key={index} cx={cx} cy={cy} r={r} fill={shape.fill ? color : 'none'} />;
        }
        const [x, y, width, height, rx] = shape.rect;
        return <Rect key={index} x={x} y={y} width={width} height={height} rx={rx} />;
      })}
    </Svg>
  );
}

// Logo de la app: tres barras crecientes sobre un cuadrado redondeado (ícono "Surtido").
export function AppLogo({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect width={64} height={64} rx={16} fill={theme.colors.ink} />
      <Rect x={15.5} y={33.5} width={8.5} height={15} rx={3} fill={theme.colors.background} />
      <Rect x={28} y={24.5} width={8.5} height={24} rx={3} fill={theme.colors.background} />
      <Rect x={40.5} y={15.5} width={8.5} height={33} rx={3} fill={theme.colors.background} />
    </Svg>
  );
}
