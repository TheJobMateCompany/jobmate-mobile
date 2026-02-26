/**
 * AddJobScreen — Ajout d'une offre manuelle
 *
 * Flux en 2 étapes :
 *   1. Formulaire (URL ou champs manuels) → addJobByUrl / addJobManually
 *   2. Confirmation → approveJob → navigate kanban/[id]
 *
 * Après approbation, le service AI Coach analyse automatiquement l'offre.
 */

import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAddManualJob } from '@/hooks/useAddManualJob';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { ManualJobInput } from '@/types/api';

// ─── Constants ───────────────────────────────────────────────────────────────

const CONTRACT_TYPES = ['CDI', 'CDD', 'Alternance', 'Stage', 'Freelance', 'Intérim', 'VIE'];

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'url' | 'manual';
type Step = 'form' | 'review';

const EMPTY_FORM: ManualJobInput = {
  companyName: '',
  location: '',
  profileWanted: '',
  duration: '',
  startDate: null,
  whyUs: '',
};

/** Formate une Date en DD/MM/YYYY pour l'affichage */
function formateDateFR(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Convertit une Date en YYYY-MM-DD pour le backend */
function toISODate(d: Date): string {
  return d.toISOString().split('T')[0]!;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function AddJobScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { addByUrl, addManually, approve, isAdding, isApproving, error, clearError } =
    useAddManualJob();

  const [mode, setMode] = useState<Mode>('url');
  const [step, setStep] = useState<Step>('form');
  const [url, setUrl] = useState('');
  const [form, setForm] = useState<ManualJobInput>(EMPTY_FORM);
  const [jobFeedId, setJobFeedId] = useState<string | null>(null);
  const [addedLabel, setAddedLabel] = useState('');

  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());

  // Contract type selector
  const [contractType, setContractType] = useState('');
  const [customDuration, setCustomDuration] = useState('');

  // Location autocomplete
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const locationDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleModeChange = (next: Mode) => {
    clearError();
    setMode(next);
  };

  const handleLocationQuery = useCallback((q: string) => {
    setLocationQuery(q);
    if (locationDebounce.current) clearTimeout(locationDebounce.current);
    if (q.trim().length < 2) {
      setLocationSuggestions([]);
      return;
    }
    locationDebounce.current = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1&accept-language=fr`,
          { headers: { 'User-Agent': 'JobMate/1.0' } },
        );
        const data = (await resp.json()) as Array<{
          display_name: string;
          address?: { city?: string; town?: string; village?: string; country?: string };
        }>;
        const labels = data.map((r) => {
          const addr = r.address;
          const city = addr?.city ?? addr?.town ?? addr?.village ?? r.display_name;
          const country = addr?.country ?? '';
          return country ? `${city}, ${country}` : city;
        });
        setLocationSuggestions(labels);
      } catch {
        setLocationSuggestions([]);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 400);
  }, []);

  const selectLocation = (label: string) => {
    setForm((f) => ({ ...f, location: label }));
    setLocationQuery('');
    setLocationSuggestions([]);
  };

  const clearLocation = () => {
    setForm((f) => ({ ...f, location: '' }));
    setLocationQuery('');
    setLocationSuggestions([]);
  };

  const handleSubmit = useCallback(async () => {
    clearError();

    if (mode === 'url') {
      const trimmed = url.trim();
      if (!trimmed) {
        Alert.alert('Champ requis', "Veuillez coller l'URL de l'offre.");
        return;
      }
      if (!trimmed.startsWith('http')) {
        Alert.alert('URL invalide', "L'URL doit commencer par http:// ou https://");
        return;
      }
      const result = await addByUrl(trimmed);
      if (result) {
        setJobFeedId(result.jobFeedId);
        setAddedLabel(trimmed);
        setStep('review');
      }
    } else {
      if (!form.companyName.trim()) {
        Alert.alert('Champ requis', "Le nom de l'entreprise est obligatoire.");
        return;
      }
      const effectiveDuration = contractType === 'Autre' ? customDuration.trim() : contractType;
      const result = await addManually({
        ...form,
        companyName: form.companyName.trim(),
        duration: effectiveDuration || null,
      });
      if (result) {
        setJobFeedId(result.jobFeedId);
        setAddedLabel(form.companyName.trim());
        setStep('review');
      }
    }
  }, [mode, url, form, addByUrl, addManually, clearError]);

  const handleApprove = useCallback(async () => {
    if (!jobFeedId) return;
    const app = await approve(jobFeedId);
    if (app) {
      // Remplacer l'écran add-job par le détail de la candidature créée
      router.replace(`/kanban/${app.id}`);
    }
  }, [jobFeedId, approve]);

  const handleCancel = () => {
    router.back();
  };

  // ─── Style helpers ────────────────────────────────────────────────────────

  const modeTabStyle = (active: boolean) => ({
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center' as const,
    borderRadius: radius.sm,
    backgroundColor: active ? colors.primary : 'transparent',
  });

  const modeTabTextStyle = (active: boolean) => ({
    ...typography.label,
    color: active ? '#FFFFFF' : colors.textSecondary,
    fontWeight: active ? ('600' as const) : ('400' as const),
  });

  // ─── Render : formulaire ──────────────────────────────────────────────────

  const renderForm = () => (
    <>
      {/* Toggle URL / Manuel */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          padding: 4,
          marginBottom: spacing.lg,
        }}
      >
        <TouchableOpacity
          style={modeTabStyle(mode === 'url')}
          onPress={() => handleModeChange('url')}
        >
          <Text style={modeTabTextStyle(mode === 'url')}>Via URL</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={modeTabStyle(mode === 'manual')}
          onPress={() => handleModeChange('manual')}
        >
          <Text style={modeTabTextStyle(mode === 'manual')}>Manuellement</Text>
        </TouchableOpacity>
      </View>

      {/* Champs */}
      {mode === 'url' ? (
        <>
          <Text
            style={[
              typography.bodySmall,
              { color: colors.textSecondary, marginBottom: spacing.sm },
            ]}
          >
            Collez l'URL de l'offre d'emploi. Nous allons récupérer automatiquement les
            informations.
          </Text>
          <Input
            label="URL de l'offre"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
          />
        </>
      ) : (
        <>
          <Text
            style={[
              typography.bodySmall,
              { color: colors.textSecondary, marginBottom: spacing.sm },
            ]}
          >
            Renseignez les informations de l'offre à la main.
          </Text>

          <Input
            label="Entreprise *"
            value={form.companyName}
            onChangeText={(v) => setForm((f) => ({ ...f, companyName: v }))}
            returnKeyType="next"
            containerStyle={{ marginBottom: spacing.md }}
          />

          {/* ── Lieu avec autocomplète Nominatim ── */}
          <Text
            style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.xs }]}
          >
            Lieu
          </Text>

          {/* Chip si une ville est sélectionnée */}
          {form.location ? (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.xs,
                marginBottom: spacing.md,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.primary + '22',
                  borderRadius: radius.full,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderWidth: 1,
                  borderColor: colors.primary + '66',
                  maxWidth: '90%',
                }}
              >
                <Text
                  style={[typography.label, { color: colors.primary, flexShrink: 1 }]}
                  numberOfLines={1}
                >
                  {form.location}
                </Text>
                <TouchableOpacity
                  onPress={clearLocation}
                  hitSlop={8}
                  style={{ marginLeft: spacing.xs }}
                >
                  <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ marginBottom: spacing.md }}>
              {/* Champ de saisie */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                }}
              >
                <TextInput
                  value={locationQuery}
                  onChangeText={handleLocationQuery}
                  placeholder="ex : Paris, Lyon, Remote…"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    typography.bodyMedium,
                    { color: colors.textPrimary, flex: 1, paddingVertical: spacing.sm + 2 },
                  ]}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                {isSearchingLocation && (
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                    style={{ marginLeft: spacing.xs }}
                  />
                )}
              </View>

              {/* Suggestions dropdown */}
              {locationSuggestions.length > 0 && (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    marginTop: 2,
                    overflow: 'hidden',
                  }}
                >
                  {locationSuggestions.map((s, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => selectLocation(s)}
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        borderBottomWidth: i < locationSuggestions.length - 1 ? 1 : 0,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <Text style={[typography.bodySmall, { color: colors.textPrimary }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ── Type de contrat (chips) ── */}
          <Text
            style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.xs }]}
          >
            Type de contrat
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.xs,
              marginBottom: spacing.xs,
            }}
          >
            {CONTRACT_TYPES.map((ct) => {
              const isActive = contractType === ct;
              return (
                <TouchableOpacity
                  key={ct}
                  onPress={() => {
                    setContractType(isActive ? '' : ct);
                    setCustomDuration('');
                  }}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: radius.full,
                    backgroundColor: isActive ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: isActive ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    style={[typography.label, { color: isActive ? '#fff' : colors.textPrimary }]}
                  >
                    {ct}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {/* Chip "Autre" */}
            <TouchableOpacity
              onPress={() => {
                setContractType(contractType === 'Autre' ? '' : 'Autre');
                setCustomDuration('');
              }}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: radius.full,
                backgroundColor: contractType === 'Autre' ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: contractType === 'Autre' ? colors.primary : colors.border,
              }}
            >
              <Text
                style={[
                  typography.label,
                  { color: contractType === 'Autre' ? '#fff' : colors.textPrimary },
                ]}
              >
                Autre
              </Text>
            </TouchableOpacity>
          </View>

          {/* Champ libre si "Autre" */}
          {contractType === 'Autre' && (
            <Input
              label="Précisez le type de contrat…"
              value={customDuration}
              onChangeText={setCustomDuration}
              returnKeyType="next"
              containerStyle={{ marginBottom: spacing.md }}
            />
          )}

          {/* Espace si aucun chip actif */}
          {contractType !== 'Autre' && <View style={{ marginBottom: spacing.md }} />}

          {/* Date de début — DatePicker */}
          <Text
            style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.xs }]}
          >
            Date de début
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm + 2,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.md,
            }}
          >
            <Text
              style={[
                typography.bodyMedium,
                {
                  color: form.startDate ? colors.textPrimary : colors.textSecondary,
                },
              ]}
            >
              {form.startDate ? formateDateFR(new Date(form.startDate)) : 'JJ/MM/AAAA'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 16 }}>📅</Text>
          </TouchableOpacity>

          {/* Android : picker inline */}
          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(_e, d) => {
                setShowDatePicker(false);
                if (d) {
                  setPickerDate(d);
                  setForm((f) => ({ ...f, startDate: toISODate(d) }));
                }
              }}
            />
          )}

          {/* iOS : picker dans une Modal */}
          {Platform.OS === 'ios' && (
            <Modal
              visible={showDatePicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View
                style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
              >
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderTopLeftRadius: radius.xl,
                    borderTopRightRadius: radius.xl,
                    padding: spacing.md,
                    paddingBottom: spacing.xxl,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: spacing.sm,
                    }}
                  >
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={[typography.label, { color: colors.textSecondary }]}>
                        Annuler
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setShowDatePicker(false);
                        setForm((f) => ({ ...f, startDate: toISODate(pickerDate) }));
                      }}
                    >
                      <Text style={[typography.label, { color: colors.primary }]}>Confirmer</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display="spinner"
                    minimumDate={new Date()}
                    onChange={(_e, d) => d && setPickerDate(d)}
                    locale="fr-FR"
                  />
                </View>
              </View>
            </Modal>
          )}

          {/* Poste / Description — multiline */}
          <Text
            style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.xs }]}
          >
            Poste / Description
          </Text>
          <TextInput
            value={form.profileWanted ?? ''}
            onChangeText={(v) => setForm((f) => ({ ...f, profileWanted: v }))}
            placeholder="Description du poste, compétences recherchées…"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radius.md,
              padding: spacing.md,
              color: colors.textPrimary,
              ...typography.bodyMedium,
              minHeight: 100,
              marginBottom: spacing.md,
            }}
          />

          {/* Pourquoi cette entreprise — multiline */}
          <Text
            style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.xs }]}
          >
            Pourquoi cette entreprise ? (optionnel)
          </Text>
          <TextInput
            value={form.whyUs ?? ''}
            onChangeText={(v) => setForm((f) => ({ ...f, whyUs: v }))}
            placeholder="Ce qui m'attire dans cette opportunité…"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radius.md,
              padding: spacing.md,
              color: colors.textPrimary,
              ...typography.bodyMedium,
              minHeight: 80,
              marginBottom: spacing.md,
            }}
          />
        </>
      )}

      {/* Erreur */}
      {error && (
        <Text
          style={[
            typography.bodySmall,
            { color: colors.danger, marginBottom: spacing.sm, textAlign: 'center' },
          ]}
        >
          {error}
        </Text>
      )}

      {/* Bouton soumettre */}
      <Button
        label={isAdding ? 'Récupération en cours…' : 'Continuer'}
        onPress={() => void handleSubmit()}
        loading={isAdding}
        disabled={isAdding}
        style={{ marginTop: spacing.sm }}
      />
    </>
  );

  // ─── Render : confirmation ────────────────────────────────────────────────

  const renderReview = () => (
    <View style={{ alignItems: 'center' }}>
      {/* Icône succès */}
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.success,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <Text style={{ fontSize: 32 }}>✓</Text>
      </View>

      <Text
        style={[
          typography.headingMedium,
          { color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm },
        ]}
      >
        Offre récupérée !
      </Text>

      <Text
        style={[
          typography.bodyMedium,
          { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xs },
        ]}
      >
        {mode === 'url' ? `Source : ${addedLabel}` : `Entreprise : ${addedLabel}`}
      </Text>

      <Text
        style={[
          typography.bodySmall,
          {
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: spacing.xl,
            lineHeight: 20,
          },
        ]}
      >
        En approuvant cette offre, elle sera ajoutée à votre board Kanban et notre IA l'analysera
        automatiquement pour vous donner un score de compatibilité et des conseils personnalisés.
      </Text>

      {/* Erreur approve */}
      {error && (
        <Text
          style={[
            typography.bodySmall,
            { color: colors.danger, marginBottom: spacing.sm, textAlign: 'center' },
          ]}
        >
          {error}
        </Text>
      )}

      <Button
        label="Créer ma candidature"
        onPress={() => void handleApprove()}
        loading={isApproving}
        disabled={isApproving}
        style={{ width: '100%', marginBottom: spacing.md }}
      />

      <Button
        label="Ne pas approuver"
        variant="ghost"
        onPress={handleCancel}
        disabled={isApproving}
        style={{ width: '100%' }}
      />
    </View>
  );

  // ─── Render principal ─────────────────────────────────────────────────────

  return (
    <>
      <Stack.Screen
        options={{
          title: step === 'form' ? 'Ajouter une offre' : 'Confirmer',
          headerShown: true,
          headerBackTitle: '',
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: spacing.xxl * 2,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'form' ? renderForm() : renderReview()}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
