/**
 * Gestion centralisée des erreurs — messages utilisateur en français.
 *
 * Convertit les erreurs techniques (HTTP, GraphQL, réseau) en messages
 * lisibles adaptés à l'UX mobile.
 */

import i18n from '@/i18n';

// ─── Table de correspondance erreurs backend → messages FR ───────────────────

const ERROR_MAP: Array<{ pattern: RegExp | string; key: string }> = [
  // Auth
  { pattern: /invalid credentials/i, key: 'errors.invalidCredentials' },
  { pattern: /user not found/i, key: 'errors.userNotFound' },
  { pattern: /wrong password/i, key: 'errors.wrongPassword' },
  {
    pattern: /email already (taken|exists|used)/i,
    key: 'errors.emailAlreadyUsed',
  },
  { pattern: /user already exists/i, key: 'errors.userAlreadyExists' },
  { pattern: /account.*disabled/i, key: 'errors.accountDisabled' },

  // JWT / session
  { pattern: /unauthorized/i, key: 'errors.sessionExpired' },
  { pattern: /jwt.*expired/i, key: 'errors.sessionExpired' },
  { pattern: /invalid token/i, key: 'errors.invalidSession' },
  { pattern: /forbidden/i, key: 'errors.forbidden' },

  // Réseau / serveur
  {
    pattern: /network request failed/i,
    key: 'errors.network',
  },
  {
    pattern: /failed to fetch/i,
    key: 'errors.network',
  },
  { pattern: /timeout/i, key: 'errors.timeout' },
  { pattern: /HTTP 5\d\d/, key: 'errors.http5xx' },
  { pattern: /HTTP 429/, key: 'errors.http429' },
  { pattern: /HTTP 4\d\d/, key: 'errors.http4xx' },

  // Validation
  { pattern: /validation/i, key: 'errors.validation' },
  { pattern: /too short/i, key: 'errors.tooShort' },
  { pattern: /too long/i, key: 'errors.tooLong' },

  // Upload
  { pattern: /file too large/i, key: 'errors.fileTooLarge' },
  { pattern: /invalid file type/i, key: 'errors.invalidFileType' },
];

// ─── Mapper public ────────────────────────────────────────────────────────────

/**
 * Transforme n'importe quelle erreur en message français prêt à afficher.
 *
 * @example
 * catch (err) {
 *   setError(mapApiError(err));
 * }
 */
export function mapApiError(err: unknown): string {
  const raw = extractMessage(err);

  for (const { pattern, key } of ERROR_MAP) {
    if (typeof pattern === 'string') {
      if (raw.toLowerCase().includes(pattern.toLowerCase())) return i18n.t(key);
    } else {
      if (pattern.test(raw)) return i18n.t(key);
    }
  }

  // Fallback générique — ne jamais afficher le message technique brut
  return i18n.t('errors.unexpected');
}

// ─── Helper interne ───────────────────────────────────────────────────────────

function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return '';
}
