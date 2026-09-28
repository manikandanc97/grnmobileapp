/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#123746',
    background: '#F7F9FA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E0E4E8',
    textSecondary: '#71808A',
    primary: '#E79524',
    primaryText: '#07566A',
    secondaryDark: '#0B3F4D',
    border: '#E8ECEF',
    error: '#D94A4A',
    success: '#16A57A',
  },
  dark: {
    text: '#F7F9FA',
    background: '#121212',
    backgroundElement: '#1E1E1E',
    backgroundSelected: '#2C2C2C',
    textSecondary: '#71808A',
    primary: '#E79524',
    primaryText: '#FFFFFF',
    secondaryDark: '#0B3F4D',
    border: '#333333',
    error: '#D94A4A',
    success: '#16A57A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  // Legacy mappings
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,

  // Modern design tokens
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
