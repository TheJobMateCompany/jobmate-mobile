/**
 * ScoreRing — Phase 4.2
 *
 * Cercle SVG animé affichant le score IA d'une offre [0–100].
 * Animation ease-out 800 ms via Reanimated 3 (worklet SVG props).
 * Couleur :
 *   < 40  → danger  (rouge)
 *   40-69 → warning (orange)
 *   ≥ 70  → success (vert)
 *
 * Technique :
 *   - Circle SVG avec stroke-dasharray = circumference
 *   - stroke-dashoffset animé de circumference (0%) → offset cible
 *   - Animated.Code via useAnimatedProps de Reanimated 3
 *
 * Utilisé par :
 *   app/(app)/feed/[id].tsx — détail de l'offre
 */

import { useEffect } from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

// ─── Setup Animated Circle ────────────────────────────────────────────────────

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ScoreRingProps {
  /** Score entre 0 et 100 */
  score: number;
  /** Diamètre du cercle en dp (défaut : 80) */
  size?: number;
  /** Épaisseur du trait en dp (défaut : 8) */
  strokeWidth?: number;
  style?: ViewStyle;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function ScoreRing({ score, size = 80, strokeWidth = 8, style }: ScoreRingProps) {
  const { colors, typography } = useTheme();

  const clampedScore = Math.min(100, Math.max(0, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Couleur selon le score
  const ringColor =
    clampedScore >= 70 ? colors.success : clampedScore >= 40 ? colors.warning : colors.danger;

  const textColor = ringColor;

  // Animation : commence à circumference (0%), va vers dashoffset cible
  const targetOffset = circumference * (1 - clampedScore / 100);
  const dashOffset = useSharedValue(circumference); // départ = vide

  useEffect(() => {
    dashOffset.value = withTiming(targetOffset, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [dashOffset, targetOffset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  const center = size / 2;

  return (
    <View
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clampedScore }}
      accessibilityLabel={`Score IA : ${clampedScore} sur 100`}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Piste de fond */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.surfaceVariant}
          strokeWidth={strokeWidth}
          fill="none"
          rotation="-90"
          originX={center}
          originY={center}
        />
        {/* Arc de progression */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          originX={center}
          originY={center}
        />
      </Svg>

      {/* Score textuel au centre */}
      <Text style={[typography.headingMedium, { color: textColor, fontWeight: '700' }]}>
        {clampedScore}
      </Text>
    </View>
  );
}
