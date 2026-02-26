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
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';

export interface EmptyFeedProps {
  /** Texte du CTA (défaut : « Configurer une recherche ») */
  ctaLabel?: string;
  onCtaPress?: () => void;
  style?: ViewStyle;
}

export function EmptyFeed({
  ctaLabel,
  onCtaPress,
  style,
}: EmptyFeedProps) {
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();
  const label = ctaLabel ?? t('profile.searchConfigs.add');

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
        {t('feed.empty')}
      </Text>

      <Text
        style={[
          typography.bodyMedium,
          { color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
        ]}
      >
        {t('feed.emptySubtitle')}
      </Text>

      {onCtaPress && (
        <Button
          label={label}
          onPress={onCtaPress}
          variant="secondary"
          style={{ marginTop: spacing.sm }}
        />
      )}
    </View>
  );
}
