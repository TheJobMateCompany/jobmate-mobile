/**
 * SwipeRow — Phase 4.2
 *
 * Wrapper swipeable pour une carte d'offre :
 *   - Swipe DROITE → approve  (fond success vert)
 *   - Swipe GAUCHE → reject   (fond danger  rouge)
 *
 * Fonctionnement :
 *   1. Pan gesture détecté via GestureDetector + Gesture.Pan() (RNGH v2)
 *   2. translateX animé via Reanimated 3 shared value
 *   3. Au seuil THRESHOLD (120 dp), haptic Impact.Medium émis une seule fois
 *   4. Au release : si |translateX| >= THRESHOLD → callback onApprove/onReject
 *      puis animation de sortie (carte glisse hors écran) ; sinon spring retour
 *
 * ⚠️  Requiert GestureHandlerRootView dans app/_layout.tsx (déjà noté ROADMAP).
 *
 * Utilisé par :
 *   app/(app)/feed/index.tsx
 */

import { useCallback } from 'react';
import { View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Distance en dp au-delà de laquelle l'action est déclenchée au release */
const THRESHOLD = 120;
/** Distance à laquelle le haptic est émis (pré-confirmation) */
const HAPTIC_THRESHOLD = THRESHOLD * 0.7;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SwipeRowProps {
  children: React.ReactNode;
  onApprove?: () => void;
  onReject?: () => void;
  /** Désactive le swipe (pendant une mutation en cours) */
  disabled?: boolean;
  style?: ViewStyle;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function SwipeRow({
  children,
  onApprove,
  onReject,
  disabled = false,
  style,
}: SwipeRowProps) {
  const { colors } = useTheme();
  const translateX = useSharedValue(0);
  const hapticTriggered = useSharedValue(false);

  const triggerHaptic = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-10, 10]) // évite la capture des ScrollView verticaux
    .onUpdate((e) => {
      translateX.value = e.translationX;

      // Haptic au seuil de pré-confirmation (une seule fois par swipe)
      if (!hapticTriggered.value && Math.abs(e.translationX) >= HAPTIC_THRESHOLD) {
        hapticTriggered.value = true;
        runOnJS(triggerHaptic)();
      }
    })
    .onEnd(() => {
      hapticTriggered.value = false;

      if (translateX.value >= THRESHOLD && onApprove) {
        // Sortie vers la droite
        translateX.value = withTiming(500, { duration: 250 }, () => {
          runOnJS(onApprove)();
        });
      } else if (translateX.value <= -THRESHOLD && onReject) {
        // Sortie vers la gauche
        translateX.value = withTiming(-500, { duration: 250 }, () => {
          runOnJS(onReject)();
        });
      } else {
        // Retour en place (spring)
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  // Style animé de la carte
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Opacité du fond approve (droit)
  const approveBackgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  // Opacité du fond reject (gauche)
  const rejectBackgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={[{ position: 'relative', overflow: 'hidden', borderRadius: 12 }, style]}>
      {/* Fond approve (vert, révélé lors du swipe droit) */}
      <Animated.View
        style={[
          {
            ...backgroundStyle,
            backgroundColor: colors.success,
            justifyContent: 'flex-end',
            alignItems: 'center',
            flexDirection: 'row',
            paddingRight: 24,
          },
          approveBackgroundStyle,
        ]}
        pointerEvents="none"
      >
        <Animated.Text style={{ fontSize: 28 }}>✓</Animated.Text>
      </Animated.View>

      {/* Fond reject (rouge, révélé lors du swipe gauche) */}
      <Animated.View
        style={[
          {
            ...backgroundStyle,
            backgroundColor: colors.danger,
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexDirection: 'row',
            paddingLeft: 24,
          },
          rejectBackgroundStyle,
        ]}
        pointerEvents="none"
      >
        <Animated.Text style={{ fontSize: 28 }}>✕</Animated.Text>
      </Animated.View>

      {/* Carte principale */}
      <GestureDetector gesture={pan}>
        <Animated.View
          style={cardStyle}
          accessible
          accessibilityActions={[
            { name: 'approve', label: 'Valider cette offre' },
            { name: 'reject', label: 'Rejeter cette offre' },
          ]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'approve' && onApprove) onApprove();
            if (event.nativeEvent.actionName === 'reject' && onReject) onReject();
          }}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const backgroundStyle = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  borderRadius: 12,
};
