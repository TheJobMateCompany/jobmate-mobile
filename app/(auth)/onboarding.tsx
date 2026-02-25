/**
 * Onboarding — 5 slides
 * Phase 2.3
 *
 * PagerView (react-native-pager-view) + dots animés (Reanimated 3)
 * Haptic selectionAsync() à chaque changement de slide
 * Flag onboardingCompleted en AsyncStorage → ne réapparaît pas au prochain lancement
 */

import { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { Button } from '@/components/ui/Button';
import { Spacer } from '@/components/ui/Spacer';

// ─── Clé de stockage (également exportée pour (auth)/_layout.tsx) ────────────────────────

export const ONBOARDING_KEY = '@onboarding_completed';

// ─── Données des slides ──────────────────────────────────────────────────────────

interface SlideData {
  key: string;
  icon: string;
  bg: string;
  title: string;
  body: string;
}

const SLIDES: SlideData[] = [
  {
    key: '1',
    icon: '\uD83C\uDFAF',
    bg: '#4F46E5',
    title: 'Votre assistant de\ncandidature IA',
    body: 'JobMate trouve, trie et enrichit automatiquement les offres d\u2019emploi qui correspondent \u00e0 votre profil.',
  },
  {
    key: '2',
    icon: '\uD83D\uDCE1',
    bg: '#6D63FF',
    title: 'Un chasseur de postes\nautomatique',
    body: 'Configurez vos crit\u00e8res une fois. JobMate surveille les plateformes en continu et vous livre uniquement les offres pertinentes dans votre Inbox.',
  },
  {
    key: '3',
    icon: '\uD83E\uDD16',
    bg: '#3730A3',
    title: 'L\u2019IA qui pr\u00e9pare vos\ncandidatures',
    body: 'Pour chaque offre approuv\u00e9e, JobMate g\u00e9n\u00e8re un score de matching, une lettre de motivation personnalis\u00e9e et des suggestions d\u2019optimisation de CV.',
  },
  {
    key: '4',
    icon: '\uD83D\uDCCB',
    bg: '#4F46E5',
    title: 'Suivez chaque candidature',
    body: 'Un CRM personnel\u00a0: g\u00e9rez vos candidatures de \u00ab\u00a0\u00c0 postuler\u00a0\u00bb jusqu\u2019\u00e0 \u00ab\u00a0Embauch\u00e9\u00a0\u00bb, avec notes, rappels et historique.',
  },
  {
    key: '5',
    icon: '\uD83C\uDFC6',
    bg: '#10B981',
    title: 'Pr\u00eat \u00e0 d\u00e9crocher votre\nprochain poste\u00a0?',
    body: 'Cr\u00e9ez votre compte en 30\u00a0secondes.',
  },
];

const LAST_SLIDE = SLIDES.length - 1;

// ─── Composant dot individuel ──────────────────────────────────────────────────────────

function Dot({ index, currentPage }: { index: number; currentPage: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      currentPage.value,
      [index - 1, index, index + 1],
      [8, 24, 8],
      'clamp',
    );
    const opacity = interpolate(
      currentPage.value,
      [index - 1, index, index + 1],
      [0.4, 1, 0.4],
      'clamp',
    );
    return { width, opacity };
  });

  return <Animated.View style={[styles.dot, animatedStyle, { backgroundColor: '#FFFFFF' }]} />;
}

// ─── Écran Onboarding ──────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { spacing, typography, radius } = useTheme();
  const { width } = useWindowDimensions();
  const { selection } = useHaptics();

  const pagerRef = useRef<PagerView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentPage = useSharedValue(0);

  // ─── Persistance + navigation ────────────────────────────────────────────

  const completeOnboarding = async (dest: '/(auth)/register' | '/(auth)/login') => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace(dest);
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
    const pos = e.nativeEvent.position;
    setCurrentIndex(pos);
    currentPage.value = withTiming(pos, { duration: 250 });
    selection();
  };

  const handleSkip = () => {
    pagerRef.current?.setPage(LAST_SLIDE);
  };

  // ─── Rendu ───────────────────────────────────────────────────────────────

  const isLastSlide = currentIndex === LAST_SLIDE;

  return (
    <View style={styles.root}>
      {/* Bouton Passer */}
      {!isLastSlide && (
        <TouchableOpacity
          style={[styles.skipButton, { top: spacing.xxl, right: spacing.lg }]}
          onPress={handleSkip}
          accessibilityLabel="Passer l'introduction"
          accessibilityRole="button"
        >
          <Text style={[typography.label, styles.skipText]}>Passer</Text>
        </TouchableOpacity>
      )}

      {/* PagerView */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {SLIDES.map((slide, idx) => (
          <View key={slide.key} style={[styles.slide, { backgroundColor: slide.bg, width }]}>
            {/* Illustration (placeholder — Lottie en Phase future) */}
            <View style={[styles.illustration, { borderRadius: radius.xl }]}>
              <Text style={styles.icon}>{slide.icon}</Text>
            </View>

            <Spacer size={spacing.xl} />

            <Text style={[typography.displayLarge, styles.title]}>{slide.title}</Text>

            <Spacer size={spacing.md} />

            <Text style={[typography.bodyLarge, styles.body]}>{slide.body}</Text>

            {/* CTA — slide 5 uniquement */}
            {idx === LAST_SLIDE && (
              <View style={[styles.ctaContainer, { marginTop: spacing.xxl }]}>
                <Button
                  label="Créer un compte"
                  variant="secondary"
                  onPress={() => void completeOnboarding('/(auth)/register')}
                  style={{ borderColor: '#FFFFFF' }}
                />
                <Spacer size={spacing.md} />
                <Button
                  label="J'ai déjà un compte"
                  variant="ghost"
                  onPress={() => void completeOnboarding('/(auth)/login')}
                />
              </View>
            )}
          </View>
        ))}
      </PagerView>

      {/* Dots indicator */}
      <View style={[styles.dotsRow, { bottom: spacing.xxl }]}>
        {SLIDES.map((slide, idx) => (
          <Dot key={slide.key} index={idx} currentPage={currentPage} />
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  illustration: {
    width: 180,
    height: 180,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 80,
  },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  body: {
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 26,
  },
  ctaContainer: {
    width: '100%',
  },
  skipButton: {
    position: 'absolute',
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    color: '#FFFFFF',
    opacity: 0.85,
  },
  dotsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
