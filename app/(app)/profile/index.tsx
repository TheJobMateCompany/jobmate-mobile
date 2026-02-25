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

import { useState, useCallback } from 'react';
import { ScrollView, View, Text, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { useProfile } from '@/hooks/useProfile';
import { useUploadCV } from '@/hooks/useUploadCV';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spacer } from '@/components/ui/Spacer';
import { Divider } from '@/components/ui/Divider';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { CompletionBar } from '@/components/profile/CompletionBar';
import { SkillChip } from '@/components/profile/SkillChip';
import { ExperienceItem, parseExperienceEntry } from '@/components/profile/ExperienceItem';
import { CvUploadCard } from '@/components/profile/CvUploadCard';

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
  const { colors, spacing } = useTheme();
  const { profile, isLoading, fetchProfile } = useProfile();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ── useUploadCV : écoute CV_PARSED pour désactiver l'état « analyse » ─────
  const { isUploading, progress, pickAndUpload } = useUploadCV({
    onParsed: useCallback(() => {
      setIsAnalyzing(false);
      void fetchProfile(); // rafraîchit le profil après analyse IA
    }, [fetchProfile]),
  });

  // ── Pull-to-refresh ────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchProfile();
    setIsRefreshing(false);
  }, [fetchProfile]);

  // ── Upload CV ──────────────────────────────────────────────────────────────
  const handleUpload = useCallback(async () => {
    try {
      const url = await pickAndUpload();
      if (url) {
        setIsAnalyzing(true); // upload OK → attente SSE CV_PARSED
      }
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer le CV. Réessayez.");
    }
  }, [pickAndUpload]);

  // ── Données dérivées ───────────────────────────────────────────────────────
  const skills = (profile?.skills ?? [])
    .map(resolveSkillLabel)
    .filter((s): s is string => s !== null);
  const experiences = (profile?.experience ?? [])
    .map(parseExperienceEntry)
    .filter((e) => e !== null);

  return (
    <ScreenWrapper padded={false}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
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
            <ProfileHeader
              profile={profile}
              editable
              onEditPress={() => router.push('/(app)/profile/edit')}
            />

            <Spacer size={spacing.md} />

            {/* ── Barre de complétion ── */}
            <CompletionBar profile={profile} />

            {/* ── Compétences ── */}
            {skills.length > 0 && (
              <>
                <Spacer size={spacing.lg} />
                <Divider />
                <Spacer size={spacing.lg} />
                <SectionTitle label="Compétences" />
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
                <Spacer size={spacing.lg} />
                <Divider />
                <Spacer size={spacing.lg} />
                <SectionTitle label="Expériences" />
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
            <Spacer size={spacing.lg} />
            <Divider />
            <Spacer size={spacing.lg} />
            <SectionTitle label="Curriculum Vitae" />
            <CvUploadCard
              cvUrl={profile?.cvUrl ?? null}
              isUploading={isUploading}
              progress={progress}
              isAnalyzing={isAnalyzing}
              onUpload={() => {
                void handleUpload();
              }}
            />
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
