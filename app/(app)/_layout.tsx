import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { isTokenExpired } from '../../src/lib/validators';

/**
 * (app)/_layout.tsx — Phase 1.4 : guard d'authentification
 * Si isLoading → spinner centré
 * Si !token ou JWT expiré → redirect /(auth)/login
 * Sinon → Tab Navigator (icônes en Phase 2)
 */
export default function AppLayout() {
  const { token, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!token || isTokenExpired(token)) {
      router.replace('/(auth)/login');
    }
  }, [token, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!token || isTokenExpired(token)) {
    // Redirect en cours via useEffect, on ne rend rien
    return null;
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
      <Tabs.Screen name="kanban" options={{ title: 'Kanban' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
      <Tabs.Screen name="settings" options={{ title: 'Paramètres' }} />
    </Tabs>
  );
}
