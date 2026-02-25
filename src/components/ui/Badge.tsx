/**
 * Badge — étiquette colorée depuis les tokens de thème
 * Phase 2.1
 *
 * Variantes sémantiques : primary | success | warning | danger | neutral
 */

import { View, Text, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  const { colors, spacing, radius, typography } = useTheme();

  const backgroundMap: Record<BadgeVariant, string> = {
    primary: colors.primaryLight,
    success: '#D1FAE5',
    warning: '#FEF3C7',
    danger: '#FEE2E2',
    neutral: colors.surfaceVariant,
  };

  const textMap: Record<BadgeVariant, string> = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    neutral: colors.textSecondary,
  };

  return (
    <View
      style={[
        {
          backgroundColor: backgroundMap[variant],
          borderRadius: radius.full,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs / 2,
          alignSelf: 'flex-start',
        },
        style,
      ]}
      accessibilityRole="text"
    >
      <Text style={[typography.caption, { color: textMap[variant], fontWeight: '600' }]}>
        {label}
      </Text>
    </View>
  );
}
