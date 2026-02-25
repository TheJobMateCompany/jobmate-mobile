/**
 * useJobFeed — Phase 4.1
 *
 * Responsabilités :
 * - fetchFeed(status?)  → query `jobFeed(status: JobStatus)` → liste locale
 * - approveJob(id)      → mutation `approveJob(jobFeedId)` → retire optimistement
 *                         de la vue PENDING, rollback si erreur
 * - rejectJob(id)       → mutation `rejectJob(jobFeedId)`  → retire optimistement
 *                         de la vue PENDING, rollback si erreur
 * - SSE `JOB_DISCOVERED` → prepend la neue offre en haut de la liste (si payload
 *                          conforme JobFeedItem) ou déclenche un re-fetch complet
 * - SSE `ANALYSIS_DONE`  → met à jour le statut de la card concernée ;
 *                          l'analyse IA complète est sur l'Application (Phase 5)
 * - `isLoading`, `isRefreshing`, `error`, `jobs`
 *
 * Optimisations :
 * - Guard `isFetchingRef` pour éviter les double-fetch concurrents
 * - Guard `submittingRef` pour éviter les mutations simultanées
 * - Le filtre actif (`currentStatus`) est gardé en ref pour que SSE puisse
 *   filtrer les nouvelles offres entrants selon le contexte courant
 *
 * Utilisé par :
 *   app/(app)/feed/index.tsx    — liste + swipe
 *   app/(app)/feed/[id].tsx     — détail
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSSE } from './useSSE';
import { gqlRequest } from '@/lib/graphql/client';
import { JOB_FEED_QUERY } from '@/lib/graphql/queries';
import { APPROVE_JOB_MUTATION, REJECT_JOB_MUTATION } from '@/lib/graphql/mutations';
import { mapApiError } from '@/lib/errors';
import { type JobFeedItem, type JobStatus } from '@/types/api';

// ─── Types réponses GraphQL ────────────────────────────────────────────────────

interface JobFeedResponse {
  jobFeed: JobFeedItem[];
}

interface ApproveJobResponse {
  approveJob: { id: string; currentStatus: string };
}

interface RejectJobResponse {
  rejectJob: { id: string; status: string };
}

/** Payload SSE JOB_DISCOVERED — correspondance au job_feed row Redis */
interface JobDiscoveredPayload {
  id?: string;
  rawData?: Record<string, unknown>;
  sourceUrl?: string | null;
  status?: JobStatus;
  createdAt?: string;
}

/** Payload SSE ANALYSIS_DONE */
interface AnalysisDonePayload {
  jobFeedId?: string;
}

// ─── Interface du hook ────────────────────────────────────────────────────────

