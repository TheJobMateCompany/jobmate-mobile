/**
 * Skeleton — placeholder shimmer animé (Reanimated 3)
 * Phase 2.1
 *
 * - Animation shimmer via interpolation d'opacité (Reanimated 3 worklet)
 * - Respecte `reduce-motion` : fond statique si activé
 * - Accepte width / height / borderRadius pour s'adapter à n'importe quel contexte
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

export interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius, style }: SkeletonProps) {
  const { colors, radius } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);

  const opacity = useSharedValue(1);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
    });
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

    opacity.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1, // infini
      false,
    );
  }, [reduceMotion, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 1 : opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width,
          height,
          borderRadius: borderRadius ?? radius.md,
          backgroundColor: colors.surfaceVariant,
        },
        style,
      ]}
      accessibilityLabel="Chargement…"
      accessibilityRole="progressbar"
    />
  );
}
