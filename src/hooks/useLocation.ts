/**
 * useLocation — Phase 3.3
 *
 * Responsabilités :
 * - Demande la permission de géolocalisation au premier appel de `getCity()`
 * - Récupère la position GPS via `expo-location` (précision réduite suffisante)
 * - Effectue un reverse geocoding via l'API publique **Nominatim** pour obtenir
 *   le nom de la ville — aucune clé API requise, aucun envoi au backend
 * - Expose `permissionDenied` pour que l'écran puisse afficher un message explicatif
 *
 * ⚠️ La position GPS brute n'est JAMAIS persistée ni envoyée au backend.
 *    Seul le nom de la ville (string) est retourné pour pré-remplir un champ.
 *
 * Utilisé par :
 *   app/(app)/profile/search-config/new.tsx  — auto-fill du champ "Localisation"
 *   app/(app)/profile/search-config/[id].tsx — même usage en édition
 */

import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

// ─── Nominatim API ────────────────────────────────────────────────────────────

/** Sous-ensemble du retour Nominatim dont on a besoin */
interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
}

interface NominatimResponse {
  address?: NominatimAddress;
}

/**
 * Extrait le nom de la ville à partir de la réponse Nominatim.
 * Priorité : city > town > village > municipality > county > state
 */
function extractCity(address: NominatimAddress): string | null {
  return (
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.county ??
    address.state ??
    null
  );
}

/** User-Agent requis par la politique d'utilisation de Nominatim */
const NOMINATIM_USER_AGENT = 'JobMate/1.0 (mobile app; contact@meelkyway.com)';

async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?lat=${latitude}&lon=${longitude}&format=json&zoom=10&addressdetails=1`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': NOMINATIM_USER_AGENT,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim error: ${response.status}`);
  }

  const data = (await response.json()) as NominatimResponse;
  return data.address ? extractCity(data.address) : null;
}

// ─── Interface du hook ────────────────────────────────────────────────────────

export interface UseLocationReturn {
  city: string | null;
  isLoading: boolean;
  error: string | null;
  /** true si l'utilisateur a explicitement refusé la permission */
  permissionDenied: boolean;
  /**
   * Demande la permission, obtient la position et effectue le reverse geocoding.
   * Idempotent : un appel en cours bloque les suivants.
   * @returns le nom de la ville ou null si indisponible
   */
  getCity: () => Promise<string | null>;
  /** Remet l'état à zéro (utile si l'utilisateur navigue vers une autre page) */
  reset: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLocation(): UseLocationReturn {
  const [city, setCity] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const getCity = useCallback(async (): Promise<string | null> => {
    // Évite les appels concurrents
    if (isLoading) return city;

    setIsLoading(true);
    setError(null);
    setPermissionDenied(false);

    try {
      // 1. Demander la permission (foreground uniquement — pas de background tracking)
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== Location.PermissionStatus.GRANTED) {
        setPermissionDenied(true);
        return null;
      }

      // 2. Récupérer la position GPS
      //    - accuracy LOW suffit pour du reverse geocoding ville-level
      //    - timeout 10s pour ne pas bloquer l'UX
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
        timeInterval: 0,
        distanceInterval: 0,
      });

      const { latitude, longitude } = position.coords;

      // 3. Reverse geocoding via Nominatim (aucune clé API, aucun envoi backend)
      const resolvedCity = await reverseGeocode(latitude, longitude);
      setCity(resolvedCity);
      return resolvedCity;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Localisation indisponible';
      // Distinguer les erreurs de permission des erreurs réseau/GPS
      if (
        message.toLowerCase().includes('permission') ||
        message.toLowerCase().includes('denied')
      ) {
        setPermissionDenied(true);
      } else {
        setError("Impossible d'obtenir la localisation. Vérifiez votre connexion.");
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, city]);

  const reset = useCallback(() => {
    setCity(null);
    setError(null);
    setPermissionDenied(false);
  }, []);

  return { city, isLoading, error, permissionDenied, getCity, reset };
}
