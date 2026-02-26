/**
 * ScreenWrapper — conteneur de base pour chaque écran
 * Phase 2.1
 *
 * SafeAreaView + KeyboardAvoidingView + fond colors.background
 * Option `scroll` : enroule le contenu dans un ScrollView
 * Option `padded` (défaut true) : padding horizontal standard
 * Option `edges` (défaut ['bottom']) : quelles bordures SafeArea appliquer.
 *   Les écrans dans un Stack navigator doivent utiliser ['bottom'] (le header
 *   gère déjà le top). Les écrans sans header (auth) utilisent ['top','bottom'].
 */

import {
  Platform,
  View,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

export interface ScreenWrapperProps {
  children: React.ReactNode;
  /** Activer le scroll vertical (défaut : false) */
  scroll?: boolean;
  /** Padding horizontal standard (défaut : true) */
  padded?: boolean;
  /**
   * Bords SafeArea à appliquer.
   * Défaut : ['bottom'] — le Stack header gère déjà le top.
   * Passer ['top','bottom'] pour les écrans sans header (auth).
   */
  edges?: Edge[];
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export function ScreenWrapper({
  children,
  scroll = false,
  padded = true,
  edges = ['bottom'],
  style,
  contentContainerStyle,
}: ScreenWrapperProps) {
  const { colors, spacing } = useTheme();

  const inner = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        padded && { paddingHorizontal: spacing.md },
        styles.scrollContent,
        contentContainerStyle,
      ]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, padded && { paddingHorizontal: spacing.md }, contentContainerStyle]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.fill, { backgroundColor: colors.background }, style]}
    >
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
    paddingBottom: 16,
  },
});
