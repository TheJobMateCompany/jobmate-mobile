/**
 * Types du système de thème — Phase 1.2
 * Tokens alignés avec docs/MOBILE_UI_UX.md §1.1 – §1.4
 */

export type ThemeMode = 'light' | 'dark' | 'system';

// ─── Couleurs ─────────────────────────────────────────────────────────────────

export interface ThemeColors {
  // Brand
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Sémantiques
  success: string;
  warning: string;
  danger: string;

  // Surfaces
  background: string;
  surface: string;
  surfaceVariant: string;
  border: string;
  overlay: string;

  // Texte
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
}

// ─── Typographie ──────────────────────────────────────────────────────────────

export interface TextStyle {
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700';
  lineHeight: number;
  fontFamily: string;
}

export interface ThemeTypography {
  displayLarge: TextStyle;  // 32sp / 700 — Titres onboarding
  displayMedium: TextStyle; // 26sp / 700 — Titre de page
  headingLarge: TextStyle;  // 22sp / 600 — Section header
  headingMedium: TextStyle; // 18sp / 600 — Card title, modal title
  bodyLarge: TextStyle;     // 16sp / 400 — Corps principal
  bodyMedium: TextStyle;    // 14sp / 400 — Descriptions, labels
  bodySmall: TextStyle;     // 12sp / 400 — Méta-données
  label: TextStyle;         // 13sp / 500 — Labels bouton, tabs
  caption: TextStyle;       // 11sp / 400 — Légendes
}

// ─── Espacement ───────────────────────────────────────────────────────────────

export interface ThemeSpacing {
  xs: number;   // 4
  sm: number;   // 8
  md: number;   // 16
  lg: number;   // 24
  xl: number;   // 32
  xxl: number;  // 48
}

// ─── Border radius ────────────────────────────────────────────────────────────

export interface ThemeRadius {
  xs: number;    // 4  — badges
  sm: number;    // 8  — inputs, boutons
  md: number;    // 12 — cards
  lg: number;    // 16 — modals bottom sheet
  xl: number;    // 24 — onboarding cards
  full: number;  // 9999 — avatars, tag pills
}

// ─── Ombres ───────────────────────────────────────────────────────────────────

export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number; // Android
}

export interface ThemeShadows {
  card: ShadowStyle;
  modal: ShadowStyle;
  fab: ShadowStyle;
}

// ─── Theme complet ────────────────────────────────────────────────────────────

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  shadows: ThemeShadows;
}
