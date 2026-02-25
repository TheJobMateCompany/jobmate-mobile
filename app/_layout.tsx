import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { ThemeProvider } from '../src/context/ThemeContext';

// Empêcher le splash de se masquer automatiquement avant que tout soit prêt
SplashScreen.preventAutoHideAsync();

/**
 * Root Layout — Phase 1.2 (ThemeProvider + fonts)
 * Phase 1.4 : AuthContext.Provider s'ajoutera ici (à l'intérieur de ThemeProvider)
 * Phase 1.6 : SplashScreen.hideAsync() après fonts + auth rehydratés
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Phase 1.6 : ici on attendra aussi la rehydratation auth
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </ThemeProvider>
  );
}
