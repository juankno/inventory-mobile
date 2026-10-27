// Tema base. Área táctil mínima de 48 × 48 dp y texto de 16 sp (RIU-02, M-12).
export const theme = {
  colors: {
    primary: '#1B5E20',
    background: '#FFFFFF',
    text: '#1A1A1A',
    muted: '#5F6368',
    danger: '#B3261E',
  },
  spacing: { sm: 8, md: 16, lg: 24 },
  fontSize: { body: 16, title: 22 },
  minTouchSize: 48,
} as const;
