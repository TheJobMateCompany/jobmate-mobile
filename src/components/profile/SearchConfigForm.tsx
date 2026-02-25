/**
 * SearchConfigForm — Phase 3.7
 *
 * Formulaire partagé entre new.tsx et [id].tsx.
 * Gère son propre état (initialisé depuis `initialValues`).
 * Appelle `onSubmit(input)` à la validation.
 *
 * Champs :
 *   jobTitles       — tag input (obligatoire, au moins 1)
 *   locations       — tag input + bouton « Ma position » (useLocation)
 *   remotePolicy    — sélecteur radio parmi REMOTE / HYBRID / ON_SITE
 *   keywords        — tag input (mots-clés positifs)
 *   redFlags        — tag input (signaux d'alerte à éviter)
 *   salaryMin/Max   — inputs numériques (clavier numérique)
 *   duration        — texte libre (ex : "CDI", "Stage 6 mois")
 *   startDate       — date ISO (ex : "2026-09-01")
 *   coverLetterTemplate — texte libre multiline
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLocation } from '@/hooks/useLocation';
import { Button } from '@/components/ui/Button';
import { Spacer } from '@/components/ui/Spacer';
import { Divider } from '@/components/ui/Divider';
import type { CreateSearchConfigInput, RemotePolicy } from '@/types/api';

// ─── Constantes ───────────────────────────────────────────────────────────────

const REMOTE_POLICIES: { value: RemotePolicy; label: string }[] = [
  { value: 'REMOTE', label: 'Full remote' },
  { value: 'HYBRID', label: 'Hybride' },
  { value: 'ON_SITE', label: 'Présentiel' },
];

// ─── Sous-composants locaux ───────────────────────────────────────────────────

/** Label de section */
function SectionLabel({ text }: { text: string }) {
  const { colors, typography, spacing } = useTheme();
  return (
    <Text style={[typography.label, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
      {text}
    </Text>
  );
}

/** Chip tag supprimable */
function TagChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  const { colors, spacing, radius, typography } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
        borderRadius: radius.full,
        paddingVertical: spacing.xs / 2,
        paddingLeft: spacing.sm,
        paddingRight: spacing.xs,
        gap: 4,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
        {label}
      </Text>
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        accessibilityRole="button"
        accessibilityLabel={`Supprimer ${label}`}
      >
        <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

/** Rangée de tags + champ d'ajout */
function TagField({
  tags,
  onAdd,
  onRemove,
  placeholder,
  suffix,
}: {
  tags: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  placeholder: string;
  suffix?: React.ReactNode;
}) {
  const { colors, spacing, radius, typography } = useTheme();
  const [draft, setDraft] = useState('');

  const commit = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed || tags.includes(trimmed)) {
      setDraft('');
      return;
    }
    onAdd(trimmed);
    setDraft('');
  }, [draft, tags, onAdd]);

  return (
    <View style={{ gap: spacing.sm }}>
      {/* Chips existantes */}
      {tags.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {tags.map((t) => (
            <TagChip key={t} label={t} onRemove={() => onRemove(t)} />
          ))}
        </View>
      )}

      {/* Champ ajout */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: colors.border,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.sm,
          backgroundColor: colors.surface,
          gap: spacing.sm,
        }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor={colors.textDisabled}
          returnKeyType="done"
          onSubmitEditing={commit}
          style={[
            typography.bodyMedium,
            { flex: 1, color: colors.textPrimary, paddingVertical: spacing.sm },
          ]}
        />
        {suffix}
        <TouchableOpacity
          onPress={commit}
          disabled={!draft.trim()}
          style={{ opacity: draft.trim() ? 1 : 0.3 }}
          accessibilityRole="button"
          accessibilityLabel="Ajouter"
        >
          <Text style={[typography.label, { color: colors.primary }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SearchConfigFormProps {
  initialValues?: Partial<CreateSearchConfigInput>;
  onSubmit: (input: CreateSearchConfigInput) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
}

// ─── Formulaire principal ─────────────────────────────────────────────────────

export function SearchConfigForm({
  initialValues,
  onSubmit,
  submitLabel = 'Créer la configuration',
  isLoading = false,
}: SearchConfigFormProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const { getCity, isLoading: isLocating, permissionDenied } = useLocation();

  // ─── État formulaire ──────────────────────────────────────────────────────

  const [jobTitles, setJobTitles] = useState<string[]>(initialValues?.jobTitles ?? []);
  const [locations, setLocations] = useState<string[]>(initialValues?.locations ?? []);
  const [remotePolicy, setRemotePolicy] = useState<RemotePolicy>(
    initialValues?.remotePolicy ?? 'HYBRID',
  );
  const [keywords, setKeywords] = useState<string[]>(initialValues?.keywords ?? []);
  const [redFlags, setRedFlags] = useState<string[]>(initialValues?.redFlags ?? []);
  const [salaryMin, setSalaryMin] = useState(
    initialValues?.salaryMin != null ? String(initialValues.salaryMin) : '',
  );
  const [salaryMax, setSalaryMax] = useState(
    initialValues?.salaryMax != null ? String(initialValues.salaryMax) : '',
  );
  const [duration, setDuration] = useState(initialValues?.duration ?? '');
  const [startDate, setStartDate] = useState(initialValues?.startDate ?? '');
  const [coverLetterTemplate, setCoverLetterTemplate] = useState(
    initialValues?.coverLetterTemplate ?? '',
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  // ─── Helpers tag ──────────────────────────────────────────────────────────

  const addTag = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string[]>>) => (v: string) =>
      setter((prev) => (prev.includes(v) ? prev : [...prev, v])),
    [],
  );
  const removeTag = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string[]>>) => (v: string) =>
      setter((prev) => prev.filter((t) => t !== v)),
    [],
  );

  // ─── Auto-fill position ───────────────────────────────────────────────────

  const handleAutoLocation = useCallback(async () => {
    const city = await getCity();
    if (city && !locations.includes(city)) {
      setLocations((prev) => [...prev, city]);
    } else if (permissionDenied) {
      Alert.alert(
        'Permission refusée',
        'Activez la localisation dans les réglages pour utiliser cette fonctionnalité.',
      );
    }
  }, [getCity, locations, permissionDenied]);

  // ─── Soumission ───────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    setValidationError(null);

    if (jobTitles.length === 0) {
      setValidationError('Ajoutez au moins un intitulé de poste.');
      return;
    }

    const minVal = salaryMin ? parseInt(salaryMin, 10) : undefined;
    const maxVal = salaryMax ? parseInt(salaryMax, 10) : undefined;
    if (minVal !== undefined && maxVal !== undefined && minVal > maxVal) {
      setValidationError('Le salaire minimum ne peut pas dépasser le maximum.');
      return;
    }

    const input: CreateSearchConfigInput = {
      jobTitles,
      locations,
      remotePolicy,
      keywords: keywords.length > 0 ? keywords : undefined,
      redFlags: redFlags.length > 0 ? redFlags : undefined,
      salaryMin: minVal,
      salaryMax: maxVal,
      duration: duration.trim() || undefined,
      startDate: startDate.trim() || undefined,
      coverLetterTemplate: coverLetterTemplate.trim() || undefined,
    };

    await onSubmit(input);
  }, [
    jobTitles,
    locations,
    remotePolicy,
    keywords,
    redFlags,
    salaryMin,
    salaryMax,
    duration,
    startDate,
    coverLetterTemplate,
    onSubmit,
  ]);

  // ─── Bouton localisation (suffix pour TagField) ───────────────────────────

  const locationSuffix = (
    <TouchableOpacity
      onPress={() => {
        void handleAutoLocation();
      }}
      disabled={isLocating}
      accessibilityRole="button"
      accessibilityLabel="Utiliser ma position"
      style={{ opacity: isLocating ? 0.5 : 1 }}
    >
      {isLocating ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>📍</Text>
      )}
    </TouchableOpacity>
  );

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <View style={{ gap: spacing.lg }}>
      {/* ── Intitulés de poste ── */}
      <View>
        <SectionLabel text="Intitulés de poste *" />
        <TagField
          tags={jobTitles}
          onAdd={addTag(setJobTitles)}
          onRemove={removeTag(setJobTitles)}
          placeholder="ex : Développeur React Native…"
        />
      </View>

      <Divider />

      {/* ── Localisations ── */}
      <View>
        <SectionLabel text="Localisations" />
        <TagField
          tags={locations}
          onAdd={addTag(setLocations)}
          onRemove={removeTag(setLocations)}
          placeholder="ex : Paris, Lyon…"
          suffix={locationSuffix}
        />
      </View>

      <Divider />

      {/* ── Télétravail ── */}
      <View>
        <SectionLabel text="Mode de travail" />
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          {REMOTE_POLICIES.map(({ value, label }) => {
            const selected = remotePolicy === value;
            return (
              <TouchableOpacity
                key={value}
                onPress={() => setRemotePolicy(value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={label}
                style={{
                  paddingVertical: spacing.xs,
                  paddingHorizontal: spacing.sm,
                  borderRadius: radius.full,
                  borderWidth: 1.5,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primaryLight : 'transparent',
                }}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: selected ? colors.primary : colors.textSecondary,
                      fontWeight: selected ? '700' : '400',
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Divider />

      {/* ── Salaire ── */}
      <View>
        <SectionLabel text="Salaire brut annuel (€)" />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {/* Min */}
          <View style={{ flex: 1 }}>
            <TextInput
              value={salaryMin}
              onChangeText={setSalaryMin}
              placeholder="Min"
              placeholderTextColor={colors.textDisabled}
              keyboardType="numeric"
              returnKeyType="next"
              style={[
                typography.bodyMedium,
                {
                  color: colors.textPrimary,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.sm,
                  backgroundColor: colors.surface,
                },
              ]}
              accessibilityLabel="Salaire minimum"
            />
          </View>

          {/* Séparateur */}
          <View style={{ justifyContent: 'center' }}>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>–</Text>
          </View>

          {/* Max */}
          <View style={{ flex: 1 }}>
            <TextInput
              value={salaryMax}
              onChangeText={setSalaryMax}
              placeholder="Max"
              placeholderTextColor={colors.textDisabled}
              keyboardType="numeric"
              returnKeyType="done"
              style={[
                typography.bodyMedium,
                {
                  color: colors.textPrimary,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.sm,
                  backgroundColor: colors.surface,
                },
              ]}
              accessibilityLabel="Salaire maximum"
            />
          </View>
        </View>
      </View>

      <Divider />

      {/* ── Contrat / durée ── */}
      <View>
        <SectionLabel text="Type de contrat / durée" />
        <TextInput
          value={duration}
          onChangeText={setDuration}
          placeholder="ex : CDI, CDD 6 mois, Stage…"
          placeholderTextColor={colors.textDisabled}
          returnKeyType="next"
          style={[
            typography.bodyMedium,
            {
              color: colors.textPrimary,
              borderWidth: 1.5,
              borderColor: colors.border,
              borderRadius: radius.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.sm,
              backgroundColor: colors.surface,
            },
          ]}
          accessibilityLabel="Type de contrat"
        />
      </View>

      <Divider />

      {/* ── Date de début ── */}
      <View>
        <SectionLabel text="Date de disponibilité (YYYY-MM-DD)" />
        <TextInput
          value={startDate}
          onChangeText={setStartDate}
          placeholder="ex : 2026-09-01"
          placeholderTextColor={colors.textDisabled}
          keyboardType="numbers-and-punctuation"
          returnKeyType="next"
          style={[
            typography.bodyMedium,
            {
              color: colors.textPrimary,
              borderWidth: 1.5,
              borderColor: colors.border,
              borderRadius: radius.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.sm,
              backgroundColor: colors.surface,
            },
          ]}
          accessibilityLabel="Date de disponibilité"
        />
      </View>

      <Divider />

      {/* ── Mots-clés ── */}
      <View>
        <SectionLabel text="Mots-clés (inclure)" />
        <TagField
          tags={keywords}
          onAdd={addTag(setKeywords)}
          onRemove={removeTag(setKeywords)}
          placeholder="ex : TypeScript, React…"
        />
      </View>

      <Divider />

      {/* ── Red flags ── */}
      <View>
        <SectionLabel text="Red flags (exclure)" />
        <TagField
          tags={redFlags}
          onAdd={addTag(setRedFlags)}
          onRemove={removeTag(setRedFlags)}
          placeholder="ex : commercial, no-remote…"
        />
      </View>

      <Divider />

      {/* ── Template lettre de motivation ── */}
      <View>
        <SectionLabel text="Template lettre de motivation" />
        <TextInput
          value={coverLetterTemplate}
          onChangeText={setCoverLetterTemplate}
          placeholder="Décrivez votre profil et motivations pour ce type de poste…"
          placeholderTextColor={colors.textDisabled}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={[
            typography.bodyMedium,
            {
              color: colors.textPrimary,
              borderWidth: 1.5,
              borderColor: colors.border,
              borderRadius: radius.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.sm,
              backgroundColor: colors.surface,
              minHeight: 120,
            },
          ]}
          accessibilityLabel="Template lettre de motivation"
        />
      </View>

      {/* ── Erreur de validation ── */}
      {validationError && (
        <Text style={[typography.caption, { color: colors.danger }]}>{validationError}</Text>
      )}

      <Spacer size={spacing.sm} />

      {/* ── Bouton soumission ── */}
      <Button
        label={isLoading ? 'Enregistrement…' : submitLabel}
        onPress={() => {
          void handleSubmit();
        }}
        loading={isLoading}
        disabled={isLoading}
      />
    </View>
  );
}
