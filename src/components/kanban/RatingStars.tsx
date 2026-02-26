/**
 * RatingStars — Phase 5.2
 *
 * 5 étoiles tappables pour noter une candidature (1–5).
 * - Valeur 0 = aucune note
 * - Haptic Impact.Light au tap
 * - `readOnly` pour l'affichage seul
 *
 * Utilisé par :
 *   src/components/kanban/KanbanCard.tsx  (lecture seule, mini)
 *   app/(app)/kanban/[id].tsx             (interactif, taille normale)
 */

import { View, TouchableOpacity, Text, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RatingStarsProps {
  value: number | null;
  onChange?: (rating: number) => void;
  /** true = pas de pression possible */
  readOnly?: boolean;
  /** Taille de cada étoile en dp (défaut : 20) */
  size?: number;
  style?: ViewStyle;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function RatingStars({
  value,
  onChange,
  readOnly = false,
  size = 20,
  style,
}: RatingStarsProps) {
  const { colors, spacing } = useTheme();
  const current = value ?? 0;

  const handlePress = (star: number) => {
    if (readOnly || !onChange) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Retap sur la même étoile → reset à 0
    onChange(star === current ? 0 : star);
  };

  return (
    <View
      style={[{ flexDirection: 'row', gap: 2 }, style]}
      accessibilityRole={readOnly ? 'text' : 'adjustable'}
      accessibilityLabel={`Note : ${current} étoile${current !== 1 ? 's' : ''} sur 5`}
      accessibilityValue={{ min: 0, max: 5, now: current }}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1;
        const filled = star <= current;
        return (
          <TouchableOpacity
            key={star}
            onPress={() => handlePress(star)}
            disabled={readOnly}
            activeOpacity={readOnly ? 1 : 0.7}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={`${star} étoile${star !== 1 ? 's' : ''}`}
            accessibilityState={{ selected: filled }}
          >
            <Text
              style={{
                fontSize: size,
                lineHeight: size + 4,
                color: filled ? colors.warning : colors.border,
              }}
            >
              {filled ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
