/**
 * Fonctions de validation locale — sans dépendances externes
 */

import i18n from '@/i18n';

// ─── Email ────────────────────────────────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─── Mot de passe ─────────────────────────────────────────────────────────────

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) errors.push(i18n.t('auth.errors.passwordTooShort'));
  if (!/[A-Z]/.test(password)) errors.push(i18n.t('auth.errors.passwordNeedsUppercase'));
  if (!/[0-9]/.test(password)) errors.push(i18n.t('auth.errors.passwordNeedsNumber'));

  return { isValid: errors.length === 0, errors };
}

// ─── Champs requis ─────────────────────────────────────────────────────────────

export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

// ─── JWT ──────────────────────────────────────────────────────────────────────

/**
 * Décode le payload d'un JWT sans vérifier la signature.
 * Uniquement pour lire les claims (exp, sub) côté client.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(payload);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Retourne true si le token JWT est expiré (ou invalide).
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload['exp'] !== 'number') return true;
  return payload['exp'] * 1000 < Date.now();
}

// ─── Taille fichier ───────────────────────────────────────────────────────────

export function isFileSizeValid(sizeBytes: number, maxMb = 10): boolean {
  return sizeBytes <= maxMb * 1024 * 1024;
}
