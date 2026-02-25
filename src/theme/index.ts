/**
 * theme/index.ts — Point d'entrée unique du système de design
 *
 * Exports :
 *   lightTheme / darkTheme  — objets Theme complets
 *   getTheme(mode)          — retourne le bon thème selon le mode effectif
 */

import { lightColors, darkColors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';
import type { Theme } from '../types/theme';

export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  typography,
  spacing,
  radius,
  shadows,
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  typography,
  spacing,
  radius,
  shadows,
};

/**
 * Retourne le thème correspondant au mode effectif résolu ('light' | 'dark').
 */
export function getTheme(resolvedMode: 'light' | 'dark'): Theme {
  return resolvedMode === 'dark' ? darkTheme : lightTheme;
}

// Ré-exports pour faciliter l'accès direct aux tokens
export { lightColors, darkColors } from './colors';
export { typography } from './typography';
export { spacing } from './spacing';
export { radius } from './radius';
export { shadows } from './shadows';
export type { Theme, ThemeMode } from '../types/theme';
