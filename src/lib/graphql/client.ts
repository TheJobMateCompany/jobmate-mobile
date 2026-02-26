/**
 * Client GraphQL — implémentation en Phase 1.5
 *
 * Architecture :
 * - gqlRequest<T>  : fetch JSON vers POST /graphql (query + mutation)
 * - gqlUpload<T>   : fetch multipart/form-data pour upload CV
 *
 * Le JWT est injecté automatiquement depuis SecureStore à chaque requête.
 */

const API_URL = 'https://api.meelkyway.com/graphql';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getToken(): Promise<string | null> {
  // Importé dynamiquement pour éviter les dépendances circulaires
  const secureStore = await import('expo-secure-store');
  return secureStore.getItemAsync('auth_token');
}

// ─── Client principal ─────────────────────────────────────────────────────────

/**
 * Exécute une query ou mutation GraphQL.
 * @throws Error si la réponse contient des erreurs GraphQL ou un statut HTTP >= 400
 */
export async function gqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'apollo-require-preflight': 'true',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  // Tenter de lire le corps JSON même en cas d'erreur HTTP.
  // Les serveurs GraphQL retournent parfois un 400 avec { errors: [...] } utile.
  const json: GQLResponse<T> = await response.json().catch(() => ({}));

  if (!response.ok) {
    const gqlMessage = json.errors?.[0]?.message;
    throw new Error(gqlMessage ?? `HTTP ${response.status}: ${response.statusText}`);
  }

  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message);
  }

  if (json.data === undefined) {
    throw new Error('Réponse GraphQL sans champ data');
  }

  return json.data;
}

/**
 * Upload multipart/form-data pour l'envoi de fichier CV.
 * Ne pas utiliser gqlRequest pour les uploads — FormData + fetch dédié.
 */
export async function gqlUpload<T>(
  query: string,
  fileUri: string,
  mimeType: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = await getToken();

  const formData = new FormData();
  formData.append('operations', JSON.stringify({ query, variables }));
  formData.append('map', JSON.stringify({ '0': ['variables.file'] }));
  formData.append('0', {
    uri: fileUri,
    type: mimeType,
    name: fileUri.split('/').pop() ?? 'upload',
  } as unknown as Blob);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'apollo-require-preflight': 'true',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: formData,
  });

  const json: GQLResponse<T> = await response.json().catch(() => ({}));

  if (!response.ok) {
    const gqlMessage = json.errors?.[0]?.message;
    throw new Error(gqlMessage ?? `HTTP ${response.status}: ${response.statusText}`);
  }

  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message);
  }

  if (json.data === undefined) {
    throw new Error('Réponse GraphQL sans champ data');
  }

  return json.data;
}
