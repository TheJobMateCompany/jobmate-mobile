/**
 * useSearchConfigs — Phase 3.2
 *
 * Responsabilités :
 * - fetchConfigs() → query `mySearchConfigs` → liste locale
 * - createConfig(input) → mutation `createSearchConfig` → prepend optimiste
 * - updateConfig(id, input) → mutation `updateSearchConfig` → merge optimiste
 * - deleteConfig(id) → mutation `deleteSearchConfig` → remove optimiste + rollback
 *
 * Utilisé par :
 *   app/(app)/profile/search-config/index.tsx   — liste des configs + FAB
 *   app/(app)/profile/search-config/new.tsx     — formulaire création
 *   app/(app)/profile/search-config/[id].tsx    — formulaire édition
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { gqlRequest } from '@/lib/graphql/client';
import { MY_SEARCH_CONFIGS_QUERY } from '@/lib/graphql/queries';
import {
  CREATE_SEARCH_CONFIG_MUTATION,
  UPDATE_SEARCH_CONFIG_MUTATION,
  DELETE_SEARCH_CONFIG_MUTATION,
  TRIGGER_SCAN_MUTATION,
} from '@/lib/graphql/mutations';
import { mapApiError } from '@/lib/errors';
import {
  type SearchConfig,
  type CreateSearchConfigInput,
  type UpdateSearchConfigInput,
} from '@/types/api';

// ─── Types réponses GraphQL ────────────────────────────────────────────────────

interface MySearchConfigsResponse {
  mySearchConfigs: SearchConfig[];
}

interface CreateSearchConfigResponse {
  createSearchConfig: SearchConfig;
}

interface UpdateSearchConfigResponse {
  updateSearchConfig: SearchConfig;
}

interface DeleteSearchConfigResponse {
  deleteSearchConfig: boolean;
}

interface TriggerScanResponse {
  triggerScan: { message: string };
}

// ─── Interface du hook ────────────────────────────────────────────────────────

export interface UseSearchConfigsReturn {
  configs: SearchConfig[];
  isLoading: boolean;
  /** `true` pendant create / update / delete */
  isSubmitting: boolean;
  error: string | null;
  fetchConfigs: () => Promise<void>;
  createConfig: (input: CreateSearchConfigInput) => Promise<SearchConfig>;
  updateConfig: (id: string, input: UpdateSearchConfigInput) => Promise<SearchConfig>;
  deleteConfig: (id: string) => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSearchConfigs(): UseSearchConfigsReturn {
  const { token } = useAuth();

  const [configs, setConfigs] = useState<SearchConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref pour éviter les race conditions sur les mutations simultanées
  const submittingRef = useRef(false);

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  const fetchConfigs = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await gqlRequest<MySearchConfigsResponse>(MY_SEARCH_CONFIGS_QUERY);
      setConfigs(data.mySearchConfigs);
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // ─── Create ────────────────────────────────────────────────────────────────

  const createConfig = useCallback(
    async (input: CreateSearchConfigInput): Promise<SearchConfig> => {
      if (!token) throw new Error('Non authentifié');
      if (submittingRef.current) throw new Error('Opération en cours');
      submittingRef.current = true;
      setIsSubmitting(true);
      setError(null);
      try {
        const data = await gqlRequest<CreateSearchConfigResponse>(CREATE_SEARCH_CONFIG_MUTATION, {
          input,
        });
        const created = data.createSearchConfig;
        // Prepend car la plus récente est la plus pertinente
        setConfigs((prev) => [created, ...prev]);

        // Lance immédiatement un scan discovery pour éviter un feed vide
        // juste après la création d'une configuration.
        void gqlRequest<TriggerScanResponse>(TRIGGER_SCAN_MUTATION).catch(() => {});

        return created;
      } catch (err) {
        setError(mapApiError(err));
        throw err;
      } finally {
        setIsSubmitting(false);
        submittingRef.current = false;
      }
    },
    [token],
  );

  // ─── Update ────────────────────────────────────────────────────────────────

  const updateConfig = useCallback(
    async (id: string, input: UpdateSearchConfigInput): Promise<SearchConfig> => {
      if (!token) throw new Error('Non authentifié');
      if (submittingRef.current) throw new Error('Opération en cours');
      submittingRef.current = true;
      setIsSubmitting(true);
      setError(null);

      // Snapshot pour rollback
      const snapshot = configs.find((c) => c.id === id);

      // Mise à jour optimiste locale
      setConfigs((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                ...(input as Partial<SearchConfig>),
                updatedAt: new Date().toISOString(),
              }
            : c,
        ),
      );

      try {
        const data = await gqlRequest<UpdateSearchConfigResponse>(UPDATE_SEARCH_CONFIG_MUTATION, {
          id,
          input,
        });
        const updated = data.updateSearchConfig;
        // Remplacer par les données réelles du backend
        setConfigs((prev) => prev.map((c) => (c.id === id ? updated : c)));
        return updated;
      } catch (err) {
        // Rollback optimiste
        if (snapshot) {
          setConfigs((prev) => prev.map((c) => (c.id === id ? snapshot : c)));
        }
        setError(mapApiError(err));
        throw err;
      } finally {
        setIsSubmitting(false);
        submittingRef.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, configs],
  );

  // ─── Delete (soft) ─────────────────────────────────────────────────────────

  const deleteConfig = useCallback(
    async (id: string): Promise<void> => {
      if (!token) throw new Error('Non authentifié');
      if (submittingRef.current) throw new Error('Opération en cours');
      submittingRef.current = true;
      setIsSubmitting(true);
      setError(null);

      // Snapshot pour rollback
      const snapshot = configs.find((c) => c.id === id);

      // Suppression optimiste immédiate
      setConfigs((prev) => prev.filter((c) => c.id !== id));

      try {
        await gqlRequest<DeleteSearchConfigResponse>(DELETE_SEARCH_CONFIG_MUTATION, { id });
        // Back-end retourne Boolean! — pas d'objet à merger
      } catch (err) {
        // Rollback : réinsérer à sa position d'origine
        if (snapshot) {
          setConfigs((prev) => {
            const exists = prev.some((c) => c.id === id);
            return exists ? prev : [...prev, snapshot];
          });
        }
        setError(mapApiError(err));
        throw err;
      } finally {
        setIsSubmitting(false);
        submittingRef.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, configs],
  );

  // ─── Chargement initial ────────────────────────────────────────────────────

  useEffect(() => {
    if (token) {
      void fetchConfigs();
    } else {
      setConfigs([]);
    }
  }, [token, fetchConfigs]);

  return {
    configs,
    isLoading,
    isSubmitting,
    error,
    fetchConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
  };
}
