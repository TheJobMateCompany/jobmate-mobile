/**
 * StatusBadge — Phase 5.2
 *
 * Badge coloré selon `ApplicationStatus`.
 * Réutilise les tokens thème (success/warning/danger/primary).
 *
 * Machine d'états :
 *   TO_APPLY   → primary  (bleu)
 *   APPLIED    → warning  (orange)
 *   INTERVIEW  → primary  (bleu foncé via primaryDark)
 *   OFFER      → success  (vert)
 *   HIRED      → success  (vert soutenu)
 *   REJECTED   → danger   (rouge)
 *
 * Utilisé par :
 *   src/components/kanban/KanbanCard.tsx
 *   src/components/kanban/KanbanColumn.tsx
 *   app/(app)/kanban/[id].tsx
 */

import { View, Text, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { ApplicationStatus } from '@/types/api';

// ─── Maps ─────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  TO_APPLY: 'À postuler',
  APPLIED: 'Postulé',
  INTERVIEW: 'Entretien',
  OFFER: 'Offre reçue',
  HIRED: 'Embauché 🎉',
  REJECTED: 'Rejeté',
};

type ColorKey = 'primary' | 'success' | 'warning' | 'danger';

const STATUS_COLOR: Record<ApplicationStatus, ColorKey> = {
  TO_APPLY: 'primary',
  APPLIED: 'warning',
  INTERVIEW: 'primary',
  OFFER: 'success',
  HIRED: 'success',
  REJECTED: 'danger',
};

const BG_OVERRIDE: Partial<Record<ApplicationStatus, string>> = {
  INTERVIEW: '#EDE9FE', // primaryLight — distinction visuelle avec TO_APPLY
  HIRED: '#D1FAE5',
};

const FG_OVERRIDE: Partial<Record<ApplicationStatus, string>> = {
  INTERVIEW: '#6D28D9', // violet — distinction de TO_APPLY
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StatusBadgeProps {
  status: ApplicationStatus;
  style?: ViewStyle;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const { colors, spacing, radius, typography } = useTheme();

  const colorKey = STATUS_COLOR[status];

  const bgMap: Record<ColorKey, string> = {
    primary: colors.primaryLight,
    success: '#D1FAE5',
    warning: '#FEF3C7',
    danger: '#FEE2E2',
  };

  const fgMap: Record<ColorKey, string> = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
  };

  const bg = BG_OVERRIDE[status] ?? bgMap[colorKey];
  const fg = FG_OVERRIDE[status] ?? fgMap[colorKey];

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius.full,
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          alignSelf: 'flex-start',
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={STATUS_LABEL[status]}
    >
      <Text style={[typography.caption, { color: fg, fontWeight: '600' }]}>
        {STATUS_LABEL[status]}
      </Text>
    </View>
  );
}
