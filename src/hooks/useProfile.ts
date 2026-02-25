/**
 * useProfile — Phase 3.1
 *
 * Responsabilités :
 * - fetchProfile() → query `me { profile }` → met à jour l'état local
 * - updateProfile(input) → mutation `updateProfile` → merge optimiste
 * - uploadCV(fileUri) → gqlUpload multipart PDF → progress binaire (0 → 1)
 * - Souscription SSE `cv_parsed` → refresh automatique du profil
 *
 * Utilisé par :
 *   app/(app)/profile/index.tsx    — affichage
 *   app/(app)/profile/edit.tsx     — édition
 */

import { useState, useEffect, useCallback } from 'react';
import { useSSE } from './useSSE';
import { useAuth } from '@/context/AuthContext';
import { gqlRequest, gqlUpload } from '@/lib/graphql/client';
import { ME_QUERY } from '@/lib/graphql/queries';
import { UPDATE_PROFILE_MUTATION, UPLOAD_CV_MUTATION } from '@/lib/graphql/mutations';
import { mapApiError } from '@/lib/errors';
import { type Profile, type UpdateProfileInput, type User } from '@/types/api';

// ─── Types réponses GraphQL ────────────────────────────────────────────────────

interface MeResponse {
  me: User;
}

interface UpdateProfileResponse {
  updateProfile: Profile;
}

interface UploadCVResponse {
  uploadCV: { cvUrl: string; message: string };
}

// ─── État du hook ─────────────────────────────────────────────────────────────

export interface UseProfileReturn {
  profile: Profile | null;
  /** Chargement initial */
  isLoading: boolean;
  /** Mutation updateProfile en cours */
  isUpdating: boolean;
  /** Upload CV en cours */
  isUploading: boolean;
  /** Progression upload : 0 → 1 (binaire — fetch ne supporte pas les events de progression) */
  uploadProgress: number;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  /** @param fileUri URI local du fichier PDF (depuis expo-document-picker) */
  uploadCV: (fileUri: string) => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProfile(): UseProfileReturn {
  const { token } = useAuth();
  const { subscribe } = useSSE();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch profil ──────────────────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await gqlRequest<MeResponse>(ME_QUERY);
      setProfile(data.me.profile);
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // ─── Update profil ─────────────────────────────────────────────────────────

  const updateProfile = useCallback(
    async (input: UpdateProfileInput) => {
      if (!token) return;
      setIsUpdating(true);
      setError(null);
      try {
        const data = await gqlRequest<UpdateProfileResponse>(UPDATE_PROFILE_MUTATION, { input });
        setProfile(data.updateProfile);
      } catch (err) {
        setError(mapApiError(err));
        throw err; // Permettre à l'écran d'afficher l'erreur inline
      } finally {
        setIsUpdating(false);
      }
    },
    [token],
  );

  // ─── Upload CV ─────────────────────────────────────────────────────────────

  const uploadCV = useCallback(
    async (fileUri: string) => {
      if (!token) return;
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);
      try {
        // fetch ne supporte pas les events de progression → progress binaire
        setUploadProgress(0.1); // indique le début de l'envoi
        const data = await gqlUpload<UploadCVResponse>(
          UPLOAD_CV_MUTATION,
          fileUri,
          'application/pdf',
          { file: null }, // requis par graphql-multipart-request-spec
        );
        setUploadProgress(1);
        // Mettre à jour le cvUrl localement sans re-fetch complet
        setProfile((prev) => (prev ? { ...prev, cvUrl: data.uploadCV.cvUrl } : prev));
      } catch (err) {
        setError(mapApiError(err));
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [token],
  );

  // ─── Chargement initial ────────────────────────────────────────────────────

  useEffect(() => {
    if (token) {
      void fetchProfile();
    } else {
      setProfile(null);
    }
  }, [token, fetchProfile]);

  // ─── Souscription SSE : cv_parsed → refresh automatique ───────────────────

  useEffect(() => {
    const unsub = subscribe('CV_PARSED', () => {
      console.log('[useProfile] SSE cv_parsed → refresh profile');
      void fetchProfile();
    });
    return unsub;
  }, [subscribe, fetchProfile]);

  return {
    profile,
    isLoading,
    isUpdating,
    isUploading,
    uploadProgress,
    error,
    fetchProfile,
    updateProfile,
    uploadCV,
  };
}
