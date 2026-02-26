import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function SearchConfigLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerLargeTitle: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        headerTitleStyle: { fontSize: 17, fontWeight: '600' },
        headerBackTitle: 'Retour',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" options={{ title: 'Configuration' }} />
    </Stack>
  );
}
