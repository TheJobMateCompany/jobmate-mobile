/**
 * Search Config new — Phase 3.7
 *
 * Création d'une nouvelle configuration de recherche.
 * Utilise SearchConfigForm (composant partagé).
 * createConfig() → router.back() en cas de succès.
 */

import { useCallback } from 'react';
import { Alert, ScrollView } from 'react-native';
import { router, Stack } from 'expo-router';
import { useSearchConfigs } from '@/hooks/useSearchConfigs';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { SearchConfigForm } from '@/components/profile/SearchConfigForm';
import type { CreateSearchConfigInput } from '@/types/api';

export default function NewSearchConfigScreen() {
  const { spacing } = useTheme();
  const { isSubmitting, createConfig } = useSearchConfigs();

  const handleSubmit = useCallback(
    async (input: CreateSearchConfigInput) => {
      try {
        await createConfig(input);
        router.back();
      } catch {
        Alert.alert('Erreur', 'Impossible de créer la configuration. Réessayez.');
      }
    },
    [createConfig],
  );

  return (
    <ScreenWrapper padded={false}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Nouvelle configuration',
          headerBackTitle: 'Retour',
        }}
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SearchConfigForm
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          submitLabel="Créer la configuration"
        />
      </ScrollView>
    </ScreenWrapper>
  );
}
