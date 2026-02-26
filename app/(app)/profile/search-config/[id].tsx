/**
 * Search Config [id] — Phase 3.7
 *
 * Édition d'une configuration de recherche existante.
 * Charge la config depuis le store (useSearchConfigs) via l'id de l'URL.
 * Utilise SearchConfigForm pré-rempli avec les valeurs actuelles.
 * updateConfig(id, input) → router.back() en cas de succès.
 */

import { useCallback } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSearchConfigs } from '@/hooks/useSearchConfigs';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { SearchConfigForm } from '@/components/profile/SearchConfigForm';
import type { CreateSearchConfigInput } from '@/types/api';

export default function EditSearchConfigScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();
  const { configs, isSubmitting, isLoading, updateConfig } = useSearchConfigs();

  const config = configs.find((c) => c.id === id);

  const handleSubmit = useCallback(
    async (input: CreateSearchConfigInput) => {
      if (!id) return;
      try {
        await updateConfig(id, input);
        router.back();
      } catch {
        Alert.alert(t('common.error'), t('profile.searchConfigs.updateError'));
      }
    },
    [id, updateConfig, t],
  );

  // ── Config non trouvée (chargement en cours ou id invalide) ──
  if (isLoading || !config) {
    return (
      <ScreenWrapper>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
              {t('common.noResults')}
            </Text>
          )}
        </View>
      </ScreenWrapper>
    );
  }

  // ── Valeurs initiales depuis la config existante ──
  const initialValues: Partial<CreateSearchConfigInput> = {
    jobTitles: config.jobTitles,
    locations: config.locations,
    remotePolicy: config.remotePolicy,
    keywords: config.keywords,
    redFlags: config.redFlags,
    salaryMin: config.salaryMin ?? undefined,
    salaryMax: config.salaryMax ?? undefined,
    duration: config.duration ?? undefined,
    startDate: config.startDate ?? undefined,
    coverLetterTemplate: config.coverLetterTemplate ?? undefined,
  };

  return (
    <ScreenWrapper padded={false}>
      <Stack.Screen
        options={{
          title: config.jobTitles.slice(0, 1).join('') || t('common.edit'),
        }}
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.lg }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SearchConfigForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          submitLabel={t('common.save')}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}
