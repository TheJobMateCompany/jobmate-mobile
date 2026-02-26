/**
 * Settings — Phase 7.1
 *
 * Sections :
 *  - Apparence : thème Auto / Clair / Sombre
 *  - Langue    : FR / EN
 *  - Notifications : toggle push (permission)
 *  - Compte    : modifier profil, déconnexion, supprimer compte
 *  - À propos  : version, revoir le tutoriel
 */

import { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { changeLanguage, getCurrentLanguage } from '@/i18n';
import { ONBOARDING_KEY } from '../../(auth)/onboarding';
import type { ThemeMode } from '@/types/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: 'Auto', value: 'system' },
  { label: 'Clair', value: 'light' },
  { label: 'Sombre', value: 'dark' },
];

const LANG_OPTIONS: { label: string; value: string }[] = [
  { label: 'Français', value: 'fr' },
  { label: 'English', value: 'en' },
];

// ─── Atoms ────────────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  const { colors, typography, spacing } = useTheme();
  return (
    <Text
      style={[
        typography.caption,
        {
          color: colors.textDisabled,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginTop: spacing.lg,
          marginBottom: spacing.xs,
          paddingHorizontal: spacing.md,
        },
      ]}
    >
      {title}
    </Text>
  );
}

interface RowProps {
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
}

function Row({
  label,
  onPress,
  right,
  destructive = false,
  disabled = false,
  accessibilityHint,
}: RowProps) {
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress || disabled}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          marginHorizontal: spacing.md,
          marginBottom: 1,
          minHeight: 52,
        },
      ]}
    >
      <Text
        style={[
          typography.bodyMedium,
          {
            color: destructive
              ? colors.danger
              : disabled
                ? colors.textDisabled
                : colors.textPrimary,
          },
        ]}
      >
        {label}
      </Text>
      {right ?? null}
    </TouchableOpacity>
  );
}

interface SegmentedProps<T extends string> {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  accessibilityLabel: string;
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedProps<T>) {
  const { colors, spacing, radius, typography } = useTheme();
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radiogroup"
      style={[
        styles.segmented,
        {
          backgroundColor: colors.border,
          borderRadius: radius.md,
          marginHorizontal: spacing.md,
          marginBottom: spacing.sm,
          padding: 3,
        },
      ]}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityLabel={opt.label}
            accessibilityState={{ checked: selected }}
            style={[
              styles.segment,
              {
                borderRadius: radius.sm,
                backgroundColor: selected ? colors.surface : 'transparent',
                paddingVertical: spacing.xs,
              },
            ]}
          >
            <Text
              style={[
                typography.bodySmall,
                {
                  color: selected ? colors.primary : colors.textSecondary,
                  fontWeight: selected ? '700' : '500',
                },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { colors, spacing, typography, mode, setMode } = useTheme();
  const { logout } = useAuth();

  const [lang, setLangState] = useState(getCurrentLanguage());
  const [pushEnabled, setPushEnabled] = useState(false);
  const [checkingPerms, setCheckingPerms] = useState(false);

  // ── Notifications toggle ────────────────────────────────────────────────────

  const handlePushToggle = useCallback(async (val: boolean) => {
    if (val) {
      setCheckingPerms(true);
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        setPushEnabled(status === 'granted');
        if (status !== 'granted') {
          Alert.alert(
            'Notifications désactivées',
            Platform.OS === 'ios'
              ? 'Activez les notifications dans Réglages > JobMate > Notifications.'
              : 'Activez les notifications dans Paramètres > Applications > JobMate.',
          );
        }
      } finally {
        setCheckingPerms(false);
      }
    } else {
      setPushEnabled(false);
    }
  }, []);

  // ── Thème ───────────────────────────────────────────────────────────────────

  const handleThemeChange = useCallback(
    async (newMode: ThemeMode) => {
      await Haptics.selectionAsync();
      await setMode(newMode);
    },
    [setMode],
  );

  // ── Langue ──────────────────────────────────────────────────────────────────

  const handleLangChange = useCallback(async (newLang: string) => {
    await Haptics.selectionAsync();
    setLangState(newLang as 'fr' | 'en');
    await changeLanguage(newLang as 'fr' | 'en');
  }, []);

  // ── Tutoriel ────────────────────────────────────────────────────────────────

  const handleResetTutorial = useCallback(() => {
    Alert.alert(
      'Revoir le tutoriel',
      "Vous serez redirigé vers l'écran d'introduction au prochain démarrage.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            await AsyncStorage.removeItem(ONBOARDING_KEY);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  }, []);

  // ── Déconnexion ─────────────────────────────────────────────────────────────

  const handleLogout = useCallback(() => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter\u00a0?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
        },
      },
    ]);
  }, [logout]);

  // ── Suppression compte ──────────────────────────────────────────────────────

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Voulez-vous vraiment supprimer votre compte\u00a0?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmation finale',
              'Toutes vos données seront effacées définitivement.',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Supprimer définitivement',
                  style: 'destructive',
                  onPress: async () => {
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    // TODO: appel API deleteAccount (Phase 8)
                    await logout();
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, [logout]);

  const version = Constants.expoConfig?.version ?? '1.0.0';

  // ─── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Paramètres',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { ...(typography.headingMedium as object) },
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Apparence ──────────────────────────────────────────────────────── */}
        <SectionHeader title="Apparence" />
        <SegmentedControl
          accessibilityLabel="Sélecteur de thème"
          options={THEME_OPTIONS}
          value={mode}
          onChange={(v) => {
            void handleThemeChange(v);
          }}
        />

        {/* ── Langue ─────────────────────────────────────────────────────────── */}
        <SectionHeader title="Langue" />
        <SegmentedControl
          accessibilityLabel="Sélecteur de langue"
          options={LANG_OPTIONS}
          value={lang}
          onChange={(v) => {
            void handleLangChange(v);
          }}
        />

        {/* ── Notifications ───────────────────────────────────────────────────── */}
        <SectionHeader title="Notifications" />
        <Row
          label="Notifications push"
          accessibilityHint="Active ou désactive les notifications push"
          right={
            <Switch
              value={pushEnabled}
              onValueChange={(v) => {
                void handlePushToggle(v);
              }}
              disabled={checkingPerms}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
              accessibilityLabel="Notifications push"
              accessibilityRole="switch"
              accessibilityState={{ checked: pushEnabled }}
            />
          }
        />

        {/* ── Compte ──────────────────────────────────────────────────────────── */}
        <SectionHeader title="Compte" />
        <Row
          label="Modifier le profil"
          onPress={() => router.push('/(app)/profile/edit' as never)}
          accessibilityHint="Ouvrir l'écran d'édition du profil"
          right={<Text style={[typography.bodyMedium, { color: colors.textDisabled }]}>›</Text>}
        />
        <Row
          label="Se déconnecter"
          onPress={handleLogout}
          accessibilityHint="Se déconnecter de l'application"
        />
        <Row
          label="Supprimer mon compte"
          onPress={handleDeleteAccount}
          destructive
          accessibilityHint="Supprimer définitivement votre compte et toutes vos données"
        />

        {/* ── À propos ────────────────────────────────────────────────────────── */}
        <SectionHeader title="À propos" />
        <Row label={`Version ${version}`} accessibilityHint="Version de l'application" />
        <Row
          label="Revoir le tutoriel"
          onPress={handleResetTutorial}
          accessibilityHint="Réinitialise l'onboarding pour le voir au prochain démarrage"
          right={<Text style={[typography.bodyMedium, { color: colors.textDisabled }]}>›</Text>}
        />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  segmented: {
    flexDirection: 'row',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
  },
});
