/**
 * useNotifications — Phase 6.1
 *
 * Responsabilités :
 * - Demander les permissions push au démarrage (une fois par session)
 * - Récupérer l'ExponentPushToken et l'enregistrer côté serveur via `registerPushToken`
 * - Écouter `addNotificationResponseReceivedListener` → navigation sur tap
 * - Exposer `scheduleRelanceReminder` / `cancelRelanceReminder` pour le Kanban
 *
 * Utilisé par :
 *   app/(app)/_layout.tsx   — appelé une fois pour toute la session authentifiée
 *   app/(app)/kanban/[id].tsx — scheduleRelanceReminder / cancelRelanceReminder
 */

import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { gqlRequest } from '@/lib/graphql/client';
import { REGISTER_PUSH_TOKEN_MUTATION } from '@/lib/graphql/mutations';

// ─── Handler foreground ────────────────────────────────────────────────────────
// Afficher l'alerte même quand l'app est au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const { token } = useAuth();

  // ── 1. Enregistrement push token ─────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    void registerForPushNotificationsAsync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── 2. Navigation sur tap notification ───────────────────────────────────
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string> | undefined;
      const type = data?.type;
      const applicationId = data?.applicationId;

      switch (type) {
        case 'ANALYSIS_DONE':
        case 'CARD_MOVED':
        case 'RELANCE_REMINDER':
          if (applicationId) {
            router.push(`/(app)/kanban/${applicationId}` as never);
          } else {
            router.push('/(app)/kanban' as never);
          }
          break;
        case 'JOB_DISCOVERED':
          router.push('/(app)/feed' as never);
          break;
        case 'CV_PARSED':
          router.push('/(app)/profile' as never);
          break;
        default:
          break;
      }
    });
    return () => sub.remove();
  }, []);
}

// ─── Helpers (exportés pour kanban/[id].tsx) ──────────────────────────────────

async function registerForPushNotificationsAsync() {
  try {
    // permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('[Notifications] Permission denied — push notifications disabled');
      return;
    }

    // projectId requis pour Expo Go / EAS
    const projectId =
      // @ts-ignore — peut ne pas exister si EAS non configuré
      (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ??
      (Constants.easConfig?.projectId as string | undefined);

    if (!projectId) {
      console.warn(
        '[Notifications] No EAS projectId in app.json → push token unavailable. ' +
          'Add extra.eas.projectId to app.json or configure EAS.',
      );
      return;
    }

    const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
    await gqlRequest(REGISTER_PUSH_TOKEN_MUTATION, { token: pushToken });
    console.log('[Notifications] Push token registered:', pushToken);
  } catch (err) {
    // Non-fatal : l'app fonctionne sans push
    console.warn('[Notifications] registerForPushNotificationsAsync error:', err);
  }
}

/**
 * Planifie un rappel local pour relancer une candidature.
 * Le `identifier` est l'applicationId — permet d'annuler/remplacer facilement.
 */
export async function scheduleRelanceReminder(
  applicationId: string,
  date: Date,
  jobTitle: string,
  company?: string,
): Promise<void> {
  // Annuler l'éventuel rappel existant pour cet applicationId
  await Notifications.cancelScheduledNotificationAsync(applicationId).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: applicationId,
    content: {
      title: `📅 Relance : ${jobTitle}`,
      body: company
        ? `Pensez à relancer ${company} aujourd'hui !`
        : 'Pensez à relancer cette offre !',
      data: { type: 'RELANCE_REMINDER', applicationId },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
  console.log(
    `[Notifications] Relance reminder scheduled for ${applicationId} at ${date.toISOString()}`,
  );
}

/**
 * Annule le rappel de relance pour un applicationId donné.
 */
export async function cancelRelanceReminder(applicationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(applicationId).catch(() => {});
  console.log(`[Notifications] Relance reminder cancelled for ${applicationId}`);
}
