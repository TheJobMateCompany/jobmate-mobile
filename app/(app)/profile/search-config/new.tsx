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
import { useTranslation } from 'react-i18next';
import { useSearchConfigs } from '@/hooks/useSearchConfigs';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { SearchConfigForm } from '@/components/profile/SearchConfigForm';
import type { CreateSearchConfigInput } from '@/types/api';

export default function NewSearchConfigScreen() {
  const { spacing } = useTheme();
  const { t } = useTranslation();
  const { isSubmitting, createConfig } = useSearchConfigs();

  const handleSubmit = useCallback(
    async (input: CreateSearchConfigInput) => {
      try {
        await createConfig(input);
        router.back();
      } catch {
        Alert.alert(t('common.error'), t('profile.searchConfigs.createError'));
      }
    },
    [createConfig, t],
  );

  return (
    <ScreenWrapper padded={false}>
      <Stack.Screen
        options={{
          title: t('profile.searchConfigs.newTitle'),
        }}
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.lg }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SearchConfigForm
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          submitLabel={t('profile.searchConfigs.add')}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}
