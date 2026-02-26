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
import { useTranslation } from 'react-i18next';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const THEME_VALUES: ThemeMode[] = ['system', 'light', 'dark'];
const LANG_VALUES: Array<'fr' | 'en'> = ['fr', 'en'];

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
  const { t } = useTranslation();
  const { colors, spacing, typography, mode, setMode } = useTheme();
  const { logout } = useAuth();

  const [lang, setLangState] = useState(getCurrentLanguage());
  const [pushEnabled, setPushEnabled] = useState(false);
  const [checkingPerms, setCheckingPerms] = useState(false);

  const themeOptions: { label: string; value: ThemeMode }[] = [
    { label: t('settings.themeSystem'), value: THEME_VALUES[0] },
    { label: t('settings.themeLight'), value: THEME_VALUES[1] },
    { label: t('settings.themeDark'), value: THEME_VALUES[2] },
  ];

  const langOptions: { label: string; value: 'fr' | 'en' }[] = [
    { label: t('settings.languageFr'), value: LANG_VALUES[0] },
    { label: t('settings.languageEn'), value: LANG_VALUES[1] },
  ];

  // ── Notifications toggle ────────────────────────────────────────────────────

  const handlePushToggle = useCallback(async (val: boolean) => {
    if (val) {
      setCheckingPerms(true);
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        setPushEnabled(status === 'granted');
        if (status !== 'granted') {
          Alert.alert(
            t('settings.notificationsDisabledTitle'),
            Platform.OS === 'ios'
              ? t('settings.notificationsDisabledIos')
              : t('settings.notificationsDisabledAndroid'),
          );
        }
      } finally {
        setCheckingPerms(false);
      }
    } else {
      setPushEnabled(false);
    }
  }, [t]);

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
      t('settings.reviewTutorial'),
      t('settings.reviewTutorialConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            await AsyncStorage.removeItem(ONBOARDING_KEY);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  }, [t]);

  // ── Déconnexion ─────────────────────────────────────────────────────────────

  const handleLogout = useCallback(() => {
    Alert.alert(t('auth.logout'), t('auth.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'),
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
        },
      },
    ]);
  }, [logout, t]);

  // ── Suppression compte ──────────────────────────────────────────────────────

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      t('settings.deleteAccount'),
      t('settings.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('settings.deleteAccountFinalTitle'),
              t('settings.deleteAccountFinalConfirm'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('settings.deleteAccountFinalAction'),
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
  }, [logout, t]);

  const version = Constants.expoConfig?.version ?? '1.0.0';

  // ─── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('settings.title'),
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
        <SectionHeader title={t('settings.appearance')} />
        <SegmentedControl
          accessibilityLabel={t('settings.theme')}
          options={themeOptions}
          value={mode}
          onChange={(v) => {
            void handleThemeChange(v);
          }}
        />

        {/* ── Langue ─────────────────────────────────────────────────────────── */}
        <SectionHeader title={t('settings.language')} />
        <SegmentedControl
          accessibilityLabel={t('settings.language')}
          options={langOptions}
          value={lang}
          onChange={(v) => {
            void handleLangChange(v);
          }}
        />

        {/* ── Notifications ───────────────────────────────────────────────────── */}
        <SectionHeader title={t('settings.notifications')} />
        <Row
          label={t('settings.notifications')}
          accessibilityHint={t('settings.hints.notifications')}
          right={
            <Switch
              value={pushEnabled}
              onValueChange={(v) => {
                void handlePushToggle(v);
              }}
              disabled={checkingPerms}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
              accessibilityLabel={t('settings.notifications')}
              accessibilityRole="switch"
              accessibilityState={{ checked: pushEnabled }}
            />
          }
        />

        {/* ── Compte ──────────────────────────────────────────────────────────── */}
        <SectionHeader title={t('settings.account')} />
        <Row
          label={t('settings.editProfile')}
          onPress={() => router.push('/(app)/profile/edit' as never)}
          accessibilityHint={t('settings.hints.editProfile')}
          right={<Text style={[typography.bodyMedium, { color: colors.textDisabled }]}>›</Text>}
        />
        <Row
          label={t('settings.logout')}
          onPress={handleLogout}
          accessibilityHint={t('settings.hints.logout')}
        />
        <Row
          label={t('settings.deleteAccount')}
          onPress={handleDeleteAccount}
          destructive
          accessibilityHint={t('settings.hints.deleteAccount')}
        />

        {/* ── À propos ────────────────────────────────────────────────────────── */}
        <SectionHeader title={t('settings.about')} />
        <Row
          label={t('settings.version', { version })}
          accessibilityHint={t('settings.hints.version')}
        />
        <Row
          label={t('settings.reviewTutorial')}
          onPress={handleResetTutorial}
          accessibilityHint={t('settings.hints.reviewTutorial')}
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
