/**
 * ThemeContext — Gestion du thème global (light / dark / system)
 *
 * - Détecte automatiquement le thème système via useColorScheme()
 * - Persiste le choix utilisateur en AsyncStorage (@theme_mode)
 * - Expose : theme (tokens complets), mode, setMode()
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getTheme } from '../theme';
import { getPreference, savePreference, STORAGE_KEYS } from '../lib/storage';
import type { Theme, ThemeMode } from '../types/theme';

// ─── Context shape ────────────────────────────────────────────────────────────

interface ThemeContextValue {
  /** Thème complet (tokens couleurs, typo, espacement…) */
  theme: Theme;
  /** Mode choisi par l'utilisateur : 'light' | 'dark' | 'system' */
  mode: ThemeMode;
  /** Changer le mode et persister en AsyncStorage */
  setMode: (mode: ThemeMode) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  // Rehydrater le mode persisté au démarrage
  useEffect(() => {
    void getPreference(STORAGE_KEYS.THEME_MODE).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
      setIsReady(true);
    });
  }, []);

  // Résoudre le mode effectif : 'system' → valeur système réelle
  const resolvedMode: 'light' | 'dark' = useMemo(() => {
    if (mode === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return mode;
  }, [mode, systemScheme]);

  const theme = useMemo(() => getTheme(resolvedMode), [resolvedMode]);

  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    await savePreference(STORAGE_KEYS.THEME_MODE, newMode);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, mode, setMode }),
    [theme, mode, setMode],
  );

  // Ne rendre rien tant que le mode persisté n'est pas rehydraté
  // pour éviter un flash de couleurs incorrect
  if (!isReady) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ─── Hook interne (utilisé par useTheme.ts) ───────────────────────────────────

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext doit être utilisé dans <ThemeProvider>');
  }
  return ctx;
}
