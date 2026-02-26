/**
 * Search Config index — Phase 3.7
 *
 * Liste des configurations de recherche :
 * - FlatList avec carte par config (titres, localisations, remotePolicy, isActive)
 * - Swipe ou bouton trash pour supprimer (confirmation Alert)
 * - FAB « + » pour créer une nouvelle config
 * - État vide (empty state illustré)
 * - Pull-to-refresh
 */

import { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useSearchConfigs } from '@/hooks/useSearchConfigs';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Badge } from '@/components/ui/Badge';
import { Spacer } from '@/components/ui/Spacer';
import type { SearchConfig, RemotePolicy } from '@/types/api';
import type { BadgeVariant } from '@/components/ui/Badge';

// ─── RemotePolicy mappings ─────────────────────────────────────────────────────────

const REMOTE_LABEL: Record<RemotePolicy, string> = {
  REMOTE: 'Full remote',
  HYBRID: 'Hybride',
  ON_SITE: 'Présentiel',
};

const REMOTE_VARIANT: Record<RemotePolicy, BadgeVariant> = {
  REMOTE: 'success',
  HYBRID: 'warning',
  ON_SITE: 'neutral',
};

// ─── Carte config ───────────────────────────────────────────────────────────────────

function ConfigCard({
  config,
  onPress,
  onDelete,
}: {
  config: SearchConfig;
  onPress: () => void;
  onDelete: () => void;
}) {
  const { colors, spacing, radius, typography } = useTheme();

  const salaryRange =
    config.salaryMin != null && config.salaryMax != null
      ? `${config.salaryMin / 1000}k – ${config.salaryMax / 1000}k €`
      : config.salaryMin != null
        ? `≥ ${config.salaryMin / 1000}k €`
        : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Config ${config.jobTitles.join(', ')}`}
      activeOpacity={0.8}
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.md,
        borderWidth: 1.5,
        borderColor: config.isActive ? colors.primary : colors.border,
      }}
    >
      {/* En-tête : titres + trash */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.headingMedium, { color: colors.textPrimary }]} numberOfLines={2}>
            {config.jobTitles.join(' · ')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Supprimer la configuration"
        >
          <Text style={[typography.label, { color: colors.danger }]}>✕</Text>
        </TouchableOpacity>
      </View>

      <Spacer size={spacing.sm} />

      {/* Badges */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Badge
          label={REMOTE_LABEL[config.remotePolicy]}
          variant={REMOTE_VARIANT[config.remotePolicy]}
        />
        {config.isActive && <Badge label="Active" variant="primary" />}
        {config.locations.length > 0 && (
          <Badge label={config.locations.slice(0, 2).join(', ')} variant="neutral" />
        )}
        {salaryRange && <Badge label={salaryRange} variant="neutral" />}
        {config.duration ? <Badge label={config.duration} variant="neutral" /> : null}
      </View>

      {/* Mots-clés si présents */}
      {config.keywords.length > 0 && (
        <>
          <Spacer size={spacing.xs} />
          <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
            {config.keywords.join(', ')}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Écran ─────────────────────────────────────────────────────────────────────

export default function SearchConfigListScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { configs, isLoading, isSubmitting, fetchConfigs, deleteConfig } = useSearchConfigs();

  const handleDelete = useCallback(
    (config: SearchConfig) => {
      Alert.alert(
        'Supprimer la configuration ?',
        `« ${config.jobTitles.slice(0, 2).join(', ')} » sera supprimée définitivement.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => {
              void deleteConfig(config.id).catch(() =>
                Alert.alert('Erreur', 'Impossible de supprimer cette configuration.'),
              );
            },
          },
        ],
      );
    },
    [deleteConfig],
  );

  return (
    <ScreenWrapper padded={false}>
      <Stack.Screen
        options={{
          title: 'Configurations',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityLabel="Retour au profil"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginLeft: -4 }}
            >
              <Text style={{ color: colors.primary, fontSize: 17 }}>‹ Profil</Text>
            </TouchableOpacity>
          ),
          headerRight: () =>
            isSubmitting ? <ActivityIndicator size="small" color={colors.primary} /> : null,
        }}
      />

      <FlatList
        data={[...configs].sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0))}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: spacing.md + 72, // espace sous le FAB
          flexGrow: 1,
        }}
        ItemSeparatorComponent={() => <Spacer size={spacing.md} />}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              void fetchConfigs();
            }}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <ConfigCard
            config={item}
            onPress={() => router.push(`/(app)/profile/search-config/${item.id}`)}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: spacing.xxl,
              }}
            >
              <Text
                style={[
                  typography.headingMedium,
                  { color: colors.textSecondary, textAlign: 'center' },
                ]}
              >
                Aucune configuration
              </Text>
              <Spacer size={spacing.sm} />
              <Text
                style={[
                  typography.bodyMedium,
                  { color: colors.textSecondary, textAlign: 'center' },
                ]}
              >
                Créez une configuration pour que l'IA recherche des offres adaptées.
              </Text>
              <Spacer size={spacing.lg} />
              <TouchableOpacity
                onPress={() => router.push('/(app)/profile/search-config/new')}
                accessibilityRole="button"
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: spacing.xl,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.md,
                }}
              >
                <Text style={[typography.label, { color: '#fff', fontWeight: '600' }]}>
                  Créer une configuration
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* FAB « + » */}
      <TouchableOpacity
        onPress={() => router.push('/(app)/profile/search-config/new')}
        accessibilityRole="button"
        accessibilityLabel="Créer une nouvelle configuration"
        style={{
          position: 'absolute',
          bottom: spacing.xl,
          right: spacing.xl,
          width: 56,
          height: 56,
          borderRadius: radius.full,
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
        <Text style={{ color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '300' }}>+</Text>
      </TouchableOpacity>
    </ScreenWrapper>
  );
}
