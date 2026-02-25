/**
 * Tokens typographiques — Inter
 * Source : docs/MOBILE_UI_UX.md §1.2
 *
 * La police Inter est chargée via @expo-google-fonts/inter dans ThemeContext.
 * Tous les composants utilisent ces tokens — jamais de fontSize/fontWeight hardcodés.
 */

import type { ThemeTypography } from '../types/theme';

const FONT_FAMILY = 'Inter_400Regular';

export const typography: ThemeTypography = {
  displayLarge: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    fontFamily: 'Inter_700Bold',
  },
  displayMedium: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    fontFamily: 'Inter_700Bold',
  },
  headingLarge: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 30,
    fontFamily: 'Inter_600SemiBold',
  },
  headingMedium: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    fontFamily: 'Inter_600SemiBold',
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    fontFamily: FONT_FAMILY,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    fontFamily: FONT_FAMILY,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    fontFamily: FONT_FAMILY,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    fontFamily: 'Inter_500Medium',
  },
  caption: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 16,
    fontFamily: FONT_FAMILY,
  },
};
