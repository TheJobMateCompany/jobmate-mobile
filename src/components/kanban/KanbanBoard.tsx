/**
 * KanbanBoard — Phase 5.2
 *
 * Board Kanban horizontal : une `KanbanColumn` par `ApplicationStatus`.
 * Défilement horizontal (ScrollView) ; défilement vertical dans chaque colonne.
 *
 * Répartition des colonnes :
 *   TO_APPLY → APPLIED → INTERVIEW → OFFER → HIRED | REJECTED (fin)
 *
 * Props :
 *   applications  — liste plate depuis `useApplications`
 *   jobsMap       — Record<jobFeedId, {title, company}> construit par l'écran
 *                   (évite de passer tout le store)
 *   submittingIds — Set<string> → propagé jusqu'aux KanbanCard
 *   onCardPress   — nav vers détail
 *
 * Utilisé par :
 *   app/(app)/kanban/index.tsx
 */

import { ScrollView, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { KanbanColumn, COLUMN_WIDTH } from './KanbanColumn';
import type { Application, ApplicationStatus } from '@/types/api';

// ─── Ordre des colonnes ───────────────────────────────────────────────────────

const COLUMN_ORDER: ApplicationStatus[] = [
  'TO_APPLY',
  'APPLIED',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED',
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface JobMeta {
  title: string;
  company: string | null;
}

export interface KanbanBoardProps {
  applications: Application[];
  /** jobFeedId → méta du job ; null key = candidature manuelle */
  jobsMap: Record<string, JobMeta>;
  submittingIds: ReadonlySet<string>;
  onCardPress: (applicationId: string) => void;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function KanbanBoard({
  applications,
  jobsMap,
  submittingIds,
  onCardPress,
}: KanbanBoardProps) {
  const { spacing } = useTheme();

  // Groupe les candidatures par statut
  const byStatus = COLUMN_ORDER.reduce<Record<ApplicationStatus, Application[]>>(
    (acc, status) => {
      acc[status] = applications.filter((a) => a.currentStatus === status);
      return acc;
    },
    {} as Record<ApplicationStatus, Application[]>,
  );

  // Résolveur titre/entreprise depuis jobsMap
  const resolveJob = (jobFeedId: string | null): JobMeta => {
    if (!jobFeedId) return { title: 'Candidature manuelle', company: null };
    return jobsMap[jobFeedId] ?? { title: 'Offre inconnue', company: null };
  };

  // largeur totale = colonnes * largeur + marges
  const totalWidth = COLUMN_ORDER.length * COLUMN_WIDTH + (COLUMN_ORDER.length + 1) * spacing.md;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        width: totalWidth,
      }}
    >
      {COLUMN_ORDER.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          applications={byStatus[status]}
          submittingIds={submittingIds}
          resolveJob={resolveJob}
          onCardPress={onCardPress}
        />
      ))}
    </ScrollView>
  );
}
