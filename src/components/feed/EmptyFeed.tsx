/**
 * EmptyFeed — Phase 4.2
 *
 * Écran vide affiché quand aucune offre n'est disponible dans le feed.
 * Contient une illustration textuelle, un texte explicatif et un CTA.
 *
 * Utilisé par :
 *   app/(app)/feed/index.tsx
 */

import { View, Text, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';

export interface EmptyFeedProps {
  /** Texte du CTA (défaut : « Configurer une recherche ») */
  ctaLabel?: string;
  onCtaPress?: () => void;
  style?: ViewStyle;
}

export function EmptyFeed({
  ctaLabel = 'Configurer une recherche',
  onCtaPress,
  style,
}: EmptyFeedProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
          gap: spacing.md,
        },
        style,
      ]}
    >
      {/* Illustration textuelle */}
      <Text style={{ fontSize: 64, lineHeight: 72 }} accessibilityLabel="Loupe">
        🔍
      </Text>

      <Text style={[typography.headingMedium, { color: colors.textPrimary, textAlign: 'center' }]}>
        Aucune offre pour l'instant
      </Text>

      <Text
        style={[
          typography.bodyMedium,
          { color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
        ]}
      >
        L'IA recherche des offres correspondant à vos configurations.
        {'\n'}Revenez dans quelques instants ou ajoutez une nouvelle configuration de recherche.
      </Text>

      {onCtaPress && (
        <Button
          label={ctaLabel}
          onPress={onCtaPress}
          variant="secondary"
          style={{ marginTop: spacing.sm }}
        />
      )}
    </View>
  );
}
