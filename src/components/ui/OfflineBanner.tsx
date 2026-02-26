/**
 * OfflineBanner — Phase 7.2
 *
 * Affiche une bannière persistante quand l'appareil perd la connexion.
 * Quand la connexion est rétablie, affiche un toast "✅ Connexion rétablie"
 * via useNotificationBanner (doit être utilisé à l'intérieur de
 * NotificationBannerProvider).
 */

import { useEffect, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useNotificationBanner } from '@/components/notifications/ToastBanner';

const BANNER_HEIGHT = 36;
const DURATION = 250;

export function OfflineBanner() {
  const { colors, typography, spacing } = useTheme();
  const { isConnected, isInternetReachable, isLoading } = useNetworkStatus();
  const { showBanner } = useNotificationBanner();

  const offline = !isLoading && (isConnected === false || isInternetReachable === false);

  // Track previous state to detect reconnection
  const wasOfflineRef = useRef(false);

  const translateY = useSharedValue(-BANNER_HEIGHT);

  useEffect(() => {
    if (offline) {
      translateY.value = withTiming(0, { duration: DURATION, easing: Easing.out(Easing.ease) });
      wasOfflineRef.current = true;
    } else {
      translateY.value = withTiming(-BANNER_HEIGHT, {
        duration: DURATION,
        easing: Easing.in(Easing.ease),
      });
      if (wasOfflineRef.current) {
        wasOfflineRef.current = false;
        showBanner({
          title: '✅ Connexion rétablie',
          body: 'Vous êtes de nouveau en ligne.',
        });
      }
    }
  }, [offline, showBanner, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.banner,
        animatedStyle,
        {
          backgroundColor: colors.danger,
          paddingHorizontal: spacing.md,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel="Pas de connexion internet"
      accessibilityLiveRegion="polite"
    >
      <Text style={[typography.bodySmall, styles.text, { color: '#ffffff' }]} numberOfLines={1}>
        📡 Pas de connexion internet
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
