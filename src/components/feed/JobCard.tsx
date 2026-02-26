/**
 * JobCard — Phase 4.2
 *
 * Carte d'offre d'emploi dans la FlatList du feed.
 * Extrait titre, entreprise, lieu depuis `rawData` (JSON brut scraper).
 * Affiche : titre, entreprise, lieu, badge remotePolicy, date relative, badge statut.
 *
 * Utilisé par :
 *   app/(app)/feed/index.tsx  — SwipeRow > JobCard
 */

import { View, Text, TouchableOpacity, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { Badge } from '@/components/ui/Badge';
import type { BadgeVariant } from '@/components/ui/Badge';
import type { JobFeedItem, JobStatus } from '@/types/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface ParsedJobData {
  title: string;
  company: string | null;
  location: string | null;
  remotePolicy: string | null;
  description: string | null;
}

function parseRawData(rawData: Record<string, unknown>): ParsedJobData {
  const str = (key: string): string | null => {
    const v = rawData[key];
    return typeof v === 'string' && v.trim() ? v.trim() : null;
  };
  return {
    title: str('title') ?? str('poste') ?? '',
    company: str('company') ?? str('entreprise') ?? null,
    location: str('location') ?? str('lieu') ?? null,
    remotePolicy: str('remotePolicy') ?? str('remote_policy') ?? null,
    description: str('description') ?? null,
  };
}

function formatRelativeDate(
  iso: string | null | undefined,
  language: string,
  justNowLabel: string
): string {
  if (!iso) return justNowLabel;

  const timestamp = new Date(iso).getTime();
  if (!Number.isFinite(timestamp)) return justNowLabel;

  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return justNowLabel;

  const isFr = language.startsWith('fr');

  if (minutes < 60) return isFr ? `il y a ${minutes} min` : `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return isFr ? `il y a ${hours} h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return isFr ? `il y a ${days} j` : `${days}d ago`;
}

const STATUS_LABEL_KEY: Record<JobStatus, string> = {
  PENDING: 'feed.filter.pending',
  APPROVED: 'feed.filter.approved',
  REJECTED: 'feed.filter.rejected',
};

const STATUS_VARIANT: Record<JobStatus, BadgeVariant> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface JobCardProps {
  job: JobFeedItem;
  onPress?: () => void;
  style?: ViewStyle;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function JobCard({ job, onPress, style }: JobCardProps) {
  const { t, i18n } = useTranslation();
  const { colors, spacing, radius, typography } = useTheme();
  const parsed = parseRawData(job.rawData);
  const title = parsed.title || t('feed.untitled');
  const { company, location, remotePolicy } = parsed;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Offre : ${title}${company ? ` chez ${company}` : ''}`}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {/* Titre */}
      <Text style={[typography.headingMedium, { color: colors.textPrimary }]} numberOfLines={2}>
        {title}
      </Text>

      {/* Entreprise */}
      {company && (
        <Text
          style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 2 }]}
          numberOfLines={1}
        >
          {company}
        </Text>
      )}

      {/* Lieu */}
      {location && (
        <Text
          style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}
          numberOfLines={1}
        >
          📍 {location}
        </Text>
      )}

      {/* Badges + date */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: spacing.sm,
          marginTop: spacing.sm,
        }}
      >
        <Badge label={t(STATUS_LABEL_KEY[job.status])} variant={STATUS_VARIANT[job.status]} />
        {remotePolicy && <Badge label={remotePolicy} variant="neutral" />}
        {/* Spacer flexible */}
        <View style={{ flex: 1 }} />
        <Text style={[typography.caption, { color: colors.textDisabled }]}>
          {formatRelativeDate(job.createdAt, i18n.language, t('common.justNow'))}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
