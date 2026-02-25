/**
 * useHaptics — feedback haptique unifié
 * Phase 2.2 (créé en Phase 2.1 comme prérequis de Button)
 *
 * Toutes les méthodes sont no-op si l'haptique n'est pas disponible
 * (appareils sans moteur haptique, simulateur).
 */

import * as Haptics from 'expo-haptics';

type ImpactStyle = Haptics.ImpactFeedbackStyle;
type NotificationType = Haptics.NotificationFeedbackType;

export interface UseHapticsReturn {
  impact: (style?: ImpactStyle) => void;
  notification: (type?: NotificationType) => void;
  selection: () => void;
}

export function useHaptics(): UseHapticsReturn {
  const impact = (style: ImpactStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    void Haptics.impactAsync(style).catch(() => {
      // Silencieux si haptique indisponible (simulateur, appareils sans moteur)
    });
  };

  const notification = (type: NotificationType = Haptics.NotificationFeedbackType.Success) => {
    void Haptics.notificationAsync(type).catch(() => {});
  };

  const selection = () => {
    void Haptics.selectionAsync().catch(() => {});
  };

  return { impact, notification, selection };
}
