import { useColorScheme } from 'react-native';
import { useStore, type ThemeSetting } from '@/state/store';

/**
 * Monochrome design system (black and white UI, grayscale artwork).
 *
 * Token names are kept stable so every component restyles from here.
 * "accent" is now simply the foreground colour: no saffron, gold or other hues.
 * Greys are used only for secondary text and hairlines, and every text/background
 * pairing meets WCAG AA (4.5:1) or better.
 */
export interface Palette {
  name: 'light' | 'dark';
  isDark: boolean;
  background: string;
  surface: string;
  surfaceAlt: string;
  /** Thin borders on cards, inputs and dividers. */
  border: string;
  /** Strong borders: outlined buttons, selected states. */
  borderStrong: string;
  text: string;
  /** Secondary text. #B3B3B3 on black = 9.6:1, #4D4D4D on white = 8.5:1. */
  textMuted: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  /** Former gold ornament token, now a neutral hairline. */
  gold: string;
  recitation: string;
  success: string;
  danger: string;
  /** Overlay used over artwork. Always dark, independent of theme. */
  scrim: string;
}

const light: Palette = {
  name: 'light',
  isDark: false,
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F2F2F2',
  border: '#D9D9D9',
  borderStrong: '#000000',
  text: '#000000',
  textMuted: '#4D4D4D',
  accent: '#000000',
  accentSoft: '#F2F2F2',
  onAccent: '#FFFFFF',
  gold: '#BFBFBF',
  recitation: '#FFFFFF',
  success: '#000000',
  danger: '#000000',
  scrim: 'rgba(0,0,0,0.55)',
};

const dark: Palette = {
  name: 'dark',
  isDark: true,
  background: '#000000',
  surface: '#000000',
  surfaceAlt: '#111111',
  border: '#333333',
  borderStrong: '#FFFFFF',
  text: '#FFFFFF',
  textMuted: '#B3B3B3',
  accent: '#FFFFFF',
  accentSoft: '#141414',
  onAccent: '#000000',
  gold: '#4D4D4D',
  recitation: '#000000',
  success: '#FFFFFF',
  danger: '#FFFFFF',
  scrim: 'rgba(0,0,0,0.55)',
};

export const palettes = { light, dark };

export function resolvePalette(setting: ThemeSetting, system: 'light' | 'dark' | null | undefined): Palette {
  if (setting === 'system') return system === 'dark' ? dark : light;
  return setting === 'dark' ? dark : light;
}

export function usePalette(): Palette {
  const setting = useStore((s) => s.settings.theme);
  const system = useColorScheme();
  return resolvePalette(setting, system);
}

/** Artwork areas (Home hero, deity cards) are always dark, whatever the theme. */
export const artworkPalette = dark;

export const fonts = {
  ui: {
    regular: 'NotoSansDevanagari_400Regular',
    medium: 'NotoSansDevanagari_500Medium',
    semibold: 'NotoSansDevanagari_600SemiBold',
    bold: 'NotoSansDevanagari_700Bold',
  },
  recitation: {
    regular: 'NotoSerifDevanagari_400Regular',
    semibold: 'NotoSerifDevanagari_600SemiBold',
  },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
/** Sharp, rectangular geometry throughout. */
export const radius = { sm: 0, md: 0, lg: 0, pill: 0 };
/** Tracking for uppercase Latin labels (no effect on Devanagari). */
export const TRACKING = 1.6;
export const MAX_CONTENT_WIDTH = 760;
export const TOUCH = 48;
