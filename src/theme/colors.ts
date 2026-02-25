/**
 * Tokens de couleurs — light & dark
 * Source : docs/MOBILE_UI_UX.md §1.1
 */

import type { ThemeColors } from '../types/theme';

export const lightColors: ThemeColors = {
  // Brand
  primary: '#4F46E5',
  primaryLight: '#EDE9FE',
  primaryDark: '#3730A3',

  // Sémantiques
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',

  // Surfaces
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceVariant: '#EEF1F5',
  border: '#E5E7EB',
  overlay: 'rgba(0,0,0,0.4)',

  // Texte
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#D1D5DB',
};

export const darkColors: ThemeColors = {
  // Brand
  primary: '#6D63FF',
  primaryLight: '#1E1B3D',
  primaryDark: '#5A51D9',

  // Sémantiques
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',

  // Surfaces
  background: '#0F0F14',
  surface: '#1A1A24',
  surfaceVariant: '#252535',
  border: '#2D2D3F',
  overlay: 'rgba(0,0,0,0.65)',

  // Texte
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textDisabled: '#4B5563',
};