export interface UseJobFeedReturn {
  jobs: JobFeedItem[];
  /** Chargement initial */
  isLoading: boolean;
  /** Pull-to-refresh */
  isRefreshing: boolean;
  /** true pendant approveJob / rejectJob */
  isSubmitting: boolean;
  error: string | null;
  /**
   * Charge (ou recharge) la liste des offres.
   * @param status Filtre optionnel — undefined = PENDING par défaut (affichage principal)
   */
  fetchFeed: (status?: JobStatus) => Promise<void>;
  /**
   * Approuve une offre → crée une Application en statut TO_APPLY.
   * Retire optimistement l'offre de la liste PENDING.
   */
  approveJob: (jobFeedId: string) => Promise<void>;
  /**
   * Rejette une offre → passe son statut à REJECTED.
   * Retire optimistement l'offre de la liste PENDING.
   */
  rejectJob: (jobFeedId: string) => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useJobFeed(): UseJobFeedReturn {
  const { token } = useAuth();
  const { subscribe } = useSSE();

  const [jobs, setJobs] = useState<JobFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards
  const isFetchingRef = useRef(false);
  const submittingRef = useRef(false);

  // Dernier statut fetchté — utilisé par SSE pour filtrer les nouvelles offres
  const currentStatusRef = useRef<JobStatus | undefined>(undefined);

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  const fetchFeed = useCallback(
    async (status?: JobStatus) => {
      if (!token) return;
      if (isFetchingRef.current) return; // évite double-fetch concurrents
      isFetchingRef.current = true;

      // Premier fetch = isLoading, refresh suivants = isRefreshing
      if (jobs.length === 0) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError(null);
      currentStatusRef.current = status;

      try {
        const data = await gqlRequest<JobFeedResponse>(
          JOB_FEED_QUERY,
          status ? { status } : undefined,
        );
        setJobs(data.jobFeed);
      } catch (err) {
        setError(mapApiError(err));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [token, jobs.length],
  );

  // ─── Approve ───────────────────────────────────────────────────────────────

  const approveJob = useCallback(
    async (jobFeedId: string) => {
      if (!token) return;
      if (submittingRef.current) return;
      submittingRef.current = true;
      setIsSubmitting(true);
      setError(null);

      // Snapshot pour rollback
      const snapshot = jobs.find((j) => j.id === jobFeedId);
      // Suppression optimiste de la liste affichée (on est en vue PENDING)
      setJobs((prev) => prev.filter((j) => j.id !== jobFeedId));

      try {
        await gqlRequest<ApproveJobResponse>(APPROVE_JOB_MUTATION, { jobFeedId });
        // La mutation crée une Application → l'item disparaît du feed PENDING : OK
      } catch (err) {
        // Rollback
        if (snapshot) {
          setJobs((prev) => {
            const exists = prev.some((j) => j.id === jobFeedId);
            return exists ? prev : [snapshot, ...prev];
          });
        }
        setError(mapApiError(err));
        throw err;
      } finally {
        setIsSubmitting(false);
        submittingRef.current = false;
      }
    },
    [token, jobs],
  );

  // ─── Reject ────────────────────────────────────────────────────────────────

  const rejectJob = useCallback(
    async (jobFeedId: string) => {
      if (!token) return;
      if (submittingRef.current) return;
      submittingRef.current = true;
      setIsSubmitting(true);
      setError(null);

      // Snapshot pour rollback
      const snapshot = jobs.find((j) => j.id === jobFeedId);
      // Suppression optimiste
      setJobs((prev) => prev.filter((j) => j.id !== jobFeedId));

      try {
        await gqlRequest<RejectJobResponse>(REJECT_JOB_MUTATION, { jobFeedId });
      } catch (err) {
        // Rollback
        if (snapshot) {
          setJobs((prev) => {
            const exists = prev.some((j) => j.id === jobFeedId);
            return exists ? prev : [snapshot, ...prev];
          });
        }
        setError(mapApiError(err));
        throw err;
      } finally {
        setIsSubmitting(false);
        submittingRef.current = false;
      }
    },
    [token, jobs],
  );

  // ─── Chargement initial ────────────────────────────────────────────────────

  useEffect(() => {
    if (token) {
      void fetchFeed();
    } else {
      setJobs([]);
    }
    // fetchFeed intentionnellement exclu : on ne veut que le montage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ─── SSE : JOB_DISCOVERED → prepend ───────────────────────────────────────

  useEffect(() => {
    const unsub = subscribe('JOB_DISCOVERED', (data) => {
      const payload = data as JobDiscoveredPayload;

      // Si on filtre sur APPROVED ou REJECTED, les nouvelles offres PENDING ne nous intéressent pas
      if (currentStatusRef.current && currentStatusRef.current !== 'PENDING') return;

      // Si le payload contient un item complet, on le prepend directement
      if (payload?.id && payload.rawData) {
        const newItem: JobFeedItem = {
          id: payload.id,
          rawData: payload.rawData,
          sourceUrl: payload.sourceUrl ?? null,
          status: payload.status ?? 'PENDING',
          createdAt: payload.createdAt ?? new Date().toISOString(),
        };
        setJobs((prev) => {
          // Déduplique en cas de double-émission SSE
          const exists = prev.some((j) => j.id === newItem.id);
          return exists ? prev : [newItem, ...prev];
        });
      } else {
        // Payload partiel → re-fetch complet (safe fallback)
        void fetchFeed(currentStatusRef.current);
      }
    });
    return unsub;
  }, [subscribe, fetchFeed]);

  // ─── SSE : ANALYSIS_DONE → update statut de la card ───────────────────────

  useEffect(() => {
    const unsub = subscribe('ANALYSIS_DONE', (data) => {
      const payload = data as AnalysisDonePayload;
      if (!payload?.jobFeedId) return;

      // L'analyse IA complète est sur l'Application (Phase 5) — ici on
      // déclenche juste un re-fetch pour que la card reflète l'état courant
      void fetchFeed(currentStatusRef.current);
    });
    return unsub;
  }, [subscribe, fetchFeed]);

  return {
    jobs,
    isLoading,
    isRefreshing,
    isSubmitting,
    error,
    fetchFeed,
    approveJob,
    rejectJob,
  };
}
