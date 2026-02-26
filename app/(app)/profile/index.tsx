/**
 * Profile index — Phase 3.6
 *
 * Affichage scrollable du profil utilisateur :
 * - ProfileHeader (avatar initiales, statut, bouton Modifier)
 * - CompletionBar (progression 0-100%)
 * - Section Compétences (SkillChip readonly)
 * - Section Expériences (ExperienceItem timeline)
 * - Section CV (CvUploadCard)
 *
 * Pull-to-refresh via RefreshControl.
 * Skeletons pendant le chargement initial.
 * Souscription SSE CV_PARSED intégrée via useUploadCV(onParsed).
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '@/hooks/useProfile';
import { useUploadCV } from '@/hooks/useUploadCV';
import { useSearchConfigs } from '@/hooks/useSearchConfigs';
import { useTheme } from '@/hooks/useTheme';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spacer } from '@/components/ui/Spacer';
import { Divider } from '@/components/ui/Divider';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { CompletionBar } from '@/components/profile/CompletionBar';
import { SkillChip } from '@/components/profile/SkillChip';
import { ExperienceItem, parseExperienceEntry } from '@/components/profile/ExperienceItem';
import { CvUploadCard } from '@/components/profile/CvUploadCard';
import { useTranslation } from 'react-i18next';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Extrait un label string depuis une compétence (string | objet { name } | autre) */
function resolveSkillLabel(raw: unknown): string | null {
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (typeof obj['name'] === 'string' && obj['name'].trim()) return obj['name'].trim();
  }
  return null;
}

// ─── Sous-composant section ────────────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  const { colors, typography, spacing } = useTheme();
  return (
    <Text
      style={[typography.headingMedium, { color: colors.textPrimary, marginBottom: spacing.sm }]}
    >
      {label}
    </Text>
  );
}

// ─── Écran ─────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, spacing, radius, typography } = useTheme();
  const { profile, isLoading, fetchProfile } = useProfile();
  const { configs, fetchConfigs } = useSearchConfigs();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analyzingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAnalyzingTimeout = useCallback(() => {
    if (analyzingTimeoutRef.current) {
      clearTimeout(analyzingTimeoutRef.current);
      analyzingTimeoutRef.current = null;
    }
  }, []);

  const activeCount = configs.filter((c) => c.isActive).length;

  useFocusEffect(
    useCallback(() => {
      void fetchProfile();
      void fetchConfigs();
    }, [fetchProfile, fetchConfigs]),
  );

  // ── useUploadCV : écoute CV_PARSED pour désactiver l'état « analyse » ─────
  const { isUploading, progress, pickAndUpload } = useUploadCV({
    onParsed: useCallback(() => {
      clearAnalyzingTimeout();
      setIsAnalyzing(false);
      void fetchProfile(); // rafraîchit le profil après analyse IA
    }, [fetchProfile, clearAnalyzingTimeout]),
  });

  useEffect(() => {
    return () => {
      clearAnalyzingTimeout();
    };
  }, [clearAnalyzingTimeout]);

  // ── Pull-to-refresh ────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchProfile(), fetchConfigs()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchProfile, fetchConfigs]);

  // ── Upload CV ──────────────────────────────────────────────────────────────
  const handleUpload = useCallback(async () => {
    try {
      clearAnalyzingTimeout();
      const url = await pickAndUpload();
      if (url) {
        setIsAnalyzing(true); // upload OK → attente SSE CV_PARSED
        analyzingTimeoutRef.current = setTimeout(() => {
          setIsAnalyzing(false);
          void fetchProfile();
        }, 30000);
      } else {
        setIsAnalyzing(false);
      }
    } catch {
      clearAnalyzingTimeout();
      setIsAnalyzing(false);
      Alert.alert(t('common.error'), t('profile.uploadCvError'));
    }
  }, [pickAndUpload, t, fetchProfile, clearAnalyzingTimeout]);

  // ── Données dérivées ───────────────────────────────────────────────────────
  const skills = (profile?.skills ?? [])
    .map(resolveSkillLabel)
    .filter((s): s is string => s !== null);
  const experiences = (profile?.experience ?? [])
    .map(parseExperienceEntry)
    .filter((e) => e !== null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header natif avec bouton Modifier */}
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('profile.title'),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/(app)/profile/edit')}
              accessibilityRole="button"
              accessibilityLabel={t('settings.editProfile')}
              style={{ paddingHorizontal: spacing.sm }}
            >
              <Text style={[typography.label, { color: colors.primary, fontWeight: '600' }]}>
                {t('common.edit')}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.lg }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void handleRefresh();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Skeleton loading ── */}
        {isLoading && !profile ? (
          <>
            <Skeleton width="100%" height={96} borderRadius={12} />
            <Spacer size={spacing.md} />
            <Skeleton width="100%" height={72} borderRadius={12} />
            <Spacer size={spacing.md} />
            <Skeleton width="60%" height={20} borderRadius={4} />
            <Spacer size={spacing.sm} />
            <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
              {[80, 100, 64, 90].map((w, i) => (
                <Skeleton key={i} width={w} height={28} borderRadius={999} />
              ))}
            </View>
          </>
        ) : (
          <>
            {/* ── Header profil ── */}
            <ProfileHeader profile={profile} />

            <Spacer size={spacing.md} />

            {/* ── Barre de complétion ── */}
            <CompletionBar profile={profile} />

            {/* ── Compétences ── */}
            {skills.length > 0 && (
              <>
                <Spacer size={spacing.md} />
                <Divider />
                <Spacer size={spacing.md} />
                <SectionTitle label={t('profile.skills')} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {skills.map((skill) => (
                    <SkillChip key={skill} label={skill} />
                  ))}
                </View>
              </>
            )}

            {/* ── Expériences ── */}
            {experiences.length > 0 && (
              <>
                <Spacer size={spacing.md} />
                <Divider />
                <Spacer size={spacing.md} />
                <SectionTitle label={t('profile.experiences')} />
                {experiences.map((entry, idx) => (
                  <ExperienceItem
                    key={`${entry.company}-${idx}`}
                    entry={entry}
                    isLast={idx === experiences.length - 1}
                  />
                ))}
              </>
            )}

            {/* ── CV ── */}
            <Spacer size={spacing.md} />
            <Divider />
            <Spacer size={spacing.md} />
            <SectionTitle label={t('profile.cv')} />
            <CvUploadCard
              cvUrl={profile?.cvUrl ?? null}
              isUploading={isUploading}
              progress={progress}
              isAnalyzing={isAnalyzing}
              onUpload={() => {
                void handleUpload();
              }}
            />

            {/* ── Configurations de recherche ── */}
            <Spacer size={spacing.sm} />
            <Divider />
            <TouchableOpacity
              onPress={() => router.push('/(app)/profile/search-config')}
              accessibilityRole="button"
              accessibilityLabel={t('profile.searchConfigs.title')}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[typography.headingMedium, { color: colors.textPrimary }]}>
                  {t('profile.searchConfigs.title')}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  {activeCount > 0
                    ? `${activeCount} configuration${activeCount > 1 ? 's' : ''} active${activeCount > 1 ? 's' : ''}`
                    : t('profile.searchConfigs.emptySubtitle')}
                </Text>
              </View>
              {activeCount > 0 && (
                <View
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: radius.full,
                    minWidth: 22,
                    height: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 6,
                    marginRight: spacing.sm,
                  }}
                >
                  <Text style={[typography.caption, { color: '#fff', fontWeight: '700' }]}>
                    {activeCount}
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
