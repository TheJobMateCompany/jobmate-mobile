import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { isTokenExpired } from '../../src/lib/validators';

/**
 * (auth)/_layout.tsx — Phase 1.4 : guard inverse
 * Si le token est valide → redirect direct vers /(app)/feed
 * Sinon → Stack d'authentification normal
 */
export default function AuthLayout() {
  const { token, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (token && !isTokenExpired(token)) {
      router.replace('/(app)/feed');
    }
  }, [token, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
