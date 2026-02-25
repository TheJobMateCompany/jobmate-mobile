import { Redirect } from 'expo-router';

/**
 * Point d'entrée racine — redirige vers le groupe auth.
 * app/(auth)/_layout.tsx gère ensuite :
 *   - onboarding (première visite)
 *   - login (utilisateur non connecté)
 *   - feed (token valide)
 */
export default function Index() {
  return <Redirect href="/(auth)/onboarding" />;
}
