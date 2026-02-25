/**
 * Wrappers de stockage persistant
 *
 * - SecureStore : données sensibles (JWT)
 * - AsyncStorage : préférences utilisateur (thème, langue)
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Clés ─────────────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  // SecureStore
  AUTH_TOKEN: 'auth_token',

  // AsyncStorage
  THEME_MODE: '@theme_mode',
  LANG: '@lang',
} as const;

// ─── SecureStore (JWT + données sensibles) ────────────────────────────────────

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
}

export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
}

// ─── AsyncStorage (préférences) ────────────────────────────────────────────────

export async function savePreference(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

export async function getPreference(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key);
}

export async function deletePreference(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
