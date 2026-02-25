/**
 * ExperienceItem — Phase 3.5
 *
 * Affiche une entrée d'expérience professionnelle en format timeline :
 * - Ligne verticale + point
 * - Poste (titre), Entreprise, Dates (début – fin)
 * - Description (collapsible si > 3 lignes)
 *
 * Le backend stocke `experience` comme un tableau JSON arbitraire.
 * Ce composant définit l'interface `ExperienceEntry` qu'il attend,
 * le parsing défensif est fait via `parseExperienceEntry`.
 *
 * Utilisé par :
 *   app/(app)/profile/index.tsx
 */

import { useState } from 'react';
import { View, Text, TouchableOpacity, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExperienceEntry {
  title: string;
  company: string;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
}

/**
 * Parse défensif d'un élément `unknown` du tableau `profile.experience`.
 * Retourne null si l'objet ne contient pas les champs minimaux.
 */
export function parseExperienceEntry(raw: unknown): ExperienceEntry | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj['title'] !== 'string' || typeof obj['company'] !== 'string') return null;
  return {
    title: obj['title'],
    company: obj['company'],
    startDate: typeof obj['startDate'] === 'string' ? obj['startDate'] : null,
    endDate: typeof obj['endDate'] === 'string' ? obj['endDate'] : null,
    description: typeof obj['description'] === 'string' ? obj['description'] : null,
  };
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface ExperienceItemProps {
  entry: ExperienceEntry;
  /** Last item dans la liste → ne pas afficher la ligne de continuation */
  isLast?: boolean;
  style?: ViewStyle;
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function ExperienceItem({ entry, isLast = false, style }: ExperienceItemProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const dateRange = [entry.startDate, entry.endDate ?? "Aujourd'hui"].filter(Boolean).join(' – ');

  const hasDescription = Boolean(entry.description?.trim());

  return (
    <View style={[{ flexDirection: 'row', gap: spacing.sm }, style]}>
      {/* Timeline indicator */}
      <View style={{ alignItems: 'center', width: 20 }}>
        {/* Point */}
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: radius.full,
            backgroundColor: colors.primary,
            marginTop: 4,
          }}
        />
        {/* Ligne de continuation */}
        {!isLast && (
          <View
            style={{
              flex: 1,
              width: 2,
              backgroundColor: colors.border,
              marginTop: spacing.xs / 2,
            }}
          />
        )}
      </View>

      {/* Contenu */}
      <View style={{ flex: 1, paddingBottom: isLast ? 0 : spacing.md }}>
        <Text style={[typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}>
          {entry.title}
        </Text>

        <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
          {entry.company}
        </Text>

        {dateRange.length > 0 && (
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            {dateRange}
          </Text>
        )}

        {hasDescription && (
          <TouchableOpacity
            onPress={() => setExpanded((v) => !v)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Réduire la description' : 'Voir la description'}
          >
            <Text
              style={[
                typography.caption,
                { color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 18 },
              ]}
              numberOfLines={expanded ? undefined : 3}
            >
              {entry.description}
            </Text>
            {entry.description && entry.description.length > 120 && (
              <Text
                style={[
                  typography.caption,
                  { color: colors.primary, fontWeight: '600', marginTop: 2 },
                ]}
              >
                {expanded ? 'Voir moins' : 'Voir plus'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
