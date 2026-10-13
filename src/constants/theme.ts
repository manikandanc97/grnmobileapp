/**
 * GRN Construction - Enterprise Design System Foundation
 */

import '@/global.css';

import { Platform } from 'react-native';

export const BrandColors = {
  primary: '#07566A',
  accent: '#C9863F',
  accentInk: '#865320',
  accentBg: '#FBF1E4',
  brand: '#07566A',
  brandSecondary: '#0B5364',
  background: '#F5F4EF',
  surface: '#FFFFFF',
  text: '#173C43',
  textSecondary: '#607376',
  muted: '#67797B',
  success: '#247252',
  warning: '#94601E',
  error: '#B8413D',
  info: '#07566A',

  // Subtle backgrounds for status/badges
  successBg: '#EDF6EF',
  warningBg: '#FBF1E4',
  errorBg: '#FCF0EE',
  infoBg: '#E8F2F2',
  primaryBg: '#E8F2F2',
  brandBg: '#E8F2F2',

  // Borders
  border: '#DFE7E3',
  borderSubtle: '#EDF1EE',
  borderStrong: '#BBCDC8',
} as const;

export const Colors = {
  light: {
    // New Semantic Tokens
    text: BrandColors.text,
    textSecondary: BrandColors.textSecondary,
    textMuted: BrandColors.muted,
    
    background: BrandColors.background,
    surface: BrandColors.surface,
    surfaceMuted: '#F0F4F1',
    accent: BrandColors.accent,
    accentInk: BrandColors.accentInk,
    accentBg: BrandColors.accentBg,
    onPrimary: '#FFFFFF',
    backdrop: 'rgba(23, 60, 67, 0.45)',
    
    border: BrandColors.border,
    borderSubtle: BrandColors.borderSubtle,
    borderStrong: BrandColors.borderStrong,
    
    primary: BrandColors.primary,
    primaryPressed: '#064453',
    
    success: BrandColors.success,
    warning: BrandColors.warning,
    error: BrandColors.error,
    info: BrandColors.info,

    successBg: BrandColors.successBg,
    warningBg: BrandColors.warningBg,
    errorBg: BrandColors.errorBg,
    infoBg: BrandColors.infoBg,
    primaryBg: BrandColors.primaryBg,
    brandBg: BrandColors.brandBg,

    brand: BrandColors.brand,
    brandSecondary: BrandColors.brandSecondary,
    
    // Legacy mappings for backward compatibility
    /** @deprecated Use surface */
    backgroundElement: BrandColors.surface,
    /** @deprecated Use surfaceMuted */
    backgroundSelected: '#E0E4E8',
    /** @deprecated Use text */
    primaryText: BrandColors.text,
    /** @deprecated Use brandSecondary */
    secondaryDark: BrandColors.brandSecondary,
  },
  dark: {
    text: '#F7F9FA',
    textSecondary: '#A7C4CC',
    textMuted: '#71808A',
    
    accent: BrandColors.accent,
    accentInk: '#F2C797',
    accentBg: '#3C3024',
    onPrimary: '#FFFFFF',
    backdrop: 'rgba(0, 0, 0, 0.65)',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceMuted: '#2C2C2C',
    
    border: '#333333',
    borderSubtle: '#262626',
    borderStrong: '#444444',
    
    primary: BrandColors.primary,
    primaryPressed: '#C47A15',
    
    success: BrandColors.success,
    warning: BrandColors.warning,
    error: BrandColors.error,
    info: BrandColors.info,

    successBg: 'rgba(22, 165, 122, 0.2)',
    warningBg: 'rgba(245, 158, 11, 0.2)',
    errorBg: 'rgba(220, 38, 38, 0.2)',
    infoBg: 'rgba(37, 99, 235, 0.2)',
    primaryBg: 'rgba(231, 149, 36, 0.2)',
    brandBg: 'rgba(7, 86, 106, 0.2)',

    brand: BrandColors.brand,
    brandSecondary: BrandColors.brandSecondary,
    
    // Legacy mappings for backward compatibility
    /** @deprecated Use surface */
    backgroundElement: '#1E1E1E',
    /** @deprecated Use surfaceMuted */
    backgroundSelected: '#2C2C2C',
    /** @deprecated Use text */
    primaryText: '#FFFFFF',
    /** @deprecated Use brandSecondary */
    secondaryDark: '#0B3F4D',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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

export const Typography = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
  pageTitle: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
  sectionTitle: { fontSize: 18, lineHeight: 26, fontWeight: '600' as const },
  cardTitle: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  secondary: { fontSize: 13, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  label: { fontSize: 12, fontWeight: '600' as const },
  button: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
} as const;

export const Spacing = {
  // Modern design tokens
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,

  // Legacy mappings (Deprecated)
  /** @deprecated Use 'xs' (4) */
  half: 2,
  /** @deprecated Use 'xs' (4) or 'sm' (8) */
  one: 4,
  /** @deprecated Use 'sm' (8) */
  two: 8,
  /** @deprecated Use 'md' (16) */
  three: 16,
  /** @deprecated Use 'lg' (24) */
  four: 24,
  /** @deprecated Use 'xl' (32) */
  five: 32,
  /** @deprecated Use '3xl' (64) */
  six: 64,
} as const;

export const Radius = {
  xs: 6,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#07566A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.025,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#07566A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#07566A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 6,
  },
  glow: {
    shadowColor: BrandColors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
} as const;

export const IconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export const TouchTargets = {
  min: 44,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
