import { Tabs } from 'expo-router';

/**
 * Tab Navigator — à compléter en Phase 1.4 (guard auth) + Phase 2 (icônes onglets)
 */
export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
      <Tabs.Screen name="kanban" options={{ title: 'Kanban' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
      <Tabs.Screen name="settings" options={{ title: 'Paramètres' }} />
    </Tabs>
  );
}
