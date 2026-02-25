/**
 * SkillChip — Phase 3.5
 *
 * Chip de compétence :
 * - Couleur de fond `primaryLight`, texte `primary` (tokens thème)
 * - Bouton "×" de suppression optionnel (masqué en mode lecture seule)
 * - Feedback haptique léger au press
 *
 * Utilisé par :
 *   app/(app)/profile/index.tsx     — mode readonly (editable=false)
 *   app/(app)/profile/edit.tsx      — mode édition (editable=true)
 */

import { View, Text, TouchableOpacity, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface SkillChipProps {
  label: string;
  /** Active le bouton de suppression */
  editable?: boolean;
  onRemove?: (label: string) => void;
  style?: ViewStyle;
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function SkillChip({ label, editable = false, onRemove, style }: SkillChipProps) {
  const { colors, spacing, radius, typography } = useTheme();

  const handleRemove = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRemove?.(label);
  };

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.primaryLight,
          borderRadius: radius.full,
          paddingVertical: spacing.xs / 2,
          paddingLeft: spacing.sm,
          paddingRight: editable ? spacing.xs : spacing.sm,
          gap: spacing.xs / 2,
          alignSelf: 'flex-start',
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
        {label}
      </Text>

      {editable && (
        <TouchableOpacity
          onPress={handleRemove}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel={`Supprimer la compétence ${label}`}
        >
          <Text
            style={[
              typography.caption,
              { color: colors.primary, fontWeight: '700', lineHeight: 16 },
            ]}
          >
            ×
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
