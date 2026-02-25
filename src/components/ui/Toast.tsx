/**
 * Toast — bannière top-of-screen (2s auto-dismiss, tap pour fermer)
 * Phase 2.1
 *
 * Usage :
 *   1. Enrober la navigation avec <ToastProvider>
 *   2. Dans n'importe quel écran : const { showToast } = useToast()
 *      showToast({ message: 'Connexion réussie', variant: 'success' })
 */

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  withSequence,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  /** Durée d'affichage en ms (défaut : 2000) */
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

// ─── Contexte ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors, spacing, radius, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastOptions | null>(null);

  const translateY = useSharedValue(-120);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    translateY.value = withTiming(-120, { duration: 250 }, (finished) => {
      if (finished) runOnJS(setToast)(null);
    });
  }, [translateY]);

  const showToast = useCallback(
    (options: ToastOptions) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      setToast(options);
      translateY.value = withSequence(
        withTiming(insets.top + 8, { duration: 280 }),
        withTiming(insets.top + 8, { duration: options.duration ?? 2000 }),
      );

      timerRef.current = setTimeout(
        () => {
          hide();
        },
        (options.duration ?? 2000) + 280,
      );
    },
    [translateY, insets.top, hide],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const variantColor: Record<ToastVariant, string> = {
    success: colors.success,
    error: colors.danger,
    warning: colors.warning,
    info: colors.primary,
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            animatedStyle,
            {
              backgroundColor: variantColor[toast.variant ?? 'info'],
              borderRadius: radius.md,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              marginHorizontal: spacing.lg,
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                },
                android: { elevation: 6 },
              }),
            },
          ]}
        >
          <TouchableOpacity onPress={hide} activeOpacity={0.9}>
            <Text style={[typography.bodyMedium, { color: '#FFFFFF', fontWeight: '600' }]}>
              {toast.message}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignSelf: 'center',
  },
});
