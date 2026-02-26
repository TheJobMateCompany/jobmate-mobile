/**
 * CompletionBar — Phase 3.5
 *
 * Barre de progression du profil [0-100%] avec message d'encouragement.
 * Affiche un message si le taux de complétion est < 80 %.
 *
 * Calcul de la complétion :
 *   Chaque champ non-vide du profil vaut 1 point sur le total de champs définis.
 *   Les tableaux vides comptent comme non-remplis.
 *
 * Utilisé par :
 *   app/(app)/profile/index.tsx
 */

import { View, Text, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Profile } from '@/types/api';

// ─── Calcul complétion ───────────────────────────────────────────────────────

const COMPLETION_FIELDS = [
  'fullName',
  'status',
  'skills',
  'experience',
  'projects',
  'education',
  'certifications',
  'cvUrl',
] as const satisfies ReadonlyArray<keyof Profile>;

/**
 * Retourne un score de complétion entre 0 et 1.
 * Chaque champ présent et non-vide vaut 1/total.
 */
export function computeCompletion(profile: Profile | null): number {
  if (!profile) return 0;

  const filled = COMPLETION_FIELDS.filter((field) => {
    const val = profile[field];
    if (val === null || val === undefined) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    return Boolean(val);
  }).length;

  return filled / COMPLETION_FIELDS.length;
}

// ─── Messages contextuels ────────────────────────────────────────────────────

function getCompletionMessage(
  pct: number,
  t: (key: string, options?: Record<string, unknown>) => string,
): string | null {
  if (pct >= 0.8) return null; // profil suffisamment complet, pas de message
  if (pct === 0) return t('profile.completion.msgStart');
  if (pct < 0.3) return t('profile.completion.msgVeryIncomplete');
  if (pct < 0.5) return t('profile.completion.msgContinue');
  return t('profile.completion.msgAlmost');
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface CompletionBarProps {
  profile: Profile | null;
  style?: ViewStyle;
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function CompletionBar({ profile, style }: CompletionBarProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, typography } = useTheme();

  const completion = computeCompletion(profile);
  const pct = Math.round(completion * 100);
  const message = getCompletionMessage(completion, t);

  const barColor =
    completion >= 0.8 ? colors.success : completion >= 0.5 ? colors.warning : colors.danger;

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          padding: spacing.md,
          gap: spacing.sm,
        },
        style,
      ]}
    >
      {/* En-tête */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[typography.label, { color: colors.textPrimary }]}>
          {t('profile.completion.title')}
        </Text>
        <Text style={[typography.label, { color: barColor, fontWeight: '700' }]}>{pct} %</Text>
      </View>

      {/* Barre — on surcharge la couleur via un wrapper */}
      <View
        style={{
          overflow: 'hidden',
          borderRadius: radius.full,
          height: 8,
          backgroundColor: colors.surfaceVariant,
        }}
      >
        <View
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: barColor,
            borderRadius: radius.full,
          }}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: pct }}
        />
      </View>

      {/* Message d'encouragement */}
      {message && (
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{message}</Text>
      )}
    </View>
  );
}
