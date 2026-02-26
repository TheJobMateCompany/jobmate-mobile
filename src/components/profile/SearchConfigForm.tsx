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

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
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

const CONTRACT_TYPES = ['CDI', 'CDD', 'Alternance', 'Stage', 'Freelance', 'Intérim', 'VIE'];

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

/**
 * Champ localisation avec autocomplétion Nominatim (debounce 400 ms)
 * + bouton GPS optionnel
 */
function LocationAutocompleteField({
  tags,
  onAdd,
  onRemove,
  onGpsPress,
  isLocating = false,
}: {
  tags: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  onGpsPress?: () => void;
  isLocating?: boolean;
}) {
  const { colors, spacing, radius, typography } = useTheme();
  const [draft, setDraft] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = draft.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setIsFetching(true);
      void fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&accept-language=fr`,
        { headers: { 'User-Agent': 'JobMate/1.0' } },
      )
        .then((r) => r.json())
        .then((data: Array<{ display_name: string; address: Record<string, string> }>) => {
          const places = data
            .map((item) => {
              const a = item.address;
              return (
                a.city ??
                a.town ??
                a.village ??
                a.county ??
                a.state ??
                item.display_name.split(',')[0]
              );
            })
            .filter((v, i, arr) => Boolean(v) && arr.indexOf(v) === i);
          setSuggestions(places as string[]);
        })
        .catch(() => setSuggestions([]))
        .finally(() => setIsFetching(false));
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [draft]);

  const handleSelect = (place: string) => {
    if (!tags.includes(place)) onAdd(place);
    setDraft('');
    setSuggestions([]);
  };

  return (
    <View style={{ gap: spacing.sm }}>
      {/* Tags existants */}
      {tags.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {tags.map((t) => (
            <TagChip key={t} label={t} onRemove={() => onRemove(t)} />
          ))}
        </View>
      )}

      {/* Input + dropdown */}
      <View
        style={{
          borderWidth: 1.5,
          borderColor: colors.border,
          borderRadius: radius.sm,
          backgroundColor: colors.surface,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.sm,
            gap: spacing.sm,
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Rechercher une ville…"
            placeholderTextColor={colors.textDisabled}
            returnKeyType="search"
            style={[
              typography.bodyMedium,
              { flex: 1, color: colors.textPrimary, paddingVertical: spacing.sm },
            ]}
          />
          {isFetching && <ActivityIndicator size="small" color={colors.primary} />}
          {onGpsPress && (
            <TouchableOpacity
              onPress={onGpsPress}
              disabled={isLocating}
              accessibilityRole="button"
              accessibilityLabel="Utiliser ma position"
              style={{ opacity: isLocating ? 0.4 : 1 }}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
                  📍
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => handleSelect(s)}
                accessibilityRole="button"
                style={{
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  // Contract type : chips prédéfinies + option « Autre » avec champ libre
  const initDuration = initialValues?.duration ?? '';
  const [contractType, setContractType] = useState(
    CONTRACT_TYPES.includes(initDuration) ? initDuration : initDuration ? 'Autre' : '',
  );
  const [customDuration, setCustomDuration] = useState(
    initDuration && !CONTRACT_TYPES.includes(initDuration) ? initDuration : '',
  );
  const [startDate, setStartDate] = useState(initialValues?.startDate ?? '');
  const [showDatePicker, setShowDatePicker] = useState(false);
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
      setValidationError('Le salaire minimum doit être inférieur au maximum.');
      return;
    }

    const resolvedDuration =
      contractType === 'Autre' ? customDuration.trim() || undefined : contractType || undefined;

    const input: CreateSearchConfigInput = {
      jobTitles,
      locations,
      remotePolicy,
      keywords: keywords.length > 0 ? keywords : undefined,
      redFlags: redFlags.length > 0 ? redFlags : undefined,
      salaryMin: minVal,
      salaryMax: maxVal,
      duration: resolvedDuration,
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
    contractType,
    customDuration,
    startDate,
    coverLetterTemplate,
    onSubmit,
  ]);

  // Erreur inline salaire (calculée sans state pour rester réactive)
  const salaryErrorMsg: string | null = (() => {
    const mn = salaryMin ? parseInt(salaryMin, 10) : NaN;
    const mx = salaryMax ? parseInt(salaryMax, 10) : NaN;
    if (!isNaN(mn) && !isNaN(mx) && mn >= mx)
      return 'Le minimum doit être strictement inférieur au maximum.';
    return null;
  })();

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
        <LocationAutocompleteField
          tags={locations}
          onAdd={addTag(setLocations)}
          onRemove={removeTag(setLocations)}
          onGpsPress={() => void handleAutoLocation()}
          isLocating={isLocating}
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
                  borderColor: salaryErrorMsg ? colors.danger : colors.border,
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
                  borderColor: salaryErrorMsg ? colors.danger : colors.border,
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
        {salaryErrorMsg && (
          <Text style={[typography.caption, { color: colors.danger, marginTop: 4 }]}>
            {salaryErrorMsg}
          </Text>
        )}
      </View>

      <Divider />

      {/* ── Contrat / durée ── */}
      <View>
        <SectionLabel text="Type de contrat" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {[...CONTRACT_TYPES, 'Autre'].map((type) => {
            const selected = contractType === type;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setContractType(type)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
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
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {contractType === 'Autre' && (
          <TextInput
            value={customDuration}
            onChangeText={setCustomDuration}
            placeholder="Précisez (ex : CDD 3 mois, Mission…)"
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
                marginTop: spacing.sm,
              },
            ]}
          />
        )}
      </View>

      <Divider />

      {/* ── Date de début ── */}
      <View>
        <SectionLabel text="Date de disponibilité" />

        {/* Bouton déclencheur */}
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          accessibilityRole="button"
          accessibilityLabel="Sélectionner une date de disponibilité"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1.5,
            borderColor: colors.border,
            borderRadius: radius.sm,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm,
            backgroundColor: colors.surface,
          }}
        >
          <Text
            style={[
              typography.bodyMedium,
              {
                color: startDate ? colors.textPrimary : colors.textDisabled,
                flex: 1,
              },
            ]}
          >
            {startDate
              ? new Date(startDate).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : 'Sélectionner une date…'}
          </Text>

          {/* Effacer la date */}
          {startDate ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                setStartDate('');
              }}
              accessibilityRole="button"
              accessibilityLabel="Effacer la date"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                style={[typography.caption, { color: colors.textSecondary, fontWeight: '600' }]}
              >
                ✕
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={[typography.caption, { color: colors.primary }]}>📅</Text>
          )}
        </TouchableOpacity>

        {/* Picker natif */}
        {showDatePicker && (
          <DateTimePicker
            value={startDate ? new Date(`${startDate}T12:00:00`) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            locale="fr-FR"
            onChange={(event: DateTimePickerEvent, date?: Date) => {
              if (Platform.OS === 'android') setShowDatePicker(false);
              if (event.type === 'set' && date) {
                // Format YYYY-MM-DD sans décalage fuseau
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                setStartDate(`${y}-${m}-${d}`);
              } else if (event.type === 'dismissed') {
                setShowDatePicker(false);
              }
            }}
          />
        )}

        {/* iOS : bouton Valider pour fermer le spinner inline */}
        {showDatePicker && Platform.OS === 'ios' && (
          <TouchableOpacity
            onPress={() => setShowDatePicker(false)}
            accessibilityRole="button"
            style={{
              alignSelf: 'flex-end',
              marginTop: spacing.xs,
              paddingVertical: spacing.xs,
              paddingHorizontal: spacing.sm,
              backgroundColor: colors.primary,
              borderRadius: radius.sm,
            }}
          >
            <Text style={[typography.caption, { color: '#fff', fontWeight: '700' }]}>Valider</Text>
          </TouchableOpacity>
        )}
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
