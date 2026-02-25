/**
 * useSSE — Hook React pour la connexion Server-Sent Events
 * Phase 1.5
 *
 * Responsabilités :
 * - Monte SSEClient dès que le token (AuthContext) est disponible
 * - Démonte proprement au logout (token → null) et au unmount
 * - Pause la connexion si le réseau devient hors-ligne (NetInfo)
 * - Reconnexion immédiate dès que le réseau revient (sans attendre le backoff)
 * - Expose `subscribe(eventType, handler)` stable (useCallback)
 *   → utilisé par les hooks domaine : useJobFeed, useProfile, useApplications
 */

import { useEffect, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '@/context/AuthContext';
import { sseClient } from '@/lib/sse';

type EventHandler = (data: unknown) => void;

export interface UseSSEReturn {
  /**
   * S'abonne à un type d'événement SSE.
   * Retourne une fonction `unsubscribe` — à appeler dans le cleanup de useEffect.
   *
   * @example
   * useEffect(() => {
   *   const unsub = subscribe('JOB_DISCOVERED', (data) => { ... });
   *   return unsub;
   * }, [subscribe]);
   */
  subscribe: (eventType: string, handler: EventHandler) => () => void;
}

export function useSSE(): UseSSEReturn {
  const { token } = useAuth();
  // Ref pour tracker la connectivité réseau entre les callbacks NetInfo
  const isNetworkConnected = useRef<boolean>(true);

  useEffect(() => {
    // Pas de token → s'assurer que la connexion est fermée
    if (!token) {
      sseClient.disconnect();
      return;
    }

    // Token présent → ouvrir la connexion SSE
    sseClient.connect();

    // Écouter les changements d'état réseau
    const unsubNetInfo = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;

      if (connected && !isNetworkConnected.current) {
        // Réseau rétabli : reconnexion immédiate (bypass du backoff)
        sseClient.connect();
      } else if (!connected && isNetworkConnected.current) {
        // Réseau perdu : fermer la connexion pour stopper les retries
        sseClient.disconnect();
      }

      isNetworkConnected.current = connected;
    });

    return () => {
      sseClient.disconnect();
      unsubNetInfo();
    };
  }, [token]);

  /**
   * subscribe est stable (useCallback sans deps) car sseClient est un singleton.
   * Les handlers sont stockés dans la Map interne de SSEClient et survivent
   * aux reconnexions automatiques.
   */
  const subscribe = useCallback(
    (eventType: string, handler: EventHandler): (() => void) =>
      sseClient.subscribe(eventType, handler),
    [],
  );

  return { subscribe };
}
