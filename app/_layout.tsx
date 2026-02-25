import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/**
 * Root Layout — à compléter en Phase 1.2 (ThemeContext) + Phase 1.4 (AuthContext)
 * Ordre final : <ThemeContext.Provider> → <AuthContext.Provider> → <Stack>
 */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}
