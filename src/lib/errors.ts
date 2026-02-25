/**
 * Gestion centralisée des erreurs — messages utilisateur en français.
 *
 * Convertit les erreurs techniques (HTTP, GraphQL, réseau) en messages
 * lisibles adaptés à l'UX mobile.
 */

// ─── Table de correspondance erreurs backend → messages FR ───────────────────

const ERROR_MAP: Array<{ pattern: RegExp | string; message: string }> = [
  // Auth
  { pattern: /invalid credentials/i, message: 'Email ou mot de passe incorrect.' },
  { pattern: /user not found/i, message: 'Aucun compte associé à cet email.' },
  { pattern: /wrong password/i, message: 'Mot de passe incorrect.' },
  {
    pattern: /email already (taken|exists|used)/i,
    message: 'Cette adresse e-mail est déjà utilisée.',
  },
  { pattern: /user already exists/i, message: 'Un compte existe déjà avec cet email.' },
  { pattern: /account.*disabled/i, message: 'Ce compte a été désactivé. Contactez le support.' },

  // JWT / session
  { pattern: /unauthorized/i, message: 'Session expirée. Veuillez vous reconnecter.' },
  { pattern: /jwt.*expired/i, message: 'Session expirée. Veuillez vous reconnecter.' },
  { pattern: /invalid token/i, message: 'Session invalide. Veuillez vous reconnecter.' },
  { pattern: /forbidden/i, message: 'Accès refusé.' },

  // Réseau / serveur
  {
    pattern: /network request failed/i,
    message: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
  },
  {
    pattern: /failed to fetch/i,
    message: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
  },
  { pattern: /timeout/i, message: 'La requête a pris trop de temps. Réessayez.' },
  { pattern: /HTTP 5\d\d/, message: 'Le serveur rencontre un problème. Réessayez plus tard.' },
  { pattern: /HTTP 429/, message: 'Trop de tentatives. Attendez quelques secondes.' },
  { pattern: /HTTP 4\d\d/, message: 'Requête invalide. Vérifiez vos informations.' },

  // Validation
  { pattern: /validation/i, message: 'Certains champs sont invalides. Vérifiez vos informations.' },
  { pattern: /too short/i, message: 'Un champ est trop court.' },
  { pattern: /too long/i, message: 'Un champ est trop long.' },

  // Upload
  { pattern: /file too large/i, message: 'Le fichier est trop volumineux (max 10 Mo).' },
  { pattern: /invalid file type/i, message: 'Format de fichier non supporté. Utilisez un PDF.' },
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

  for (const { pattern, message } of ERROR_MAP) {
    if (typeof pattern === 'string') {
      if (raw.toLowerCase().includes(pattern.toLowerCase())) return message;
    } else {
      if (pattern.test(raw)) return message;
    }
  }

  // Fallback générique — ne jamais afficher le message technique brut
  return 'Une erreur inattendue est survenue. Réessayez.';
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
