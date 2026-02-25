/**
 * Login — Phase 2.4
 *
 * Validation locale → mutation GraphQL login → AuthContext.login() → redirect app
 * États : idle → loading → succès (redirect) | erreur (inline)
 * Haptic : notification Success / Error selon résultat
 */

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { gqlRequest } from '@/lib/graphql/client';
import { LOGIN_MUTATION } from '@/lib/graphql/mutations';
import { isValidEmail, isNotEmpty } from '@/lib/validators';
import { mapApiError } from '@/lib/errors';
import { type AuthPayload } from '@/types/api';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spacer } from '@/components/ui/Spacer';

interface LoginResponse {
  login: AuthPayload;
}

export default function LoginScreen() {
  const { colors, typography, spacing } = useTheme();
  const { login } = useAuth();
  const { notification } = useHaptics();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();

  // ─── Validation locale ───────────────────────────────────────────────────────

  const validate = (): boolean => {
    let valid = true;

    if (!isValidEmail(email)) {
      setEmailError('Adresse e-mail invalide');
      valid = false;
    } else {
      setEmailError(undefined);
    }

    if (!isNotEmpty(password)) {
      setPasswordError('Le mot de passe est requis');
      valid = false;
    } else {
      setPasswordError(undefined);
    }

    return valid;
  };

  // ─── Soumission ────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) return;
    setError(null);
    setLoading(true);

    try {
      const data = await gqlRequest<LoginResponse>(LOGIN_MUTATION, {
        email: email.trim().toLowerCase(),
        password,
      });

      await login(data.login.token, data.login.user);
      notification(Haptics.NotificationFeedbackType.Success);
      router.replace('/(app)/feed');
    } catch (err) {
      setError(mapApiError(err));
      notification(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Rendu ──────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper scroll padded>
      <Spacer size={spacing.xxl} />

      {/* En-tête */}
      <Text style={[typography.displayMedium, { color: colors.textPrimary }]}>Connexion</Text>
      <Spacer size={spacing.xs} />
      <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
        Content de vous revoir !
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
        autoComplete="current-password"
        error={passwordError}
        returnKeyType="done"
        onSubmitEditing={() => void handleSubmit()}
      />

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
        label="Se connecter"
        onPress={() => void handleSubmit()}
        loading={loading}
        disabled={loading}
      />

      <Spacer size={spacing.lg} />

      {/* Lien vers Register */}
      <View style={styles.row}>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
          Pas encore de compte ? 
        </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')} accessibilityRole="link">
          <Text style={[typography.bodyMedium, { color: colors.primary, fontWeight: '600' }]}>
            Créer un compte
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
    justifyContent: 'center',
    alignItems: 'center',
  },
});
