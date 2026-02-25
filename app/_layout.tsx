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
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { initI18n } from '../src/i18n';

// Empêcher le splash de se masquer automatiquement avant que tout soit prêt
SplashScreen.preventAutoHideAsync();

/**
 * Contrôleur interne : masque le splash quand fonts + i18n + auth sont tous prêts.
 * Doit être rendu à l'intérieur de <AuthProvider> pour accéder à useAuth().
 */
function SplashController({ fontsReady, i18nReady }: { fontsReady: boolean; i18nReady: boolean }) {
  const { isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (fontsReady && i18nReady && !authLoading) {
      void SplashScreen.hideAsync();
    }
  }, [fontsReady, i18nReady, authLoading]);

  return null;
}

/**
 * Root Layout — Phase 1.6 (ThemeProvider + AuthProvider + fonts + i18n + splash complet)
 * Splash masqué uniquement après : fonts ✓ + i18n ✓ + rehydratation auth ✓
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

  const fontsReady = fontsLoaded || !!fontError;

  // Garde : ne rien rendre avant que les ressources critiques soient disponibles
  if (!fontsReady || !i18nReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        {/* SplashController a accès à useAuth() ici, à l'intérieur de AuthProvider */}
        <SplashController fontsReady={fontsReady} i18nReady={i18nReady} />
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
