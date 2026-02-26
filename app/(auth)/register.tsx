/**
 * Register — Phase 2.4
 *
 * Validation locale + indicateur de force mot de passe
 * Mutation GraphQL register → AuthContext.login() → redirect /(app)/profile/edit * Haptic Success / Error
 */

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { gqlRequest } from '@/lib/graphql/client';
import { REGISTER_MUTATION } from '@/lib/graphql/mutations';
import { isValidEmail, validatePassword } from '@/lib/validators';
import { mapApiError } from '@/lib/errors';
import { type AuthPayload } from '@/types/api';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spacer } from '@/components/ui/Spacer';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { FIRST_LOGIN_KEY } from './_layout';

interface RegisterResponse {
  register: AuthPayload;
}

// ─── Indicateur de force du mot de passe ─────────────────────────────────────────

function passwordStrength(password: string): { score: number; label: string } {
  if (password.length === 0) return { score: 0, label: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ['', 'Faible', 'Moyen', 'Fort', 'Très fort'];
  return { score, label: labels[score] ?? 'Très fort' };
}

const STRENGTH_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#10B981'];

export default function RegisterScreen() {
  const { colors, typography, spacing } = useTheme();
  const { login } = useAuth();
  const { notification } = useHaptics();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const strength = passwordStrength(password);

  // ─── Validation locale ─────────────────────────────────────────────────────

  const validate = (): boolean => {
    let valid = true;

    if (!isValidEmail(email)) {
      setEmailError('Adresse e-mail invalide');
      valid = false;
    } else setEmailError(undefined);

    const pwdResult = validatePassword(password);
    if (!pwdResult.isValid) {
      setPasswordError(pwdResult.errors[0]);
      valid = false;
    } else setPasswordError(undefined);

    return valid;
  };

  // ─── Soumission ───────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) return;
    setError(null);
    setLoading(true);

    try {
      const data = await gqlRequest<RegisterResponse>(REGISTER_MUTATION, {
        email: email.trim().toLowerCase(),
        password,
      });

      // Marquer AVANT login() : (auth)/_layout.tsx lit le flag quand le token apparaît
      await AsyncStorage.setItem(FIRST_LOGIN_KEY, 'true');
      await login(data.register.token, data.register.user);
      notification(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError(mapApiError(err));
      notification(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Rendu ─────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper scroll padded edges={['top', 'bottom']}>
      <Spacer size={spacing.xxl} />

      {/* En-tête */}
      <Text style={[typography.displayMedium, { color: colors.textPrimary }]}>Créer un compte</Text>
      <Spacer size={spacing.xs} />
      <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
        Rejoignez JobMate en 30 secondes.
      </Text>

      <Spacer size={spacing.xl} />

      {/* Champs */}
      <Input
        label="Adresse e-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={emailError}
        returnKeyType="next"
      />

      <Spacer size={spacing.md} />

      <Input
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        error={passwordError}
        returnKeyType="done"
        onSubmitEditing={() => void handleSubmit()}
      />

      {/* Indicateur de force */}
      {password.length > 0 && (
        <>
          <Spacer size={spacing.xs} />
          <ProgressBar
            progress={strength.score / 4}
            style={
              {
                // Override la couleur via une View parente n'est pas possible directement,
                // on passe par le trackHeight et on laisse la couleur primaire.
                // La couleur contextuelle est affichée via le label texte ci-dessous.
              }
            }
          />
          <Spacer size={spacing.xs / 2} />
          <Text
            style={[
              typography.caption,
              {
                color:
                  STRENGTH_COLORS[(strength.score - 1) as 0 | 1 | 2 | 3] ?? colors.textSecondary,
              },
            ]}
          >
            {strength.label}
          </Text>
        </>
      )}

      {/* Erreur globale */}
      {error && (
        <>
          <Spacer size={spacing.sm} />
          <Text style={[typography.bodySmall, { color: colors.danger }]} accessibilityRole="alert">
            {error}
          </Text>
        </>
      )}

      <Spacer size={spacing.xl} />

      <Button
        label="Créer mon compte"
        onPress={() => void handleSubmit()}
        loading={loading}
        disabled={loading}
      />

      <Spacer size={spacing.lg} />

      {/* Lien vers Login */}
      <View style={[styles.row, styles.centered]}>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
          Déjà un compte ? 
        </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')} accessibilityRole="link">
          <Text style={[typography.bodyMedium, { color: colors.primary, fontWeight: '600' }]}>
            Se connecter
          </Text>
        </TouchableOpacity>
      </View>

      <Spacer size={spacing.xxl} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
