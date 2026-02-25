/**
 * AuthContext — Phase 1.4
 *
 * État global d'authentification :
 * - Rehydratation au démarrage (SecureStore + AsyncStorage)
 * - login() / logout() persistés
 * - isLoading : true jusqu'à la fin de la rehydratation (utilisé par les guards de routes)
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { router } from 'expo-router';
import { type User } from '@/types/api';
import {
  saveToken,
  getToken,
  deleteToken,
  savePreference,
  getPreference,
  deletePreference,
} from '@/lib/storage';
import { isTokenExpired } from '@/lib/validators';

// ─── Clé AsyncStorage pour l'objet User ───────────────────────────────────────

const USER_STORAGE_KEY = '@user';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthContextValue {
  /** JWT actif, ou null si déconnecté / expiré */
  token: string | null;
  /** Objet utilisateur courant */
  user: User | null;
  /** True pendant la rehydratation initiale — utilisé pour bloquer le rendu des guards */
  isLoading: boolean;
  /** Persiste token + user, met à jour l'état */
  login: (token: string, user: User) => Promise<void>;
  /** Efface token + user, redirige vers /(auth)/login */
  logout: () => Promise<void>;
}

// ─── Contexte ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydratation au montage : lecture SecureStore + vérification expiration JWT
  useEffect(() => {
    async function rehydrate() {
      try {
        const storedToken = await getToken();

        if (storedToken && !isTokenExpired(storedToken)) {
          // Token valide → restaurer l'utilisateur depuis AsyncStorage
          const storedUser = await getPreference(USER_STORAGE_KEY);
          setToken(storedToken);
          setUser(storedUser ? (JSON.parse(storedUser) as User) : null);
        } else if (storedToken) {
          // Token expiré → nettoyage silencieux
          await deleteToken();
          await deletePreference(USER_STORAGE_KEY);
        }
      } catch {
        // Erreur de lecture → état déconnecté
      } finally {
        setIsLoading(false);
      }
    }

    void rehydrate();
  }, []);

  const login = async (newToken: string, newUser: User): Promise<void> => {
    await saveToken(newToken);
    await savePreference(USER_STORAGE_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async (): Promise<void> => {
    await deleteToken();
    await deletePreference(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
    router.replace('/(auth)/login');
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
