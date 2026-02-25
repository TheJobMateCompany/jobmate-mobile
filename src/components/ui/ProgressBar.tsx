/**
 * ProgressBar — barre de progression linéaire animée
 * Phase 2.1 — utilisée principalement pour l'upload CV
 *
 * `progress` : valeur entre 0 et 1
 */

import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

export interface ProgressBarProps {
  /** Valeur entre 0 et 1 */
  progress: number;
  /** Afficher le pourcentage en texte (défaut : false) */
  showLabel?: boolean;
  /** Hauteur de la barre en dp (défaut : 6) */
  trackHeight?: number;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  showLabel = false,
  trackHeight = 6,
  style,
}: ProgressBarProps) {
  const { colors, radius, spacing, typography } = useTheme();

  const clampedProgress = Math.min(1, Math.max(0, progress));

  const animatedFill = useAnimatedStyle(() => ({
    width: withTiming(`${clampedProgress * 100}%` as `${number}%`, { duration: 300 }),
  }));

  return (
    <View style={[styles.wrapper, style]}>
      {showLabel && (
        <Text
          style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.xs }]}
        >
          {Math.round(clampedProgress * 100)} %
        </Text>
      )}
      <View
        style={[
          styles.track,
          {
            height: trackHeight,
            borderRadius: radius.full,
            backgroundColor: colors.surfaceVariant,
          },
        ]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(clampedProgress * 100) }}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            animatedFill,
            {
              borderRadius: radius.full,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  track: {
    overflow: 'hidden',
    position: 'relative',
  },
});
