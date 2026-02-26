/**
 * useApplications — Phase 5.1
 *
 * Responsabilités :
 * - fetchApplications(status?)   → query `myApplications` → liste locale
 * - moveCard(id, newStatus)      → mutation `moveCard`    → màj optimiste + rollback
 * - addNote(id, note)            → mutation `addNote`     → màj optimiste + rollback
 * - rateApplication(id, rating)  → mutation `rateApplication` → màj optimiste + rollback
 * - setRelanceReminder(id, date) → mutation `setRelanceReminder` → màj optimiste + rollback
 * - createApplication(jobFeedId?, input?) → mutation `createApplication` (candidature manuelle)
 * - SSE `CARD_MOVED` → mise à jour statut de la card + historyLog sans re-fetch
 *
 * Optimisations :
 * - Guard `isFetchingRef` : anti double-fetch concurrent
 * - Guard `submittingSet` : un Set<string> par applicationId pour mutations simultanées
 *   (plusieurs cards peuvent bouger en même temps sur le board)
 * - `isLoading` (1er fetch) / `isRefreshing` (pull-to-refresh suivants) séparés
 *
 * Utilisé par :
 *   app/(app)/kanban/index.tsx
 *   app/(app)/kanban/[id].tsx
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSSE } from './useSSE';
import { gqlRequest } from '@/lib/graphql/client';
import { MY_APPLICATIONS_QUERY } from '@/lib/graphql/queries';
import {
  MOVE_CARD_MUTATION,
  ADD_NOTE_MUTATION,
  RATE_APPLICATION_MUTATION,
  SET_RELANCE_REMINDER_MUTATION,
  CREATE_APPLICATION_MUTATION,
  DELETE_APPLICATION_MUTATION,
} from '@/lib/graphql/mutations';
import { mapApiError } from '@/lib/errors';
import type { Application, ApplicationStatus, StatusTransition } from '@/types/api';

// ─── Types réponses GraphQL ────────────────────────────────────────────────────

/** Sous-ensemble retourné par `myApplications` (userId non inclus) */
interface ApplicationApiItem {
  id: string;
  currentStatus: ApplicationStatus;
  jobFeedId: string | null;
  aiAnalysis: Application['aiAnalysis'];
  generatedCoverLetter: string | null;
  userNotes: string | null;
  userRating: number | null;
  relanceReminderAt: string | null;
  historyLog: StatusTransition[];
  createdAt: string;
  updatedAt: string;
}

interface MyApplicationsResponse {
  myApplications: ApplicationApiItem[];
}

interface MoveCardResponse {
  moveCard: { id: string; currentStatus: ApplicationStatus; historyLog: StatusTransition[] };
}

interface AddNoteResponse {
  addNote: { id: string; userNotes: string };
}

interface RateApplicationResponse {
  rateApplication: { id: string; userRating: number };
}

interface SetRelanceReminderResponse {
  setRelanceReminder: { id: string; relanceReminderAt: string | null };
}

interface CreateApplicationResponse {
  createApplication: ApplicationApiItem;
}

interface DeleteApplicationResponse {
  deleteApplication: boolean;
}

// ─── Payload SSE ──────────────────────────────────────────────────────────────

