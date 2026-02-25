/**
 * ScreenWrapper — conteneur de base pour chaque écran
 * Phase 2.1
 *
 * SafeAreaView + KeyboardAvoidingView + fond colors.background
 * Option `scroll` : enroule le contenu dans un ScrollView
 * Option `padded` (défaut true) : padding horizontal standard
 */

import {
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

export interface ScreenWrapperProps {
  children: React.ReactNode;
  /** Activer le scroll vertical (défaut : false) */
  scroll?: boolean;
  /** Padding horizontal standard (défaut : true) */
  padded?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export function ScreenWrapper({
  children,
  scroll = false,
  padded = true,
  style,
  contentContainerStyle,
}: ScreenWrapperProps) {
  const { colors, spacing } = useTheme();

  const inner = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        padded && { paddingHorizontal: spacing.lg },
        styles.scrollContent,
        contentContainerStyle,
      ]}
    >
      {children}
    </ScrollView>
  ) : (
    <SafeAreaView
      style={[styles.fill, padded && { paddingHorizontal: spacing.lg }, contentContainerStyle]}
    >
      {children}
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }, style]}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {inner}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
});
