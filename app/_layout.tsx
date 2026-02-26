import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { ThemeProvider } from '../src/context/ThemeContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { initI18n } from '../src/i18n';

// ── Log module-level : confirme que le fichier est chargé par Metro ──────────
console.log('[Layout] Module loaded ✓');

// ── Dev only : reset du stockage pour debug/tests ────────────────────────────
// Activé par défaut en DEV. Pour désactiver: EXPO_PUBLIC_CLEAR_STORAGE_ON_START=0
const CLEAR_STORAGE_ON_START =
  __DEV__ && process.env.EXPO_PUBLIC_CLEAR_STORAGE_ON_START !== '0';

// Empêcher le splash de se masquer automatiquement avant que tout soit prêt
SplashScreen.preventAutoHideAsync().catch((e) =>
  console.warn('[Layout] preventAutoHideAsync error:', e),
);

/**
 * Contrôleur interne : masque le splash quand fonts + i18n + auth sont tous prêts.
 * Doit être rendu à l'intérieur de <AuthProvider> pour accéder à useAuth().
 */
function SplashController({ fontsReady, i18nReady }: { fontsReady: boolean; i18nReady: boolean }) {
  const { isLoading: authLoading } = useAuth();

  useEffect(() => {
    console.log('[Splash]', { fontsReady, i18nReady, authLoading });
    if (fontsReady && i18nReady && !authLoading) {
      console.log('[Splash] All ready → hiding splash screen');
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
  const [storageReady, setStorageReady] = useState(!CLEAR_STORAGE_ON_START);

  useEffect(() => {
    if (!CLEAR_STORAGE_ON_START) return;

    console.log('[DEV] 🧹 Clearing local storage before app bootstrap...');
    void Promise.all([AsyncStorage.clear(), SecureStore.deleteItemAsync('auth_token')])
      .then(() => {
        console.log('[DEV] ✅ Storage cleared (AsyncStorage + auth_token)');
      })
      .catch((err: unknown) => {
        console.warn('[DEV] Storage clear failed:', err);
      })
      .finally(() => {
        setStorageReady(true);
      });
  }, []);

  console.log('[Layout] Render —', { fontsLoaded, fontError: !!fontError, i18nReady });

  // Initialiser i18n (AsyncStorage → expo-localization → 'en')
  useEffect(() => {
    if (!storageReady) return;
    console.log('[i18n] Initializing...');
    void initI18n()
      .then(() => {
        console.log('[i18n] Ready');
        setI18nReady(true);
      })
      .catch((err: unknown) => {
        console.warn('[i18n] Init error (ignored):', err);
        setI18nReady(true);
      });
  }, [storageReady]);

  const fontsReady = fontsLoaded || !!fontError;

  if (!storageReady) {
    return null;
  }

  // Pas de garde return null — le splash natif couvre l'UI pendant le chargement.
  // SplashController le masque dès que fonts + i18n + auth sont prêts.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            {/* SplashController a accès à useAuth() ici, à l'intérieur de AuthProvider */}
            <SplashController fontsReady={fontsReady} i18nReady={i18nReady} />
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
            </Stack>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
