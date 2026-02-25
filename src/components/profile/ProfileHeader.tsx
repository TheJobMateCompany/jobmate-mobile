/**
 * ProfileHeader — Phase 3.5
 *
 * Affiche :
 * - Avatar : cercle avec initiales (si pas de photo) ou image (extensible)
 * - Nom complet (ou placeholder « Profil incomplet »)
 * - Badge de statut (ProfileStatus → libellé FR)
 * - Bouton « Modifier » (optionnel — masqué en mode lecture seule)
 *
 * Utilisé par :
 *   app/(app)/profile/index.tsx
 */

import { View, Text, TouchableOpacity, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Badge } from '@/components/ui/Badge';
import type { BadgeVariant } from '@/components/ui/Badge';
import type { Profile, ProfileStatus } from '@/types/api';

// ─── Mappings statut ────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ProfileStatus, string> = {
  STUDENT: 'Étudiant',
  JUNIOR: 'Junior',
  MID: 'Confirmé',
  SENIOR: 'Senior',
  OPEN_TO_WORK: 'En recherche',
};

const STATUS_BADGE_VARIANT: Record<ProfileStatus, BadgeVariant> = {
  STUDENT: 'neutral',
  JUNIOR: 'primary',
  MID: 'primary',
  SENIOR: 'warning',
  OPEN_TO_WORK: 'success',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Extrait les initiales depuis un nom (max 2 lettres). */
function getInitials(fullName: string | null): string {
  if (!fullName?.trim()) return '?';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0][0] ?? '?').toUpperCase();
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase();
}

// ─── Props ──────────────────────────────────────────────────────────────────

export interface ProfileHeaderProps {
  profile: Profile | null;
  /** Afficher le bouton « Modifier » */
  editable?: boolean;
  onEditPress?: () => void;
  style?: ViewStyle;
}

// ─── Composant ──────────────────────────────────────────────────────────────

export function ProfileHeader({
  profile,
  editable = false,
  onEditPress,
  style,
}: ProfileHeaderProps) {
  const { colors, spacing, radius, typography } = useTheme();

  const initials = getInitials(profile?.fullName ?? null);
  const displayName = profile?.fullName?.trim() || 'Profil incomplet';
  const status = profile?.status ?? null;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          padding: spacing.md,
          gap: spacing.md,
        },
        style,
      ]}
    >
      {/* Avatar */}
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.full,
          backgroundColor: colors.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        accessibilityLabel={`Avatar de ${displayName}`}
      >
        <Text
          style={[
            typography.headingMedium,
            { color: colors.primary, fontWeight: '700', lineHeight: 28 },
          ]}
        >
          {initials}
        </Text>
      </View>

      {/* Infos */}
      <View style={{ flex: 1, gap: spacing.xs / 2 }}>
        <Text style={[typography.headingMedium, { color: colors.textPrimary }]} numberOfLines={1}>
          {displayName}
        </Text>

        {status && <Badge label={STATUS_LABEL[status]} variant={STATUS_BADGE_VARIANT[status]} />}
      </View>

      {/* Bouton modifier */}
      {editable && onEditPress && (
        <TouchableOpacity
          onPress={onEditPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Modifier le profil"
        >
          <Text style={[typography.label, { color: colors.primary }]}>Modifier</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
