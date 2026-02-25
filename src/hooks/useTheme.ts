/**
 * useTheme — Hook consommateur du ThemeContext
 *
 * Usage :
 *   const { theme, mode, setMode } = useTheme();
 *   const { colors, typography, spacing } = theme;
 *
 *   // Dans un StyleSheet :
 *   backgroundColor: colors.background
 *   color: colors.textPrimary
 */

import { useThemeContext } from '../context/ThemeContext';
import type { Theme, ThemeMode } from '../types/theme';

interface UseThemeReturn {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  /** Raccourci vers theme.colors */
  colors: Theme['colors'];
  /** Raccourci vers theme.typography */
  typography: Theme['typography'];
  /** Raccourci vers theme.spacing */
  spacing: Theme['spacing'];
  /** Raccourci vers theme.radius */
  radius: Theme['radius'];
  /** Raccourci vers theme.shadows */
  shadows: Theme['shadows'];
  /** true si le thème effectif est sombre */
  isDark: boolean;
}

export function useTheme(): UseThemeReturn {
  const { theme, mode, setMode } = useThemeContext();

  return {
    theme,
    mode,
    setMode,
    colors: theme.colors,
    typography: theme.typography,
    spacing: theme.spacing,
    radius: theme.radius,
    shadows: theme.shadows,
    isDark: theme.mode === 'dark',
  };
}
