/**
 * ToastBanner — Phase 6.3
 *
 * Bannière in-app pour les notifications SSE (JOB_DISCOVERED, ANALYSIS_DONE, CV_PARSED, CARD_MOVED).
 * FIFO queue : plusieurs événements simultanés s'enchaînent sans se perdre.
 * Tap → action de navigation.
 * Slide depuis le haut via Reanimated 4.
 *
 * Usage :
 *   1. Enrober la navigation avec <NotificationBannerProvider>
 *   2. Appeler showBanner({ title, body, action? }) depuis useNotifications
 *      ou depuis n'importe quel hook SSE
 *
 * Utilisé par :
 *   app/(app)/_layout.tsx  — NotificationBannerProvider + useSSE dispatch
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BannerItem {
  id: string;
  title: string;
  body: string;
  /** Callback appelé au tap — typiquement une navigation router.push() */
  action?: () => void;
}

interface NotificationBannerContextValue {
  showBanner: (item: Omit<BannerItem, 'id'>) => void;
}

// ─── Contexte ─────────────────────────────────────────────────────────────────

const NotificationBannerContext = createContext<NotificationBannerContextValue | null>(null);

export function useNotificationBanner(): NotificationBannerContextValue {
  const ctx = useContext(NotificationBannerContext);
  if (!ctx) {
    throw new Error('useNotificationBanner must be used within <NotificationBannerProvider>');
  }
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

/** Durée d'affichage d'un bannière (ms) */
const BANNER_DURATION = 3500;
/** Durée de l'animation slide (ms) */
const ANIM_DURATION = 300;

export function NotificationBannerProvider({ children }: { children: ReactNode }) {
  const { colors, spacing, radius, typography } = useTheme();
  const insets = useSafeAreaInsets();

  // FIFO queue
  const [queue, setQueue] = useState<BannerItem[]>([]);
  const [current, setCurrent] = useState<BannerItem | null>(null);
  const isAnimating = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation
  const translateY = useSharedValue(-120);

  // ── Cacher le banner courant ───────────────────────────────────────────────
  const hideCurrent = useCallback(() => {
    translateY.value = withTiming(-120, { duration: ANIM_DURATION }, (finished) => {
      if (finished) {
        runOnJS(setCurrent)(null);
        runOnJS(() => {
          isAnimating.current = false;
        })();
      }
    });
  }, [translateY]);

  // ── Afficher l'item suivant dans la queue ──────────────────────────────────
  useEffect(() => {
    if (current !== null || isAnimating.current || queue.length === 0) return;

    const [next, ...rest] = queue;
    isAnimating.current = true;
    setQueue(rest);
    setCurrent(next);

    // Slide in
    translateY.value = withTiming(insets.top + 8, { duration: ANIM_DURATION });

    // Auto-dismiss
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      hideCurrent();
    }, BANNER_DURATION);
  }, [queue, current, insets.top, translateY, hideCurrent]);

  // ── Ajouter un item à la queue ─────────────────────────────────────────────
  const showBanner = useCallback((item: Omit<BannerItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random()}`;
    setQueue((prev) => [...prev, { ...item, id }]);
  }, []);

  // ── Style animé ───────────────────────────────────────────────────────────
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleTap = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const action = current?.action;
    hideCurrent();
    // Légère attente pour que l'animation de fermeture commence avant la navigation
    setTimeout(() => action?.(), 50);
  }, [current, hideCurrent]);

  return (
    <NotificationBannerContext.Provider value={{ showBanner }}>
      {children}
      {current && (
        <Animated.View
          style={[
            styles.container,
            animatedStyle,
            {
              marginHorizontal: spacing.md,
              borderRadius: radius.lg,
              backgroundColor: colors.surface,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 8,
              elevation: 8,
            },
          ]}
        >
          <TouchableOpacity onPress={handleTap} activeOpacity={0.85} style={styles.inner}>
            {/* Bande de couleur à gauche */}
            <View style={[styles.accent, { backgroundColor: colors.primary }]} />
            <View style={styles.textBlock}>
              <Text
                style={[typography.bodyMedium, { color: colors.textPrimary, fontWeight: '700' }]}
                numberOfLines={1}
              >
                {current.title}
              </Text>
              <Text
                style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}
                numberOfLines={2}
              >
                {current.body}
              </Text>
            </View>
            {/* Indicateur "tap" */}
            {current.action && (
              <Text style={[typography.caption, { color: colors.primary, marginLeft: spacing.sm }]}>
                Ouvrir ›
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </NotificationBannerContext.Provider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9998,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 14,
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
    marginRight: 12,
    borderRadius: 2,
  },
  textBlock: {
    flex: 1,
  },
});
