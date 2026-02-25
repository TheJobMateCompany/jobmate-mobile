/**
 * i18n — Internationalisation avec i18next + expo-localization
 *
 * - Détection de la langue via expo-localization (préférence système)
 * - Persistance du choix utilisateur en AsyncStorage (@lang)
 * - Fallback : 'en'
 * - Langues supportées : 'fr' | 'en'
 *
 * Usage dans un composant :
 *   const { t } = useTranslation();
 *   t('common.loading')
 *   t('feed.matchScore', { score: 87 })
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import fr from './fr.json';
import en from './en.json';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SupportedLanguage = 'fr' | 'en';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['fr', 'en'];

const LANG_STORAGE_KEY = '@lang';

// ─── Résolution de la langue au démarrage ─────────────────────────────────────

/**
 * Résout la langue à utiliser :
 * 1. Langue persistée en AsyncStorage (choix utilisateur)
 * 2. Langue système (expo-localization)
 * 3. Fallback : 'en'
 */
async function resolveInitialLanguage(): Promise<SupportedLanguage> {
  // 1. Vérifier le choix persisté
  try {
    const stored = await AsyncStorage.getItem(LANG_STORAGE_KEY);
    if (stored === 'fr' || stored === 'en') {
      return stored;
    }
  } catch {
    // Silencieux — continuer avec la détection système
  }

  // 2. Détecter la langue système
  const locales = getLocales();
  const systemLang = locales[0]?.languageCode ?? 'en';

  if (systemLang === 'fr') return 'fr';
  return 'en';
}

// ─── Persistance du changement de langue ──────────────────────────────────────

/**
 * Changer la langue active + persister en AsyncStorage.
 * À appeler depuis l'écran Paramètres.
 */
export async function changeLanguage(lang: SupportedLanguage): Promise<void> {
  await AsyncStorage.setItem(LANG_STORAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

/**
 * Retourne la langue actuellement active.
 */
export function getCurrentLanguage(): SupportedLanguage {
  const lang = i18n.language;
  return lang === 'fr' ? 'fr' : 'en';
}

// ─── Initialisation i18next ───────────────────────────────────────────────────

/**
 * Initialise i18next de façon asynchrone.
 * À appeler UNE SEULE FOIS dans app/_layout.tsx avant le rendu.
 */
export async function initI18n(): Promise<void> {
  const lng = await resolveInitialLanguage();

  await i18n.use(initReactI18next).init({
    lng,
    fallbackLng: 'en',
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    interpolation: {
      // React échappe déjà les valeurs — pas besoin de double-escaping
      escapeValue: false,
    },
    // Pas de suspense : on attend que l'init soit terminée avant de rendre
    react: {
      useSuspense: false,
    },
  });
}

export default i18n;
