import { useEffect, useState } from 'react';
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
import { AuthProvider } from '../src/context/AuthContext';
import { initI18n } from '../src/i18n';

// Empêcher le splash de se masquer automatiquement avant que tout soit prêt
SplashScreen.preventAutoHideAsync();

/**
 * Root Layout — Phase 1.4 (ThemeProvider + AuthProvider + fonts + i18n)
 * Phase 1.6 : SplashScreen.hideAsync() après fonts + auth rehydratés
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [i18nReady, setI18nReady] = useState(false);

  // Initialiser i18n (AsyncStorage → expo-localization → 'en')
  useEffect(() => {
    void initI18n().then(() => setI18nReady(true));
  }, []);

  // Masquer le splash uniquement quand fonts ET i18n sont prêts
  useEffect(() => {
    if ((fontsLoaded || fontError) && i18nReady) {
      // Phase 1.6 : ici on attendra aussi la rehydratation auth
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, i18nReady]);

  if ((!fontsLoaded && !fontError) || !i18nReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
