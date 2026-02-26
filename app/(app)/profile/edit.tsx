/**
 * Profile edit — Phase 3.6
 *
 * Formulaire d'édition partielle du profil :
 * - Champ « Nom complet » (Input)
 * - Sélecteur de statut (boutons radio visuels parmi ProfileStatus)
 * - Éditeur de compétences (SkillChip supprimable + champ ajout)
 * - Bouton « Sauvegarder » → updateProfile() → router.back()
 *
 * Sauvegarde uniquement les champs modifiés.
 * Gestion d'erreur inline + état désactivé pendant la mutation.
 */

import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { router, Stack } from 'expo-router';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spacer } from '@/components/ui/Spacer';
import { Divider } from '@/components/ui/Divider';
import { SkillChip } from '@/components/profile/SkillChip';
import type { ProfileStatus } from '@/types/api';

// ─── Statuts disponibles ────────────────────────────────────────────────────

const STATUSES: { value: ProfileStatus; label: string }[] = [
  { value: 'STUDENT', label: 'Étudiant' },
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MID', label: 'Confirmé' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'OPEN_TO_WORK', label: 'En recherche' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function resolveSkillLabel(raw: unknown): string | null {
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (typeof obj['name'] === 'string' && obj['name'].trim()) return obj['name'].trim();
  }
  return null;
}

// ─── Écran ───────────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { profile, isUpdating, updateProfile } = useProfile();

  // ── État du formulaire initialisé depuis le profil ─────────────────────
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [status, setStatus] = useState<ProfileStatus | null>(profile?.status ?? null);
  const initialSkills = (profile?.skills ?? [])
    .map(resolveSkillLabel)
    .filter((s): s is string => s !== null);
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [newSkill, setNewSkill] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);

  // ── Suppression d'une compétence ────────────────────────────────────────
  const handleRemoveSkill = useCallback((label: string) => {
    setSkills((prev) => prev.filter((s) => s !== label));
  }, []);

  // ── Ajout d'une compétence ──────────────────────────────────────────────
  const handleAddSkill = useCallback(() => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) {
      setNewSkill('');
      return;
    }
    setSkills((prev) => [...prev, trimmed]);
    setNewSkill('');
  }, [newSkill, skills]);

  // ── Sauvegarde ──────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setFieldError(null);

    if (!fullName.trim()) {
      setFieldError('Le nom complet est requis.');
      return;
    }

    try {
      await updateProfile({
        fullName: fullName.trim(),
        ...(status ? { status } : {}),
        // On renvoie les skills comme tableau de strings (compatible JSON backend)
        skills: skills as unknown[],
      });
      router.replace('/(app)/profile');
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications.');
    }
  }, [fullName, status, skills, updateProfile]);

  return (
    <ScreenWrapper padded={false}>
      {/* Header de navigation avec bouton Sauvegarder */}
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Modifier le profil',
          headerBackTitle: 'Retour',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                void handleSave();
              }}
              disabled={isUpdating}
              accessibilityRole="button"
              accessibilityLabel="Sauvegarder les modifications"
              style={{ opacity: isUpdating ? 0.4 : 1, paddingHorizontal: spacing.sm }}
            >
              <Text style={[typography.label, { color: colors.primary, fontWeight: '700' }]}>
                {isUpdating ? 'Envoi…' : 'Sauvegarder'}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Nom complet ── */}
        <Input
          label="Nom complet"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          error={fieldError ?? undefined}
          returnKeyType="done"
        />

        <Spacer size={spacing.lg} />
        <Divider />
        <Spacer size={spacing.lg} />

        {/* ── Statut ── */}
        <Text style={[typography.label, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
          Statut
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {STATUSES.map(({ value, label }) => {
            const selected = status === value;
            return (
              <TouchableOpacity
                key={value}
                onPress={() => setStatus(value)}
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

        <Spacer size={spacing.lg} />
        <Divider />
        <Spacer size={spacing.lg} />

        {/* ── Compétences ── */}
        <Text style={[typography.label, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
          Compétences
        </Text>

        {/* Chips existantes */}
        {skills.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.sm,
              marginBottom: spacing.sm,
            }}
          >
            {skills.map((skill) => (
              <SkillChip key={skill} label={skill} editable onRemove={handleRemoveSkill} />
            ))}
          </View>
        )}

        {/* Ajout nouvelle compétence */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            borderWidth: 1.5,
            borderColor: colors.border,
            borderRadius: radius.sm,
            paddingHorizontal: spacing.sm,
            backgroundColor: colors.surface,
          }}
        >
          <TextInput
            value={newSkill}
            onChangeText={setNewSkill}
            placeholder="Ajouter une compétence…"
            placeholderTextColor={colors.textDisabled}
            returnKeyType="done"
            onSubmitEditing={handleAddSkill}
            style={[
              typography.bodyMedium,
              { flex: 1, color: colors.textPrimary, paddingVertical: spacing.sm },
            ]}
            accessibilityLabel="Nouvelle compétence"
          />
          <TouchableOpacity
            onPress={handleAddSkill}
            disabled={!newSkill.trim()}
            accessibilityRole="button"
            accessibilityLabel="Ajouter la compétence"
            style={{ opacity: newSkill.trim() ? 1 : 0.3 }}
          >
            <Text style={[typography.label, { color: colors.primary }]}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        <Spacer size={spacing.xl} />

        {/* ── Bouton Sauvegarder (bas de page, alternative au header) ── */}
        <Button
          label={isUpdating ? 'Sauvegarde…' : 'Sauvegarder'}
          onPress={() => {
            void handleSave();
          }}
          loading={isUpdating}
          disabled={isUpdating}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}
