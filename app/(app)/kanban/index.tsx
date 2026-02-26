/**
 * Kanban index — Phase 5.3
 *
 * Board Kanban horizontal affichant toutes les candidatures de l'utilisateur.
 * - `KanbanBoard` (6 colonnes, scroll horizontal)
 * - FAB « + » pour créer une candidature manuelle (position TO_APPLY)
 * - Pull-to-refresh via un bouton header (la nature du scroll horizontal
 *   rend un RefreshControl vertical peu pratique sur le board lui-même)
 * - Résolution titre/entreprise via jobsMap construit depuis useJobFeed
 */

import { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useApplications } from '@/hooks/useApplications';
import { useJobFeed } from '@/hooks/useJobFeed';
import { useTheme } from '@/hooks/useTheme';
import { KanbanBoard, type JobMeta } from '@/components/kanban/KanbanBoard';

export default function KanbanScreen() {
  const { colors, spacing, typography } = useTheme();

  const { applications, isLoading, isRefreshing, submittingIds, error, fetchApplications } =
    useApplications();

  // Charge les jobs approuvés pour résoudre titre/entreprise dans les cards
  const { jobs, fetchFeed } = useJobFeed();

  // Recharge automatiquement à chaque retour sur cet écran (ex: après suppression d'une candidature)
  useFocusEffect(
    useCallback(() => {
      void fetchApplications();
      void fetchFeed();
    }, [fetchApplications, fetchFeed]),
  );

  // jobsMap : jobFeedId → {title, company}
  const jobsMap = useMemo<Record<string, JobMeta>>(() => {
    const map: Record<string, JobMeta> = {};
    for (const job of jobs) {
      const raw = job.rawData;
      const title =
        (typeof raw.title === 'string' && raw.title) ||
        (typeof raw.poste === 'string' && raw.poste) ||
        'Offre sans titre';
      const company =
        (typeof raw.company === 'string' && raw.company) ||
        (typeof raw.entreprise === 'string' && raw.entreprise) ||
        null;
      map[job.id] = { title, company };
    }
    return map;
  }, [jobs]);

  const handleRefresh = useCallback(() => {
    void fetchApplications();
    void fetchFeed();
  }, [fetchApplications, fetchFeed]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: 'Candidatures',
          headerShown: true,
          headerRight: () =>
            isRefreshing ? (
              <ActivityIndicator color={colors.primary} style={{ marginRight: spacing.md }} />
            ) : (
              <TouchableOpacity
                onPress={handleRefresh}
                accessibilityLabel="Actualiser"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.sm,
                }}
              >
                <Text style={[typography.label, { color: colors.primary, lineHeight: 20 }]}>↻</Text>
              </TouchableOpacity>
            ),
        }}
      />

      {/* Erreur */}
      {error && (
        <Text
          style={[
            typography.bodySmall,
            { color: colors.danger, textAlign: 'center', padding: spacing.sm },
          ]}
        >
          {error}
        </Text>
      )}

      {/* Board ou skeleton */}
      {isLoading && applications.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.sm }]}
          >
            Chargement du board…
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <KanbanBoard
            applications={applications}
            jobsMap={jobsMap}
            submittingIds={submittingIds}
            onCardPress={(applicationId) => router.push(`/kanban/${applicationId}`)}
          />
        </View>
      )}

      {/* FAB « + » — navigue vers le flux d'ajout d'offre */}
      <TouchableOpacity
        onPress={() => router.push('/kanban/add-job')}
        accessibilityRole="button"
        accessibilityLabel="Ajouter une offre"
        style={{
          position: 'absolute',
          bottom: spacing.xl,
          right: spacing.lg,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 28, lineHeight: 32, fontWeight: '300' }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