interface CardMovedPayload {
  applicationId?: string;
  newStatus?: ApplicationStatus;
  historyLog?: StatusTransition[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Mappe un item API vers le type Application complet (userId non fourni par l'API) */
function mapApiItem(item: ApplicationApiItem): Application {
  return {
    id: item.id,
    userId: '', // non retourné par l'API, inféré via auth
    jobFeedId: item.jobFeedId,
    currentStatus: item.currentStatus,
    aiAnalysis: item.aiAnalysis,
    generatedCoverLetter: item.generatedCoverLetter,
    userNotes: item.userNotes,
    userRating: item.userRating,
    relanceReminderAt: item.relanceReminderAt,
    historyLog: Array.isArray(item.historyLog) ? item.historyLog : [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseApplicationsReturn {
  applications: Application[];
  isLoading: boolean;
  isRefreshing: boolean;
  isCreating: boolean;
  /** Set of applicationIds currently being mutated */
  submittingIds: ReadonlySet<string>;
  error: string | null;
  fetchApplications: (status?: ApplicationStatus) => Promise<void>;
  moveCard: (applicationId: string, newStatus: ApplicationStatus) => Promise<void>;
  addNote: (applicationId: string, note: string) => Promise<void>;
  rateApplication: (applicationId: string, rating: number) => Promise<void>;
  setRelanceReminder: (applicationId: string, remindAt: Date) => Promise<void>;
  createApplication: (jobFeedId?: string | null) => Promise<Application | null>;
  deleteApplication: (applicationId: string) => Promise<boolean>;
}

export function useApplications(): UseApplicationsReturn {
  const { token } = useAuth();
  const { subscribe } = useSSE();

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [submittingIds, setSubmittingIds] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Ref : vrai pendant un fetch en cours (anti double-fetch)
  const isFetchingRef = useRef(false);
  // Ref pour savoir si on a déjà fait un premier fetch (isLoading vs isRefreshing)
  const hasFetchedRef = useRef(false);
  // Ref : filtres actuels (pour que SSE sache si la card entrante est visible)
  const currentStatusRef = useRef<ApplicationStatus | undefined>(undefined);

  // ─── Helpers submittingIds ───────────────────────────────────────────────────

  const addSubmitting = useCallback((id: string) => {
    setSubmittingIds((prev) => new Set([...prev, id]));
  }, []);

  const removeSubmitting = useCallback((id: string) => {
    setSubmittingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // ─── fetchApplications ───────────────────────────────────────────────────────

  const fetchApplications = useCallback(
    async (status?: ApplicationStatus) => {
      if (!token) return;
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      currentStatusRef.current = status;

      if (!hasFetchedRef.current) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const data = await gqlRequest<MyApplicationsResponse>(
          MY_APPLICATIONS_QUERY,
          status ? { status } : {},
        );
        // Deduplicate by id — guard against server returning the same row twice
        const seen = new Set<string>();
        const items = data.myApplications.map(mapApiItem).filter((a) => {
          if (seen.has(a.id)) return false;
          seen.add(a.id);
          return true;
        });
        setApplications(items);
        hasFetchedRef.current = true;
      } catch (err: unknown) {
        setError(mapApiError(err));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [token],
  );

  // ─── moveCard ────────────────────────────────────────────────────────────────

  const moveCard = useCallback(
    async (applicationId: string, newStatus: ApplicationStatus) => {
      if (!token) return;

      // Snapshots pour rollback
      const snapshot = [...applications];

      // Optimiste : mise à jour locale immédiate
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, currentStatus: newStatus } : app)),
      );
      addSubmitting(applicationId);

      try {
        const data = await gqlRequest<MoveCardResponse>(MOVE_CARD_MUTATION, {
          applicationId,
          newStatus,
        });
        // Réconciliation avec la réponse serveur (historyLog mis à jour)
        const { historyLog } = data.moveCard;
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId ? { ...app, currentStatus: newStatus, historyLog } : app,
          ),
        );
      } catch (err: unknown) {
        setApplications(snapshot);
        setError(mapApiError(err));
      } finally {
        removeSubmitting(applicationId);
      }
    },
    [token, applications, addSubmitting, removeSubmitting],
  );

  // ─── addNote ─────────────────────────────────────────────────────────────────

  const addNote = useCallback(
    async (applicationId: string, note: string) => {
      if (!token) return;

      const snapshot = [...applications];
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, userNotes: note } : app)),
      );
      addSubmitting(applicationId);

      try {
        const data = await gqlRequest<AddNoteResponse>(ADD_NOTE_MUTATION, {
          applicationId,
          note,
        });
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId ? { ...app, userNotes: data.addNote.userNotes } : app,
          ),
        );
      } catch (err: unknown) {
        setApplications(snapshot);
        setError(mapApiError(err));
      } finally {
        removeSubmitting(applicationId);
      }
    },
    [token, applications, addSubmitting, removeSubmitting],
  );

  // ─── rateApplication ─────────────────────────────────────────────────────────

  const rateApplication = useCallback(
    async (applicationId: string, rating: number) => {
      if (!token) return;

      const snapshot = [...applications];
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, userRating: rating } : app)),
      );
      addSubmitting(applicationId);

      try {
        const data = await gqlRequest<RateApplicationResponse>(RATE_APPLICATION_MUTATION, {
          applicationId,
          rating,
        });
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId
              ? { ...app, userRating: data.rateApplication.userRating }
              : app,
          ),
        );
      } catch (err: unknown) {
        setApplications(snapshot);
        setError(mapApiError(err));
      } finally {
        removeSubmitting(applicationId);
      }
    },
    [token, applications, addSubmitting, removeSubmitting],
  );

  // ─── setRelanceReminder ───────────────────────────────────────────────────────

  const setRelanceReminder = useCallback(
    async (applicationId: string, remindAt: Date) => {
      if (!token) return;

      const remindAtIso = remindAt.toISOString();
      const snapshot = [...applications];
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, relanceReminderAt: remindAtIso } : app,
        ),
      );
      addSubmitting(applicationId);

      try {
        const data = await gqlRequest<SetRelanceReminderResponse>(SET_RELANCE_REMINDER_MUTATION, {
          applicationId,
          remindAt: remindAtIso,
        });
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId
              ? { ...app, relanceReminderAt: data.setRelanceReminder.relanceReminderAt }
              : app,
          ),
        );
      } catch (err: unknown) {
        setApplications(snapshot);
        setError(mapApiError(err));
      } finally {
        removeSubmitting(applicationId);
      }
    },
    [token, applications, addSubmitting, removeSubmitting],
  );

  // ─── createApplication ────────────────────────────────────────────────────────

  const createApplication = useCallback(
    async (jobFeedId?: string | null): Promise<Application | null> => {
      if (!token) return null;

      setIsCreating(true);
      try {
        const data = await gqlRequest<CreateApplicationResponse>(CREATE_APPLICATION_MUTATION, {
          jobFeedId: jobFeedId ?? null,
        });
        const newApp = mapApiItem(data.createApplication);
        // Guard: skip if the id is already in state (race condition with fetch)
        setApplications((prev) =>
          prev.some((a) => a.id === newApp.id) ? prev : [newApp, ...prev],
        );
        return newApp;
      } catch (err: unknown) {
        setError(mapApiError(err));
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [token],
  );

  // ─── deleteApplication ──────────────────────────────────────────────────────────

  const deleteApplication = useCallback(
    async (applicationId: string): Promise<boolean> => {
      if (!token) return false;

      const snapshot = [...applications];
      // Optimistic: remove immediately from local state
      setApplications((prev) => prev.filter((a) => a.id !== applicationId));
      addSubmitting(applicationId);

      try {
        await gqlRequest<DeleteApplicationResponse>(DELETE_APPLICATION_MUTATION, {
          applicationId,
        });
        return true;
      } catch (err: unknown) {
        setApplications(snapshot);
        setError(mapApiError(err));
        return false;
      } finally {
        removeSubmitting(applicationId);
      }
    },
    [token, applications, addSubmitting, removeSubmitting],
  );

  // ─── SSE : CARD_MOVED ─────────────────────────────────────────────────────────

  useEffect(() => {
    const unsub = subscribe('CARD_MOVED', (data) => {
      const payload = data as CardMovedPayload;
      if (!payload?.applicationId || !payload?.newStatus) return;

      setApplications((prev) =>
        prev.map((app) => {
          if (app.id !== payload.applicationId) return app;

          const newHistory: StatusTransition[] =
            payload.historyLog ??
            (app.currentStatus !== payload.newStatus
              ? [
                  ...app.historyLog,
                  {
                    from: app.currentStatus,
                    to: payload.newStatus!,
                    at: new Date().toISOString(),
                  },
                ]
              : app.historyLog);

          return {
            ...app,
            currentStatus: payload.newStatus!,
            historyLog: newHistory,
          };
        }),
      );
    });
    return unsub;
  }, [subscribe]);

  return {
    applications,
    isLoading,
    isRefreshing,
    isCreating,
    submittingIds,
    error,
    fetchApplications,
    moveCard,
    addNote,
    rateApplication,
    setRelanceReminder,
    createApplication,
    deleteApplication,
  };
}
