/**
 * KanbanCard — Phase 5.2
 *
 * Carte de candidature dans une colonne Kanban.
 *
 * Contenu :
 *   - Titre et entreprise extraits de `rawData` du job associé (props directes)
 *   - `ScoreRing` mini (size=44) si un score IA est disponible
 *   - Date du dernier mouvement (historyLog.at(-1).at) ou createdAt
 *   - Icône 🔔 si `relanceReminderAt` est dans les prochaines 48h
 *   - `RatingStars` en lecture seule (readOnly, size=14)
 *
 * Utilisé par :
 *   src/components/kanban/KanbanColumn.tsx
 */

import { View, Text, TouchableOpacity, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { ScoreRing } from '@/components/feed/ScoreRing';
import { RatingStars } from './RatingStars';
import type { Application } from '@/types/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "À l'instant";
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

function isWithin48h(isoDate: string): boolean {
  const diff = new Date(isoDate).getTime() - Date.now();
  return diff > 0 && diff < 48 * 3_600_000;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface KanbanCardProps {
  application: Application;
  /** Titre de l'offre — extrait du rawData par le parent */
  jobTitle: string;
  /** Entreprise — extrait du rawData par le parent */
  jobCompany: string | null;
  onPress?: () => void;
  /** true = mutation en cours pour cette card (spinner discret) */
  isSubmitting?: boolean;
  style?: ViewStyle;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function KanbanCard({
  application,
  jobTitle,
  jobCompany,
  onPress,
  isSubmitting = false,
  style,
}: KanbanCardProps) {
  const { colors, spacing, radius, typography } = useTheme();

  const score = application.aiAnalysis?.score ?? null;

  // Date du dernier mouvement (dernier élément historyLog ou createdAt)
  const lastMovedAt =
    application.historyLog.length > 0
      ? application.historyLog[application.historyLog.length - 1].at
      : application.createdAt;

  const hasRelanceAlert =
    application.relanceReminderAt !== null && isWithin48h(application.relanceReminderAt);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={isSubmitting}
      accessibilityRole="button"
      accessibilityLabel={`Candidature : ${jobTitle}${jobCompany ? ` chez ${jobCompany}` : ''}`}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: isSubmitting ? colors.primary : colors.border,
          opacity: isSubmitting ? 0.7 : 1,
          gap: spacing.sm,
        },
        style,
      ]}
    >
      {/* Ligne titre + score */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={[typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}
            numberOfLines={2}
          >
            {jobTitle}
          </Text>
          {jobCompany && (
            <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
              {jobCompany}
            </Text>
          )}
        </View>

        {score !== null && <ScoreRing score={score} size={44} strokeWidth={5} />}
      </View>

      {/* Étoiles (lecture seule) */}
      {application.userRating !== null && (
        <RatingStars value={application.userRating} readOnly size={14} />
      )}

      {/* Pied : date + alerte relance */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[typography.caption, { color: colors.textDisabled }]}>
          {formatRelativeDate(lastMovedAt)}
        </Text>
        {hasRelanceAlert && (
          <Text
            style={[typography.caption, { color: colors.warning }]}
            accessibilityLabel="Rappel de relance dans moins de 48 heures"
          >
            🔔 Relance
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
