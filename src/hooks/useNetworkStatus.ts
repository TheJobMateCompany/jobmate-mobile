/**
 * useNetworkStatus — wrapper NetInfo
 * Phase 1.6
 *
 * Fournit l'état de connectivité réseau en temps réel.
 * Utilisé par SSEClient (via useSSE) et par OfflineBanner (Phase 7).
 *
 * @example
 * const { isConnected, isInternetReachable, type } = useNetworkStatus();
 */

import { useEffect, useState } from 'react';
import NetInfo, { type NetInfoStateType } from '@react-native-community/netinfo';

export interface NetworkStatus {
  /** true si le réseau est accessible (Wi-Fi, cellulaire, …) */
  isConnected: boolean;
  /** true si une connexion Internet est effective (pas seulement LAN) */
  isInternetReachable: boolean;
  /** 'wifi' | 'cellular' | 'ethernet' | 'none' | … */
  type: NetInfoStateType;
  /** true pendant le premier fetch d'état (avant que NetInfo ait répondu) */
  isLoading: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown' as NetInfoStateType,
    isLoading: true,
  });

  useEffect(() => {
    // fetch initial (synchrone via cache NetInfo)
    void NetInfo.fetch().then((state) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
        isLoading: false,
      });
    });

    // Abonnement aux changements
    const unsubscribe = NetInfo.addEventListener((state) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
        isLoading: false,
      });
    });

    return unsubscribe;
  }, []);

  return status;
}
