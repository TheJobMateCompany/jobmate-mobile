/**
 * useAddManualJob — Flux d'ajout d'offre manuelle
 *
 * Étape 1 : addByUrl(url) ou addManually(input)
 *   → Appelle addJobByUrl / addJobManually (discovery-service via gateway)
 *   → Retourne { jobFeedId, message } ou null en cas d'erreur
 *
 * Étape 2 : approve(jobFeedId)
 *   → Appelle approveJob(jobFeedId) qui :
 *      1. Passe le job_feed en status APPROVED
 *      2. Crée une Application en TO_APPLY
 *      3. Publie CMD_ANALYZE_JOB → AI Coach Service
 *   → Retourne { id: applicationId, currentStatus } ou null en cas d'erreur
 *
 * Utilisé par :
 *   app/(app)/kanban/add-job.tsx
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { gqlRequest } from '@/lib/graphql/client';
import {
  ADD_JOB_BY_URL_MUTATION,
  ADD_JOB_MANUALLY_MUTATION,
  APPROVE_JOB_MUTATION,
} from '@/lib/graphql/mutations';
import { mapApiError } from '@/lib/errors';
import type { ManualJobInput, ManualJobResult } from '@/types/api';

// ─── Types réponses GraphQL ────────────────────────────────────────────────────

interface AddJobByUrlResponse {
  addJobByUrl: ManualJobResult;
}

interface AddJobManuallyResponse {
  addJobManually: ManualJobResult;
}

interface ApproveJobResponse {
  approveJob: { id: string; currentStatus: string };
}

// ─── Interface du hook ────────────────────────────────────────────────────────

export interface UseAddManualJobReturn {
  /** Ajoute une offre via son URL (scraping). Retourne { jobFeedId, message } ou null. */
  addByUrl: (url: string, searchConfigId?: string | null) => Promise<ManualJobResult | null>;
  /** Ajoute une offre via saisie manuelle. Retourne { jobFeedId, message } ou null. */
  addManually: (input: ManualJobInput) => Promise<ManualJobResult | null>;
  /**
   * Approuve l'offre (jobFeedId) → crée une Application + déclenche l'analyse IA.
   * Retourne { id: applicationId } ou null.
   */
  approve: (jobFeedId: string) => Promise<{ id: string } | null>;
  /** true pendant addByUrl / addManually */
  isAdding: boolean;
  /** true pendant approve */
  isApproving: boolean;
  error: string | null;
  clearError: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAddManualJob(): UseAddManualJobReturn {
  const { token } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // ─── addByUrl ──────────────────────────────────────────────────────────────

  const addByUrl = useCallback(
    async (url: string, searchConfigId?: string | null): Promise<ManualJobResult | null> => {
      if (!token) return null;
      setIsAdding(true);
      setError(null);
      try {
        const data = await gqlRequest<AddJobByUrlResponse>(ADD_JOB_BY_URL_MUTATION, {
          url,
          searchConfigId: searchConfigId ?? null,
        });
        return data.addJobByUrl;
      } catch (err: unknown) {
        setError(mapApiError(err));
        return null;
      } finally {
        setIsAdding(false);
      }
    },
    [token],
  );

  // ─── addManually ───────────────────────────────────────────────────────────

  const addManually = useCallback(
    async (input: ManualJobInput): Promise<ManualJobResult | null> => {
      if (!token) return null;
      setIsAdding(true);
      setError(null);
      try {
        const data = await gqlRequest<AddJobManuallyResponse>(ADD_JOB_MANUALLY_MUTATION, {
          input,
        });
        return data.addJobManually;
      } catch (err: unknown) {
        setError(mapApiError(err));
        return null;
      } finally {
        setIsAdding(false);
      }
    },
    [token],
  );

  // ─── approve ───────────────────────────────────────────────────────────────

  const approve = useCallback(
    async (jobFeedId: string): Promise<{ id: string } | null> => {
      if (!token) return null;
      setIsApproving(true);
      setError(null);
      try {
        const data = await gqlRequest<ApproveJobResponse>(APPROVE_JOB_MUTATION, { jobFeedId });
        return { id: data.approveJob.id };
      } catch (err: unknown) {
        setError(mapApiError(err));
        return null;
      } finally {
        setIsApproving(false);
      }
    },
    [token],
  );

  return {
    addByUrl,
    addManually,
    approve,
    isAdding,
    isApproving,
    error,
    clearError,
  };
}
