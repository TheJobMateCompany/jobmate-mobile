/**
 * Feed index — Phase 4.3
 *
 * Liste des offres d'emploi détectées par l'IA.
 * - Segmented control statut : PENDING / APPROVED / REJECTED
 * - FlatList performante (windowSize=5, removeClippedSubviews)
 * - Swipe gauche = reject, swipe droit = approve (via SwipeRow)
 * - Pull-to-refresh
 * - Skeleton loading initial
 * - EmptyFeed si liste vide
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  FlatList,
  View,
  Text,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  type ListRenderItem,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useJobFeed } from '@/hooks/useJobFeed';
import { useTheme } from '@/hooks/useTheme';
import { JobCard } from '@/components/feed/JobCard';
import { JobCardSkeletonList } from '@/components/feed/JobCardSkeleton';
import { SwipeRow } from '@/components/feed/SwipeRow';
import { EmptyFeed } from '@/components/feed/EmptyFeed';
import type { JobFeedItem, JobStatus } from '@/types/api';

// ─── Segmented control ────────────────────────────────────────────────────────

const FILTERS: { label: string; value: JobStatus }[] = [
  { label: 'À traiter', value: 'PENDING' },
  { label: 'Approuvés', value: 'APPROVED' },
  { label: 'Rejetés', value: 'REJECTED' },
];

// ─── Écran ────────────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const [activeStatus, setActiveStatus] = useState<JobStatus>('PENDING');
  const { jobs, isLoading, isRefreshing, isSubmitting, error, fetchFeed, approveJob, rejectJob } =
    useJobFeed();

  // Fetch au montage et à chaque changement de filtre
  useEffect(() => {
    void fetchFeed(activeStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus]);

  const handleFilterChange = (status: JobStatus) => {
    if (status !== activeStatus) setActiveStatus(status);
  };

  // ─── Render item ────────────────────────────────────────────────────────────

  const renderItem = useCallback<ListRenderItem<JobFeedItem>>(
    ({ item }) => (
      <SwipeRow
        onApprove={activeStatus === 'PENDING' ? () => void approveJob(item.id) : undefined}
        onReject={activeStatus === 'PENDING' ? () => void rejectJob(item.id) : undefined}
        disabled={isSubmitting}
      >
        <JobCard job={item} onPress={() => router.push(`/feed/${item.id}`)} />
      </SwipeRow>
    ),
    [activeStatus, approveJob, rejectJob, isSubmitting],
  );

  // ─── Header segmented control ───────────────────────────────────────────────

  const ListHeader = (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.sm,
        paddingBottom: spacing.md,
      }}
    >
      {FILTERS.map((f) => {
        const active = f.value === activeStatus;
        return (
          <TouchableOpacity
            key={f.value}
            onPress={() => handleFilterChange(f.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              paddingVertical: spacing.sm,
              borderRadius: radius.sm,
              backgroundColor: active ? colors.primary : colors.surfaceVariant,
              alignItems: 'center',
            }}
          >
            <Text style={[typography.label, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ─── Contenu principal ──────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: 'Offres', headerShown: true }} />

      <View style={{ flex: 1, paddingHorizontal: spacing.md }}>
        {/* Filtre statut — toujours visible */}
        <View style={{ paddingTop: spacing.md }}>{ListHeader}</View>

        {/* Erreur réseau */}
        {error && !isLoading && (
          <Text
            style={[
              typography.bodySmall,
              { color: colors.danger, textAlign: 'center', marginBottom: spacing.sm },
            ]}
          >
            {error}
          </Text>
        )}

        {/* Skeleton chargement initial */}
        {isLoading ? (
          <JobCardSkeletonList />
        ) : (
          <FlatList
            data={jobs}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            windowSize={5}
            removeClippedSubviews
            contentContainerStyle={{ paddingBottom: spacing.xl, gap: spacing.md, flexGrow: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => void fetchFeed(activeStatus)}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <EmptyFeed
                ctaLabel="Configurer une recherche"
                onCtaPress={() => router.push('/profile/search-config/new')}
                style={{ flex: 1 }}
              />
            }
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
