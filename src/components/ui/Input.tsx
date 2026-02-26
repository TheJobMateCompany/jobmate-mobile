/**
 * Input — champ texte avec label flottant et gestion d'erreur
 * Phase 2.1
 *
 * - Label flottant animé (monte en haut du champ quand focused ou non vide)
 * - Bord rouge + message d'erreur inline
 * - Toggle visibilité mot de passe (secureTextEntry)
 * - accessibilityLabel fourni automatiquement
 */

import { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, secureTextEntry, ...rest }: InputProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  // Animation label flottant
  const floatAnim = useRef(new Animated.Value(rest.value ? 1 : 0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(floatAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
    rest.onFocus?.(undefined as never);
  };

  const handleBlur = () => {
    setFocused(false);
    if (!rest.value) {
      Animated.timing(floatAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }).start();
    }
    rest.onBlur?.(undefined as never);
  };

  const hasError = Boolean(error);
  const borderColor = hasError ? colors.danger : focused ? colors.primary : colors.border;

  const labelTop = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [14, -8] });
  const labelSize = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 12] });
  const labelColor = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textSecondary, hasError ? colors.danger : colors.primary],
  });

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View
        style={[
          styles.container,
          {
            borderColor,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            backgroundColor: colors.surface,
          },
        ]}
      >
        {/* Label flottant */}
        <Animated.Text
          style={[
            styles.label,
            {
              top: labelTop,
              fontSize: labelSize,
              color: labelColor,
              backgroundColor: colors.surface,
              paddingHorizontal: 4,
            },
          ]}
          pointerEvents="none"
        >
          {label}
        </Animated.Text>

        <TextInput
          {...rest}
          style={[typography.bodyMedium, styles.input, { color: colors.textPrimary }]}
          secureTextEntry={hidden}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={colors.textDisabled}
          accessibilityLabel={rest.accessibilityLabel ?? label}
          accessibilityHint={hasError ? error : undefined}
        />

        {/* Toggle visibilité mot de passe */}
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setHidden((h) => !h)}
            accessibilityLabel={hidden ? 'Afficher le mot de passe' : 'Masquer le mot de passe'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              {hidden ? 'Voir' : 'Cacher'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Message d'erreur */}
      {hasError && (
        <Text
          style={[typography.caption, styles.errorText, { color: colors.danger }]}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    minHeight: 56,
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: 12,
    fontWeight: '500',
    zIndex: 1,
  },
  input: {
    flex: 1,
    paddingTop: 14,
    paddingBottom: 10,
    minHeight: 52,
    textAlignVertical: 'center',
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
  },
});
