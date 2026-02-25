/**
 * AnalysisBadge — Phase 4.2
 *
 * Chip indiquant l'état de l'analyse IA :
 *   - `analyzed = false` → « IA en cours… » avec animation clignotante (Reanimated 3)
 *   - `analyzed = true`  → « Analysé » badge statique success
 *
 * Utilisé par :
 *   src/components/feed/JobCard.tsx   — badge inline
 *   app/(app)/feed/[id].tsx           — badge en tête de l'écran détail
 */

import { useEffect } from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

export interface AnalysisBadgeProps {
  /** true si l'analyse IA est terminée */
  analyzed?: boolean;
  style?: ViewStyle;
}

export function AnalysisBadge({ analyzed = false, style }: AnalysisBadgeProps) {
  const { colors, spacing, radius, typography } = useTheme();

  const opacity = useSharedValue(1);

  useEffect(() => {
    if (analyzed) {
      opacity.value = 1;
      return;
    }
    // Clignotement régulier tant que non analysé
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 600 }),
        withTiming(1, { duration: 600 }),
      ),
      -1, // infini
      false,
    );

    return () => {
      // Arrêt propre à l'unmount ou quand analyzed devient true
      opacity.value = 1;
    };
  }, [analyzed, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const bgColor = analyzed ? '#D1FAE5' : '#FEF3C7';
  const fgColor = analyzed ? colors.success : colors.warning;
  const label = analyzed ? '✓ Analysé' : '⏳ IA en cours…';

  return (
    <Animated.View
      style={[
        {
          backgroundColor: bgColor,
          borderRadius: radius.full,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs / 2,
          alignSelf: 'flex-start',
        },
        analyzed ? undefined : animatedStyle,
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Text
        style={[
          typography.caption,
          { color: fgColor, fontWeight: '600' },
        ]}
      >
        {label}
      </Text>
    </Animated.View>
  );
}
