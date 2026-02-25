import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/hooks/useTheme';
import { isTokenExpired } from '../../src/lib/validators';
import { ONBOARDING_KEY } from './onboarding';

export default function AuthLayout() {
  const { token, isLoading } = useAuth();
  const { colors } = useTheme();
  const [initialRoute, setInitialRoute] = useState<'onboarding' | 'login' | null>(null);

  // Lecture eagerly au montage, en parallèle avec l'auth — réduit le flash
  useEffect(() => {
    void AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setInitialRoute(val === 'true' ? 'login' : 'onboarding');
    });
  }, []);

  // Navigation une fois auth + onboarding flag tous les deux résolus
  useEffect(() => {
    if (isLoading || initialRoute === null) return;

    if (token && !isTokenExpired(token)) {
      router.replace('/(app)/feed');
      return;
    }

    if (initialRoute === 'login') {
      router.replace('/(auth)/login');
    }
    // Si 'onboarding' → on reste sur la route courante (/(auth)/onboarding)
  }, [token, isLoading, initialRoute]);

  // Pendant la résolution : fond coloré au lieu de null pour éviter le flash blanc
  if (isLoading || initialRoute === null) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
