/**
 * Button — composant de base réutilisable
 * Phase 2.1
 *
 * Variantes : primary | secondary | ghost | danger
 * States    : idle | loading | disabled
 * Haptic    : useHaptics().impact() au press
 */

import {
  TouchableOpacity,
  ActivityIndicator,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  /** Accessibilité — accessible par défaut via label */
  accessibilityLabel?: string;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const { impact } = useHaptics();

  const handlePress = () => {
    if (loading || disabled) return;
    impact(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle = {
    ...styles.base,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    opacity: isDisabled ? 0.5 : 1,
    ...(variant === 'primary' && { backgroundColor: colors.primary }),
    ...(variant === 'secondary' && {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primary,
    }),
    ...(variant === 'ghost' && { backgroundColor: 'transparent' }),
    ...(variant === 'danger' && { backgroundColor: colors.danger }),
  };

  const labelStyle: TextStyle = {
    ...typography.label,
    textAlign: 'center',
    ...(variant === 'primary' && { color: '#FFFFFF' }),
    ...(variant === 'secondary' && { color: colors.primary }),
    ...(variant === 'ghost' && { color: colors.textPrimary }),
    ...(variant === 'danger' && { color: '#FFFFFF' }),
  };

  const spinnerColor = variant === 'secondary' || variant === 'ghost' ? colors.primary : '#FFFFFF';

  return (
    <TouchableOpacity
      style={[containerStyle, style]}
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <Text style={labelStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
});
