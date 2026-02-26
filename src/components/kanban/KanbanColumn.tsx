/**
 * KanbanColumn — Phase 5.2
 *
 * Colonne verticale du board Kanban.
 * Contient :
 *   - Header : nom du statut (localisé FR) + badge count
 *   - `FlatList` verticale de `KanbanCard`
 *   - État vide minimaliste si 0 cards
 *
 * Largeur fixée à COLUMN_WIDTH (280 dp) pour que KanbanBoard puisse
 * calculer la largeur totale du ScrollView horizontal.
 *
 * Utilisé par :
 *   src/components/kanban/KanbanBoard.tsx
 */

import { View, Text, FlatList, type ListRenderItem } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { KanbanCard } from './KanbanCard';
import { StatusBadge } from './StatusBadge';
import type { Application, ApplicationStatus } from '@/types/api';

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Largeur d'une colonne — exportée pour que KanbanBoard calcule le contentSize */
export const COLUMN_WIDTH = 280;

/** Labels FR des colonnes */
const COLUMN_LABEL: Record<ApplicationStatus, string> = {
  TO_APPLY: 'À postuler',
  APPLIED: 'Postulé',
  INTERVIEW: 'Entretien',
  OFFER: 'Offre reçue',
  HIRED: 'Embauché',
  REJECTED: 'Rejeté',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface KanbanColumnProps {
  status: ApplicationStatus;
  applications: Application[];
  submittingIds: ReadonlySet<string>;
  /** Résout titre + entreprise depuis le jobFeedId (fourni par le board) */
  resolveJob: (jobFeedId: string | null) => { title: string; company: string | null };
  onCardPress: (applicationId: string) => void;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function KanbanColumn({
  status,
  applications,
  submittingIds,
  resolveJob,
  onCardPress,
}: KanbanColumnProps) {
  const { colors, spacing, radius, typography } = useTheme();

  const renderItem: ListRenderItem<Application> = ({ item }) => {
    const { title, company } = resolveJob(item.jobFeedId);
    return (
      <KanbanCard
        application={item}
        jobTitle={title}
        jobCompany={company}
        isSubmitting={submittingIds.has(item.id)}
        onPress={() => onCardPress(item.id)}
        style={{ marginBottom: spacing.sm }}
      />
    );
  };

  return (
    <View
      style={{
        width: COLUMN_WIDTH,
        backgroundColor: colors.surfaceVariant,
        borderRadius: radius.lg,
        padding: spacing.sm,
        marginRight: spacing.md,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.xs,
          paddingBottom: spacing.sm,
        }}
      >
        <Text style={[typography.headingMedium, { color: colors.textPrimary }]}>
          {COLUMN_LABEL[status]}
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.full,
            minWidth: 24,
            height: 24,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing.xs,
          }}
        >
          <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '700' }]}>
            {applications.length}
          </Text>
        </View>
      </View>

      {/* Liste de cards */}
      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollEnabled={false} // défilement géré par KanbanBoard (ScrollView imbriqué vertical)
        ListEmptyComponent={
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.xl,
            }}
          >
            <Text style={[typography.caption, { color: colors.textDisabled, textAlign: 'center' }]}>
              Aucune candidature
            </Text>
          </View>
        }
      />
    </View>
  );
}
