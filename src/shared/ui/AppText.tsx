import { StyleSheet, Text, type TextProps } from 'react-native';

import { theme } from './theme';

type Variant = 'display' | 'heading' | 'title' | 'lead' | 'body' | 'bodyStrong' | 'label' | 'caption';
type Tone = 'default' | 'secondary' | 'muted' | 'inverse' | 'danger' | 'warning';

type Props = TextProps & { variant?: Variant; tone?: Tone };

// Texto con la tipografía del diseño (Manrope). En Android las fuentes
// personalizadas no combinan con fontWeight, por eso cada peso es una familia.
export function AppText({ variant = 'body', tone = 'default', style, ...props }: Props) {
  return <Text style={[styles[variant], tones[tone], style]} {...props} />;
}

// Título en dos tonos del diseño: primera línea negra, segunda gris.
export function Headline({ strong, soft, size = 'display' }: { strong: string; soft?: string; size?: 'display' | 'hero' }) {
  const style = size === 'hero' ? styles.hero : styles.display;
  return (
    <Text accessibilityRole="header" style={[style, tones.default]}>
      {strong}
      {soft ? <Text style={tones.muted}>{`\n${soft}`}</Text> : null}
    </Text>
  );
}

const tones = StyleSheet.create({
  default: { color: theme.colors.text },
  secondary: { color: theme.colors.secondary },
  muted: { color: theme.colors.muted },
  inverse: { color: theme.colors.onInk },
  danger: { color: theme.colors.dangerText },
  warning: { color: theme.colors.warningText },
});

const styles = StyleSheet.create({
  display: {
    fontFamily: theme.fonts.extrabold,
    fontSize: theme.fontSize.display,
    lineHeight: 38,
    letterSpacing: -1,
  },
  hero: { fontFamily: theme.fonts.extrabold, fontSize: 30, lineHeight: 36, letterSpacing: -1 },
  heading: { fontFamily: theme.fonts.bold, fontSize: theme.fontSize.heading, lineHeight: 30, letterSpacing: -0.5 },
  title: { fontFamily: theme.fonts.bold, fontSize: theme.fontSize.title, lineHeight: 26 },
  lead: { fontFamily: theme.fonts.regular, fontSize: theme.fontSize.lead, lineHeight: 25 },
  body: { fontFamily: theme.fonts.regular, fontSize: theme.fontSize.body, lineHeight: 23 },
  bodyStrong: { fontFamily: theme.fonts.semibold, fontSize: theme.fontSize.body, lineHeight: 23 },
  label: { fontFamily: theme.fonts.semibold, fontSize: theme.fontSize.label, lineHeight: 22 },
  caption: { fontFamily: theme.fonts.regular, fontSize: theme.fontSize.caption, lineHeight: 20 },
});
