import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/hooks/useTheme';
import { useSSE } from '../../src/hooks/useSSE';
import { useNotifications } from '../../src/hooks/useNotifications';
import { isTokenExpired } from '../../src/lib/validators';
import {
  NotificationBannerProvider,
  useNotificationBanner,
} from '../../src/components/notifications/ToastBanner';
import { OfflineBanner } from '../../src/components/ui/OfflineBanner';

// ─── Bridge SSE → ToastBanner (doit être à l'intérieur du Provider) ────────────

function SSEBannerBridge() {
  const { subscribe } = useSSE();
  const { showBanner } = useNotificationBanner();
  const { t } = useTranslation();

  useEffect(() => {
    const unsubJobDiscovered = subscribe('JOB_DISCOVERED', () => {
      showBanner({
        title: t('notifications.newJob', { title: '…', company: '…' }),
        body: t('notifications.permissionSubtitle'),
        action: () => router.push('/(app)/feed' as never),
      });
    });
    const unsubAnalysisDone = subscribe('ANALYSIS_DONE', (data) => {
      const d = data as { matchScore?: number; applicationId?: string } | undefined;
      showBanner({
        title: '🤖',
        body:
          d?.matchScore != null
            ? t('feed.matchScore', { score: d.matchScore })
            : t('common.loading'),
        action: d?.applicationId
          ? () => router.push(`/(app)/kanban/${d.applicationId}` as never)
          : () => router.push('/(app)/kanban' as never),
      });
    });
    const unsubCvParsed = subscribe('CV_PARSED', () => {
      showBanner({
        title: t('notifications.cvParsed'),
        body: t('notifications.cvParsedBody'),
        action: () => router.push('/(app)/profile' as never),
      });
    });
    const unsubCardMoved = subscribe('CARD_MOVED', (data) => {
      const d = data as { to?: string; applicationId?: string } | undefined;
      showBanner({
        title: t('kanban.title'),
        body: d?.to ? t('kanban.movedTo', { status: d.to }) : t('common.loading'),
        action: d?.applicationId
          ? () => router.push(`/(app)/kanban/${d.applicationId}` as never)
          : undefined,
      });
    });
    return () => {
      unsubJobDiscovered();
      unsubAnalysisDone();
      unsubCvParsed();
      unsubCardMoved();
    };
  }, [subscribe, showBanner]);

  return null;
}

// ─── Composant interne — accès à useNotifications et badge ────────────────────

function AppContent() {
  const { token, isLoading } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { subscribe } = useSSE();
  const [pendingBadge, setPendingBadge] = useState<number | undefined>(undefined);

  // Enregistrement push token + listener de navigation
  useNotifications();

  // Badge tab Feed — incrémenté à chaque JOB_DISCOVERED SSE
  useEffect(() => {
    return subscribe('JOB_DISCOVERED', () => {
      setPendingBadge((n) => (n ?? 0) + 1);
      // Badge icône app (iOS uniquement)
      void Notifications.setBadgeCountAsync((pendingBadge ?? 0) + 1).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe]);

  useEffect(() => {
    if (isLoading) return;
    if (!token || isTokenExpired(token)) {
      router.replace('/(auth)/login');
    }
  }, [token, isLoading]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!token || isTokenExpired(token)) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDisabled,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: t('feed.title'),
          tabBarBadge: pendingBadge || undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'newspaper' : 'newspaper-outline'} size={22} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => {
            setPendingBadge(undefined);
            void Notifications.setBadgeCountAsync(0).catch(() => {});
          },
        }}
      />
      <Tabs.Screen
        name="kanban"
        options={{
          title: t('kanban.title'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'albums' : 'albums-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile.title'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person-circle' : 'person-circle-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings.title'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function AppLayout() {
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  if (isExpoGo) {
    return <AppContent />;
  }

  return (
    <NotificationBannerProvider>
      <SSEBannerBridge />
      <OfflineBanner />
      <AppContent />
    </NotificationBannerProvider>
  );
}
