/**
 * Kanban [id] — Phase 5.3
 *
 * Détail d'une candidature :
 *   - En-tête : titre offre, entreprise, StatusBadge
 *   - Analyse IA : ScoreRing + pros/cons chips (si aiAnalysis disponible)
 *   - Historique transitions (timeline)
 *   - Notes utilisateur (TextInput multiline, sauvegarde au blur)
 *   - Rating étoiles (interactif)
 *   - Rappel relance : DateTimePicker (Platform-aware)
 *   - Bouton « Déplacer » → Modal de sélection de statut
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApplications } from '@/hooks/useApplications';
import { useJobFeed } from '@/hooks/useJobFeed';
import { useTheme } from '@/hooks/useTheme';
import { scheduleRelanceReminder, cancelRelanceReminder } from '@/hooks/useNotifications';
import { StatusBadge } from '@/components/kanban/StatusBadge';
import { RatingStars } from '@/components/kanban/RatingStars';
import { ScoreRing } from '@/components/feed/ScoreRing';
import { Button } from '@/components/ui/Button';
import type { ApplicationStatus, StatusTransition } from '@/types/api';

// ─── Constantes statuts ───────────────────────────────────────────────────────

const ALL_STATUSES: ApplicationStatus[] = [
  'TO_APPLY',
  'APPLIED',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED',
];

const STATUS_LABEL_FR: Record<ApplicationStatus, string> = {
  TO_APPLY: 'À postuler',
  APPLIED: 'Postulé',
  INTERVIEW: 'Entretien',
  OFFER: 'Offre reçue',
  HIRED: 'Embauché 🎉',
  REJECTED: 'Rejeté',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Composant timeline ───────────────────────────────────────────────────────

function TimelineItem({ transition, isLast }: { transition: StatusTransition; isLast: boolean }) {
  const { colors, spacing, typography, radius } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {/* Trait vertical + point */}
      <View style={{ alignItems: 'center', width: 20 }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.primary,
            marginTop: 4,
          }}
        />
        {!isLast && (
          <View style={{ width: 2, flex: 1, backgroundColor: colors.border, marginTop: 2 }} />
        )}
      </View>
      {/* Contenu */}
      <View style={{ flex: 1, paddingBottom: spacing.md }}>
        <Text style={[typography.bodySmall, { color: colors.textPrimary, fontWeight: '600' }]}>
          {STATUS_LABEL_FR[transition.from]} → {STATUS_LABEL_FR[transition.to]}
        </Text>
        <Text style={[typography.caption, { color: colors.textDisabled }]}>
          {formatDate(transition.at)}
        </Text>
      </View>
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function KanbanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius, typography } = useTheme();

  const {
    applications,
    isLoading,
    submittingIds,
    fetchApplications,
    moveCard,
    addNote,
    rateApplication,
    setRelanceReminder,
    deleteApplication,
  } = useApplications();

  const { jobs, fetchFeed } = useJobFeed();

  // Note locale (édition avant blur)
  const [noteText, setNoteText] = useState('');
  // Modal "Déplacer"
  const [showMoveModal, setShowMoveModal] = useState(false);
  // DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());

  // Guard pour éviter les setNote en boucle
  const noteInitialized = useRef(false);

  // Charge les données si deep-link
  useEffect(() => {
    if (applications.length === 0) void fetchApplications();
    if (jobs.length === 0) void fetchFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const application = applications.find((a) => a.id === id);

  // Initialise la note locale depuis les données serveur (une seule fois)
  useEffect(() => {
    if (application && !noteInitialized.current) {
      setNoteText(application.userNotes ?? '');
      if (application.relanceReminderAt) {
        setPickerDate(new Date(application.relanceReminderAt));
      }
      noteInitialized.current = true;
    }
  }, [application]);

  // Résolution job depuis jobsMap
  const jobMeta = useMemo(() => {
    const empty = {
      title: 'Candidature manuelle',
      company: null as string | null,
      location: null as string | null,
      description: null as string | null,
      salaryMin: null as number | null,
      salaryMax: null as number | null,
      sourceUrl: null as string | null,
      startDate: null as string | null,
      duration: null as string | null,
      whyUs: null as string | null,
      companyDescription: null as string | null,
    };
    if (!application?.jobFeedId) return empty;
    const job = jobs.find((j) => j.id === application.jobFeedId);
    if (!job) return { ...empty, title: 'Offre inconnue' };
    const raw = job.rawData;
    return {
      title:
        (typeof raw.title === 'string' && raw.title) ||
        (typeof raw.poste === 'string' && raw.poste) ||
        'Offre sans titre',
      company:
        (typeof raw.company_name === 'string' && raw.company_name) ||
        (typeof raw.company === 'string' && raw.company) ||
        (typeof raw.entreprise === 'string' && raw.entreprise) ||
        null,
      location: typeof raw.location === 'string' ? raw.location : null,
      description:
        (typeof raw.description === 'string' && raw.description) ||
        (typeof raw.profile_wanted === 'string' && raw.profile_wanted) ||
        null,
      salaryMin: typeof raw.salary_min === 'number' ? raw.salary_min : null,
      salaryMax: typeof raw.salary_max === 'number' ? raw.salary_max : null,
      sourceUrl: (typeof raw.source_url === 'string' && raw.source_url) || job.sourceUrl || null,
      startDate: typeof raw.start_date === 'string' ? raw.start_date : null,
      duration: typeof raw.duration === 'string' ? raw.duration : null,
      whyUs: typeof raw.why_us === 'string' ? raw.why_us : null,
      companyDescription:
        typeof raw.company_description === 'string' ? raw.company_description : null,
    };
  }, [application, jobs]);

  // Vrai si au moins un champ de détail est disponible (évite la carte vide pendant le chargement)
  const hasJobDetails = !!(
    jobMeta.company ||
    jobMeta.location ||
    jobMeta.description ||
    jobMeta.salaryMin !== null ||
    jobMeta.salaryMax !== null ||
    jobMeta.sourceUrl ||
    jobMeta.startDate ||
    jobMeta.duration ||
    jobMeta.whyUs ||
    jobMeta.companyDescription
  );

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleNoteBlur = useCallback(async () => {
    if (!application) return;
    if (noteText === (application.userNotes ?? '')) return;
    await addNote(application.id, noteText);
  }, [application, noteText, addNote]);

  const handleRating = useCallback(
    async (rating: number) => {
      if (!application) return;
      await rateApplication(application.id, rating);
    },
    [application, rateApplication],
  );

  const handleMove = useCallback(
    async (newStatus: ApplicationStatus) => {
      if (!application) return;
      setShowMoveModal(false);
      await moveCard(application.id, newStatus);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [application, moveCard],
  );

  const handleDelete = useCallback(() => {
    if (!application) return;
    Alert.alert(
      'Supprimer la candidature',
      'Cette candidature sera définitivement supprimée. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteApplication(application.id);
            if (ok) router.back();
          },
        },
      ],
    );
  }, [application, deleteApplication]);

  const handleDateChange = useCallback(
    async (_event: unknown, selectedDate?: Date) => {
      if (Platform.OS === 'android') setShowDatePicker(false);
      if (!selectedDate || !application) return;
      setPickerDate(selectedDate);
      await setRelanceReminder(application.id, selectedDate);
      // Programmer un rappel local au moment choisi
      await scheduleRelanceReminder(
        application.id,
        selectedDate,
        jobMeta.title,
        jobMeta.company ?? undefined,
      );
    },
    [application, setRelanceReminder, jobMeta],
  );

  const handleConfirmIOSDate = useCallback(async () => {
    setShowDatePicker(false);
    if (!application) return;
    await setRelanceReminder(application.id, pickerDate);
    // Programmer un rappel local au moment choisi
    await scheduleRelanceReminder(
      application.id,
      pickerDate,
      jobMeta.title,
      jobMeta.company ?? undefined,
    );
  }, [application, pickerDate, setRelanceReminder, jobMeta]);

  // ─── États ──────────────────────────────────────────────────────────────────

  if (isLoading && !application) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <Stack.Screen options={{ title: 'Candidature', headerShown: true }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!application) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
          padding: spacing.xl,
        }}
      >
        <Stack.Screen options={{ title: 'Introuvable', headerShown: true }} />
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center' }]}>
          Cette candidature n'est plus disponible.
        </Text>
        <Button
          label="Retour"
          onPress={() => router.back()}
          variant="ghost"
          style={{ marginTop: spacing.md }}
        />
      </View>
    );
  }

  const isSubmitting = submittingIds.has(application.id);
  const ai = application.aiAnalysis;

  return (
    <>
      <Stack.Screen options={{ title: jobMeta.title, headerShown: true }} />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── En-tête ──────────────────────────────────────────────────────── */}
        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.headingLarge, { color: colors.textPrimary }]} numberOfLines={2}>
            {jobMeta.title}
          </Text>
          {jobMeta.company && (
            <Text style={[typography.bodyLarge, { color: colors.textSecondary }]}>
              {jobMeta.company}
            </Text>
          )}
          <StatusBadge status={application.currentStatus} />
          <Text style={[typography.caption, { color: colors.textDisabled }]}>
            Créée le {formatDate(application.createdAt)}
          </Text>
        </View>

        {/* ── Détails de l'offre ────────────────────────────────────────────── */}
        {application.jobFeedId && hasJobDetails && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: colors.border,
              gap: spacing.md,
            }}
          >
            <Text style={[typography.headingMedium, { color: colors.textPrimary }]}>
              Détails de l'offre
            </Text>

            {/* Entreprise */}
            {jobMeta.company && (
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 15 }}>🏢</Text>
                <Text style={[typography.bodyMedium, { color: colors.textSecondary, flex: 1 }]}>
                  {jobMeta.company}
                </Text>
              </View>
            )}

            {/* Localisation */}
            {jobMeta.location && (
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 15 }}>📍</Text>
                <Text style={[typography.bodyMedium, { color: colors.textSecondary, flex: 1 }]}>
                  {jobMeta.location}
                </Text>
              </View>
            )}

            {/* Salaire */}
            {(jobMeta.salaryMin !== null || jobMeta.salaryMax !== null) && (
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 15 }}>💶</Text>
                <Text style={[typography.bodyMedium, { color: colors.textSecondary, flex: 1 }]}>
                  {jobMeta.salaryMin !== null && jobMeta.salaryMax !== null
                    ? `${Math.round(jobMeta.salaryMin).toLocaleString('fr-FR')} – ${Math.round(jobMeta.salaryMax).toLocaleString('fr-FR')} €/an`
                    : jobMeta.salaryMin !== null
                      ? `Dès ${Math.round(jobMeta.salaryMin).toLocaleString('fr-FR')} €/an`
                      : `Jusqu'à ${Math.round(jobMeta.salaryMax!).toLocaleString('fr-FR')} €/an`}
                </Text>
              </View>
            )}

            {/* Date de début (offres manuelles) */}
            {jobMeta.startDate && (
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 15 }}>📅</Text>
                <Text style={[typography.bodyMedium, { color: colors.textSecondary, flex: 1 }]}>
                  Début : {jobMeta.startDate}
                </Text>
              </View>
            )}

            {/* Durée (offres manuelles) */}
            {jobMeta.duration && (
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 15 }}>⏱️</Text>
                <Text style={[typography.bodyMedium, { color: colors.textSecondary, flex: 1 }]}>
                  Durée : {jobMeta.duration}
                </Text>
              </View>
            )}

            {/* Description de l'entreprise (offres manuelles) */}
            {jobMeta.companyDescription && (
              <View style={{ gap: 4 }}>
                <Text style={[typography.label, { color: colors.textPrimary }]}>
                  À propos de l'entreprise
                </Text>
                <Text
                  style={[typography.bodySmall, { color: colors.textSecondary, lineHeight: 20 }]}
                >
                  {jobMeta.companyDescription}
                </Text>
              </View>
            )}

            {/* Pourquoi nous rejoindre (offres manuelles) */}
            {jobMeta.whyUs && (
              <View style={{ gap: 4 }}>
                <Text style={[typography.label, { color: colors.textPrimary }]}>
                  Pourquoi nous rejoindre ?
                </Text>
                <Text
                  style={[typography.bodySmall, { color: colors.textSecondary, lineHeight: 20 }]}
                >
                  {jobMeta.whyUs}
                </Text>
              </View>
            )}

            {/* Description du poste */}
            {jobMeta.description && (
              <View style={{ gap: 4 }}>
                <Text style={[typography.label, { color: colors.textPrimary }]}>
                  Description du poste
                </Text>
                <Text
                  style={[typography.bodySmall, { color: colors.textSecondary, lineHeight: 20 }]}
                >
                  {jobMeta.description}
                </Text>
              </View>
            )}

            {/* Lien vers l'offre */}
            {jobMeta.sourceUrl && (
              <TouchableOpacity
                onPress={() => void Linking.openURL(jobMeta.sourceUrl!)}
                accessibilityRole="link"
                accessibilityLabel="Voir l'offre originale"
              >
                <Text
                  style={[
                    typography.bodySmall,
                    { color: colors.primary, textDecorationLine: 'underline' },
                  ]}
                >
                  🔗 Voir l'offre originale
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Bouton Déplacer ───────────────────────────────────────────────── */}
        <Button
          label={isSubmitting ? 'Déplacement…' : '↔ Déplacer le statut'}
          onPress={() => setShowMoveModal(true)}
          variant="secondary"
          loading={isSubmitting}
          disabled={isSubmitting}
        />

        {/* ── Analyse IA ───────────────────────────────────────────────────── */}
        {ai ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: colors.border,
              gap: spacing.md,
            }}
          >
            <Text style={[typography.headingMedium, { color: colors.textPrimary }]}>
              Analyse IA
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
              {ai.score !== undefined && <ScoreRing score={ai.score} size={72} strokeWidth={7} />}
              <View style={{ flex: 1, gap: spacing.sm }}>
                {ai.pros && ai.pros.length > 0 && (
                  <View style={{ gap: 4 }}>
                    <Text style={[typography.label, { color: colors.success }]}>
                      ✓ Points forts
                    </Text>
                    {ai.pros.map((p, i) => (
                      <Text key={i} style={[typography.bodySmall, { color: colors.textSecondary }]}>
                        • {p}
                      </Text>
                    ))}
                  </View>
                )}
                {ai.cons && ai.cons.length > 0 && (
                  <View style={{ gap: 4 }}>
                    <Text style={[typography.label, { color: colors.danger }]}>
                      ✗ Points faibles
                    </Text>
                    {ai.cons.map((c, i) => (
                      <Text key={i} style={[typography.bodySmall, { color: colors.textSecondary }]}>
                        • {c}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
            {ai.suggested_cv_content && (
              <View style={{ gap: 4 }}>
                <Text style={[typography.label, { color: colors.primary }]}>💡 Suggestion CV</Text>
                <Text
                  style={[typography.bodySmall, { color: colors.textSecondary, lineHeight: 20 }]}
                >
                  {ai.suggested_cv_content}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View
            style={{
              backgroundColor: colors.surfaceVariant,
              borderRadius: radius.md,
              padding: spacing.md,
              alignItems: 'center',
            }}
          >
            <Text
              style={[typography.bodySmall, { color: colors.textDisabled, fontStyle: 'italic' }]}
            >
              ⏳ L'analyse IA sera disponible après traitement.
            </Text>
          </View>
        )}

        {/* ── Historique transitions ────────────────────────────────────────── */}
        {application.historyLog.length > 0 && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: colors.border,
              gap: spacing.sm,
            }}
          >
            <Text style={[typography.headingMedium, { color: colors.textPrimary }]}>
              Historique
            </Text>
            {application.historyLog.map((t, i) => (
              <TimelineItem
                key={i}
                transition={t}
                isLast={i === application.historyLog.length - 1}
              />
            ))}
          </View>
        )}

        {/* ── Notes ────────────────────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            padding: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
            gap: spacing.sm,
          }}
        >
          <Text style={[typography.headingMedium, { color: colors.textPrimary }]}>Notes</Text>
          <TextInput
            value={noteText}
            onChangeText={setNoteText}
            onBlur={() => void handleNoteBlur()}
            placeholder="Ajoutez vos notes, contacts, impressions…"
            placeholderTextColor={colors.textDisabled}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={[
              typography.bodyMedium,
              {
                color: colors.textPrimary,
                backgroundColor: colors.surfaceVariant,
                borderRadius: radius.sm,
                padding: spacing.sm,
                minHeight: 100,
                lineHeight: 22,
              },
            ]}
          />
        </View>

        {/* ── Rating ───────────────────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            padding: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
            gap: spacing.sm,
          }}
        >
          <Text style={[typography.headingMedium, { color: colors.textPrimary }]}>
            Mon évaluation
          </Text>
          <RatingStars
            value={application.userRating}
            onChange={(r) => void handleRating(r)}
            size={28}
          />
        </View>

        {/* ── Rappel relance ────────────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            padding: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
            gap: spacing.sm,
          }}
        >
          <Text style={[typography.headingMedium, { color: colors.textPrimary }]}>
            Rappel de relance
          </Text>

          {application.relanceReminderAt && (
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              Prévu le : {formatDate(application.relanceReminderAt)}
            </Text>
          )}

          <Button
            label={application.relanceReminderAt ? 'Modifier la date' : 'Définir un rappel'}
            onPress={() => setShowDatePicker(true)}
            variant="ghost"
          />

          {application.relanceReminderAt && (
            <Button
              label="Effacer le rappel"
              onPress={async () => {
                await cancelRelanceReminder(application.id);
              }}
              variant="ghost"
            />
          )}

          {/* Android : DateTimePicker inline */}
          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={pickerDate}
              mode="datetime"
              display="default"
              minimumDate={new Date()}
              onChange={(e, d) => void handleDateChange(e, d)}
            />
          )}

          {/* iOS : DateTimePicker dans une Modal */}
          {Platform.OS === 'ios' && (
            <Modal
              visible={showDatePicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View
                style={{
                  flex: 1,
                  justifyContent: 'flex-end',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                }}
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
                    <TouchableOpacity onPress={() => void handleConfirmIOSDate()}>
                      <Text style={[typography.label, { color: colors.primary }]}>Confirmer</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={pickerDate}
                    mode="datetime"
                    display="spinner"
                    minimumDate={new Date()}
                    onChange={(_e, d) => d && setPickerDate(d)}
                    locale="fr-FR"
                  />
                </View>
              </View>
            </Modal>
          )}
        </View>
      </ScrollView>

      {/* ── Bouton supprimer (zone danger, hors scroll) ─────────────────────── */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xl,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Button label="Supprimer la candidature" onPress={handleDelete} variant="danger" />
      </View>

      {/* ── Modal "Déplacer" ──────────────────────────────────────────────── */}
      <Modal
        visible={showMoveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMoveModal(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
          activeOpacity={1}
          onPress={() => setShowMoveModal(false)}
        />
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: spacing.lg,
            paddingBottom: spacing.xxl,
            gap: spacing.sm,
          }}
        >
          <Text
            style={[
              typography.headingMedium,
              { color: colors.textPrimary, marginBottom: spacing.sm },
            ]}
          >
            Déplacer vers…
          </Text>
          {ALL_STATUSES.filter((s) => s !== application.currentStatus).map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => void handleMove(status)}
              accessibilityRole="button"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderRadius: radius.md,
                backgroundColor: colors.surfaceVariant,
              }}
            >
              <StatusBadge status={status} />
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1 }]}>
                {STATUS_LABEL_FR[status]}
              </Text>
              <Text style={{ color: colors.textDisabled }}>›</Text>
            </TouchableOpacity>
          ))}
          <Button
            label="Annuler"
            onPress={() => setShowMoveModal(false)}
            variant="ghost"
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </Modal>
    </>
  );
}
