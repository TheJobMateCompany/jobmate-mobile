import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/hooks/useTheme';
import { isTokenExpired } from '../../src/lib/validators';

export default function AppLayout() {
  const { token, isLoading } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    if (isLoading) return;
    if (!token || isTokenExpired(token)) {
      router.replace('/(auth)/login');
    }
  }, [token, isLoading]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!token || isTokenExpired(token)) {
    // Redirect en cours via useEffect, fond coloré pour éviter le flash blanc
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
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
