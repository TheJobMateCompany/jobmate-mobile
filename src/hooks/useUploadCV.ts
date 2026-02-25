/**
 * useUploadCV — Phase 3.4
 *
 * Responsabilités :
 * - `pickAndUpload()` → ouvre `expo-document-picker` (PDF uniquement, max 10 Mo)
 *   → valide le fichier → upload via `gqlUpload(UPLOAD_CV_MUTATION, ...)`
 * - Souscription SSE `CV_PARSED` → déclenche le callback `onParsed(cvUrl)` fourni
 *   par le consommateur (typiquement `fetchProfile()` depuis `useProfile`)
 * - Expose `progress` (0 → 1, valeurs discrètes — fetch React Native ne supporte
 *   pas les événements de progression XHR)
 *
 * Pourquoi un hook séparé de useProfile ?
 *   `useProfile` orchestre le cycle de vie *complet* du profil (fetch, update, SSE).
 *   `useUploadCV` encapsule uniquement le tunnel picker → upload → notification SSE,
 *   ce qui permet à `CvUploadCard.tsx` d'être autonome sans dépendre de tout le profil.
 *
 * Utilisé par :
 *   src/components/profile/CvUploadCard.tsx
 *   app/(app)/profile/index.tsx
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { useSSE } from './useSSE';
import { gqlUpload } from '@/lib/graphql/client';
import { UPLOAD_CV_MUTATION } from '@/lib/graphql/mutations';
import { mapApiError } from '@/lib/errors';

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadCVResponse {
  uploadCV: {
    cvUrl: string;
    message: string;
  };
}

/**
 * Payload reçu via SSE `CV_PARSED`.
 * Le backend émet l'URL du CV analysé dans l'événement.
 */
interface CvParsedPayload {
  cvUrl?: string;
}

export interface UseUploadCVOptions {
  /**
   * Appelé lorsque le SSE `CV_PARSED` est reçu avec l'URL du CV.
   * Typiquement : `() => fetchProfile()` depuis le composant parent.
   */
  onParsed?: (cvUrl: string) => void;
}

export interface UseUploadCVReturn {
  /** URL du CV uploadé, mise à jour après upload ET après SSE CV_PARSED */
  cvUrl: string | null;
  /**
   * Indicateur de progression upload : 0 → 1.
   * Valeurs discrètes (fetch ne diffuse pas de progress events en React Native) :
   *   0.0 = repos, 0.1 = début envoi, 1.0 = terminé
   */
  progress: number;
  isUploading: boolean;
  error: string | null;
  /**
   * Ouvre le sélecteur de fichier, valide le PDF, lance l'upload.
   * @returns l'URL du CV ou null si annulé / erreur de validation
   * @throws si l'upload HTTP échoue (pour que l'écran puisse afficher une alerte)
   */
  pickAndUpload: () => Promise<string | null>;
  /** Remet l'état à zéro (utile lors du démontage du composant) */
  reset: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUploadCV(options?: UseUploadCVOptions): UseUploadCVReturn {
  const { subscribe } = useSSE();

  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref stable pour éviter que le changement de `options` re-subscribes au SSE
  const onParsedRef = useRef(options?.onParsed);
  useEffect(() => {
    onParsedRef.current = options?.onParsed;
  });

  // ─── Souscription SSE CV_PARSED ────────────────────────────────────────────

  useEffect(() => {
    const unsub = subscribe('CV_PARSED', (data) => {
      const payload = data as CvParsedPayload;
      const parsedUrl = payload?.cvUrl ?? null;
      if (parsedUrl) {
        setCvUrl(parsedUrl);
        onParsedRef.current?.(parsedUrl);
      }
    });
    return unsub;
  }, [subscribe]);

  // ─── Picker + validation + upload ─────────────────────────────────────────

  const pickAndUpload = useCallback(async (): Promise<string | null> => {
    // Évite les appels concurrents
    if (isUploading) return null;

    setError(null);

    // 1. Ouvrir le sélecteur de documents
    const pickerResult = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf'],
      copyToCacheDirectory: true,
    });

    // Annulation explicite de l'utilisateur
    if (pickerResult.canceled || !pickerResult.assets?.length) {
      return null;
    }

    const asset = pickerResult.assets[0];

    // 2. Validation du type MIME
    if (asset.mimeType && asset.mimeType !== 'application/pdf') {
      setError('Format invalide — seuls les fichiers PDF sont acceptés.');
      return null;
    }

    // 3. Validation de la taille (expo-document-picker expose `size` en octets)
    if (asset.size !== undefined && asset.size !== null && asset.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (asset.size / (1024 * 1024)).toFixed(1);
      setError(`Fichier trop volumineux (${sizeMb} Mo — max 10 Mo).`);
      return null;
    }

    // 4. Upload multipart via gqlUpload
    setIsUploading(true);
    setProgress(0.1); // Indique le début de l'envoi

    try {
      const data = await gqlUpload<UploadCVResponse>(
        UPLOAD_CV_MUTATION,
        asset.uri,
        'application/pdf',
        { file: null }, // requis par graphql-multipart-request-spec
      );

      setProgress(1);
      setCvUrl(data.uploadCV.cvUrl);
      return data.uploadCV.cvUrl;
    } catch (err) {
      setProgress(0);
      setError(mapApiError(err));
      throw err; // Permet à l'écran d'afficher une alerte ou un snackbar
    } finally {
      setIsUploading(false);
    }
  }, [isUploading]);

  // ─── Reset ─────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setCvUrl(null);
    setProgress(0);
    setError(null);
  }, []);

  return { cvUrl, progress, isUploading, error, pickAndUpload, reset };
}
