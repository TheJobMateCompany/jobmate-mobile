/**
 * Détail offre d'emploi — Phase 4.3
 *
 * Affiche toutes les informations d'un JobFeedItem :
 *   - Titre, entreprise, lieu, remotePolicy, date
 *   - Description (collapsible > 300 chars)
 *   - Lien source ouvrable dans le navigateur
 *   - AnalysisBadge « IA en cours… » (analyse IA Phase 5 sur Application)
 *   - Section lettre de motivation — placeholder Phase 5 visible
 *   - Boutons Approuver (headerRight) / Rejeter (headerLeft) avec haptic
 *
 * L'analyse IA complète (ScoreRing, pros/cons, lettre générée) sera ajoutée
 * en Phase 5 quand l'entité Application sera disponible.
 */

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useJobFeed } from '@/hooks/useJobFeed';
import { useTheme } from '@/hooks/useTheme';
import { AnalysisBadge } from '@/components/feed/AnalysisBadge';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

// ─── Helpers rawData ──────────────────────────────────────────────────────────

function str(rawData: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = rawData[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

// ─── Écran ────────────────────────────────────────────────────────────────────

export default function FeedDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius, typography } = useTheme();
  const { jobs, isLoading, isSubmitting, fetchFeed, approveJob, rejectJob } = useJobFeed();
  const [descExpanded, setDescExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Charge les offres si ce screen est ouvert directement (deep link ou reset)
  useEffect(() => {
    if (jobs.length === 0) void fetchFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const job = jobs.find((j) => j.id === id);
  const raw = job?.rawData ?? {};

  const title = str(raw, 'title', 'poste') ?? 'Offre sans titre';
  const company = str(raw, 'company', 'entreprise');
  const location = str(raw, 'location', 'lieu');
  const remotePolicy = str(raw, 'remotePolicy', 'remote_policy');
  const description = str(raw, 'description');
  const sourceUrl = job?.sourceUrl ?? str(raw, 'url', 'sourceUrl');

  // Placeholder lettre de motivation depuis rawData (Phase 5 : depuis Application)
  const coverLetter = str(raw, 'coverLetter', 'cover_letter');

  // ─── Actions ──────────────────────────────────────────────────────────────────

  const handleApprove = useCallback(async () => {
    if (!job || actionLoading) return;
    setActionLoading(true);
    try {
      await approveJob(job.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setActionLoading(false);
    }
  }, [job, actionLoading, approveJob]);

  const handleReject = useCallback(async () => {
    if (!job || actionLoading) return;
    setActionLoading(true);
    try {
      await rejectJob(job.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      router.back();
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setActionLoading(false);
    }
  }, [job, actionLoading, rejectJob]);

  const handleCopyLetter = useCallback(async () => {
    if (!coverLetter) return;
    await Clipboard.setStringAsync(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [coverLetter]);

  // ─── États de chargement / not found ─────────────────────────────────────────

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <Stack.Screen options={{ title: 'Offre', headerShown: true }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!job) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
          padding: spacing.xl,
        }}
      >
        <Stack.Screen options={{ title: 'Offre introuvable', headerShown: true }} />
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center' }]}>
          Cette offre n'est plus disponible.
        </Text>
        <Button
          label="Retour"
          onPress={() => router.back()}
          variant="ghost"
          style={{ marginTop: spacing.md }}
        />
      </View>
    );
  }

  const descTruncated = description && description.length > 300 && !descExpanded;
  const displayedDesc = descTruncated ? description.slice(0, 300) + '…' : description;

  const isPending = job.status === 'PENDING';

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <Stack.Screen
        options={{
          title: title,
          headerShown: true,
          headerLeft: isPending
            ? () => (
                <TouchableOpacity
                  onPress={() => void handleReject()}
                  disabled={actionLoading || isSubmitting}
                  accessibilityLabel="Rejeter cette offre"
                  style={{ marginLeft: 4, paddingHorizontal: spacing.sm }}
                >
                  <Text style={[typography.label, { color: colors.danger }]}>
                    {actionLoading ? '…' : 'Rejeter'}
                  </Text>
                </TouchableOpacity>
              )
            : undefined,
          headerRight: isPending
            ? () => (
                <TouchableOpacity
                  onPress={() => void handleApprove()}
                  disabled={actionLoading || isSubmitting}
                  accessibilityLabel="Approuver cette offre"
                  style={{ marginRight: 4, paddingHorizontal: spacing.sm }}
                >
                  <Text style={[typography.label, { color: colors.success }]}>
                    {actionLoading ? '…' : 'Approuver'}
                  </Text>
                </TouchableOpacity>
              )
            : undefined,
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xxl }}
      >
        {/* ── En-tête ──────────────────────────────────────────────────────── */}
        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.headingLarge, { color: colors.textPrimary }]}>{title}</Text>

          {company && (
            <Text style={[typography.bodyLarge, { color: colors.textSecondary }]}>{company}</Text>
          )}

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.sm,
              alignItems: 'center',
            }}
          >
            {location && (
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                📍 {location}
              </Text>
            )}
            {remotePolicy && <Badge label={remotePolicy} variant="neutral" />}
            <Badge
              label={
                job.status === 'PENDING'
                  ? 'À traiter'
                  : job.status === 'APPROVED'
                    ? 'Approuvé'
                    : 'Rejeté'
              }
              variant={
                job.status === 'PENDING'
                  ? 'warning'
                  : job.status === 'APPROVED'
                    ? 'success'
                    : 'danger'
              }
            />
          </View>

          {/* Badge analyse IA */}
          <AnalysisBadge analyzed={false} />
        </View>

        {/* ── Description ──────────────────────────────────────────────────── */}
        {description ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: colors.border,
              gap: spacing.sm,
            }}
          >
            <Text style={[typography.headingMedium, { color: colors.textPrimary }]}>
              Description
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, lineHeight: 22 }]}>
              {displayedDesc}
            </Text>
            {description.length > 300 && (
              <TouchableOpacity
                onPress={() => setDescExpanded((v) => !v)}
                accessibilityRole="button"
              >
                <Text style={[typography.label, { color: colors.primary }]}>
                  {descExpanded ? 'Réduire ▲' : 'Lire la suite ▼'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* ── Lien source ──────────────────────────────────────────────────── */}
        {sourceUrl ? (
          <TouchableOpacity
            onPress={() => void Linking.openURL(sourceUrl)}
            accessibilityRole="link"
            accessibilityLabel="Ouvrir l'offre originale"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={[typography.label, { color: colors.primary, flex: 1 }]} numberOfLines={1}>
              🔗 {sourceUrl}
            </Text>
            <Text style={[typography.caption, { color: colors.textDisabled }]}>Ouvrir ↗</Text>
          </TouchableOpacity>
        ) : null}

        {/* ── Lettre de motivation ─────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            padding: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
            gap: spacing.sm,
          }}
        >
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text style={[typography.headingMedium, { color: colors.textPrimary }]}>
              Lettre de motivation
            </Text>
            {coverLetter && (
              <TouchableOpacity onPress={() => void handleCopyLetter()} accessibilityRole="button">
                <Text
                  style={[typography.label, { color: copied ? colors.success : colors.primary }]}
                >
                  {copied ? 'Copié ✓' : 'Copier'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {coverLetter ? (
            <Text style={[typography.bodySmall, { color: colors.textSecondary, lineHeight: 20 }]}>
              {coverLetter}
            </Text>
          ) : (
            <Text
              style={[typography.bodySmall, { color: colors.textDisabled, fontStyle: 'italic' }]}
            >
              La lettre de motivation sera générée automatiquement après approbation de l'offre
              (Phase 5 — Candidatures).
            </Text>
          )}
        </View>

        {/* ── Boutons d'action (PENDING uniquement) ────────────────────────── */}
        {isPending && (
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Button
              label="Rejeter"
              onPress={() => void handleReject()}
              variant="danger"
              loading={actionLoading}
              disabled={isSubmitting}
              style={{ flex: 1 }}
            />
            <Button
              label="Approuver"
              onPress={() => void handleApprove()}
              variant="primary"
              loading={actionLoading}
              disabled={isSubmitting}
              style={{ flex: 1 }}
            />
          </View>
        )}
      </ScrollView>
    </>
  );
}
