/**
 * Types du système de thème — à compléter en Phase 1.2
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Brand
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Sémantiques
  success: string;
  warning: string;
  error: string;
  info: string;

  // Surfaces
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;

  // Texte
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  textInverse: string;

  // Tab bar
  tabActive: string;
  tabInactive: string;
}

export interface ThemeTypography {
  h1: { fontSize: number; fontWeight: '700'; lineHeight: number };
  h2: { fontSize: number; fontWeight: '600'; lineHeight: number };
  h3: { fontSize: number; fontWeight: '600'; lineHeight: number };
  body: { fontSize: number; fontWeight: '400'; lineHeight: number };
  bodySmall: { fontSize: number; fontWeight: '400'; lineHeight: number };
  caption: { fontSize: number; fontWeight: '400'; lineHeight: number };
  label: { fontSize: number; fontWeight: '500'; lineHeight: number };
  button: { fontSize: number; fontWeight: '600'; lineHeight: number };
}

export interface ThemeSpacing {
  xxs: number; // 2
  xs: number; // 4
  sm: number; // 8
  md: number; // 12
  lg: number; // 16
  xl: number; // 24
  xxl: number; // 32
  xxxl: number; // 48
}

export interface ThemeRadius {
  xs: number; // 4
  sm: number; // 8
  md: number; // 12
  lg: number; // 16
  xl: number; // 24
  full: number; // 9999
}

export interface ThemeShadow {
  card: object;
  modal: object;
  fab: object;
}

export interface Theme {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  shadows: ThemeShadow;
  mode: 'light' | 'dark';
}
