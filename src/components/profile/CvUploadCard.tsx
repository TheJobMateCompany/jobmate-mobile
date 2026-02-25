/**
 * CvUploadCard — Phase 3.5
 *
 * Carte d'upload CV :
 * - État initial  : bouton « Importer mon CV »
 * - État uploaded : chip filename + bouton « Remplacer »
 * - État analysis : spinner + texte « Analyse IA en cours… »
 * - État upload   : ProgressBar animée de 0 → 100%
 *
 * Ce composant est une vue pure — toute la logique est dans `useUploadCV`.
 * Le parent passe `cvUrl`, `isUploading`, `progress`, `onUpload`.
 *
 * Utilisé par :
 *   app/(app)/profile/index.tsx
 *   app/(app)/profile/edit.tsx
 */

import { View, Text, TouchableOpacity, ActivityIndicator, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { ProgressBar } from '@/components/ui/ProgressBar';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extrait le nom du fichier depuis une URL (dernier segment avant "?"). */
function fileNameFromUrl(url: string): string {
  const path = url.split('?')[0] ?? url;
  return path.split('/').pop() ?? 'cv.pdf';
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface CvUploadCardProps {
  /** URL du CV actuellement enregistré — null si pas encore uploadé */
  cvUrl: string | null;
  /** Upload en cours (picker → serveur) */
  isUploading: boolean;
  /** Progression 0→1 — utilisé pendant `isUploading` */
  progress: number;
  /** true quand le serveur analyse le CV (entre upload terminé et SSE CV_PARSED) */
  isAnalyzing?: boolean;
  /** Appelé quand l'utilisateur presse « Importer » ou « Remplacer » */
  onUpload: () => void;
  style?: ViewStyle;
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function CvUploadCard({
  cvUrl,
  isUploading,
  progress,
  isAnalyzing = false,
  onUpload,
  style,
}: CvUploadCardProps) {
  const { colors, spacing, radius, typography } = useTheme();

  const fileName = cvUrl ? fileNameFromUrl(cvUrl) : null;
  const isInteractive = !isUploading && !isAnalyzing;

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          padding: spacing.md,
          borderWidth: 1.5,
          borderColor: isUploading || isAnalyzing ? colors.primary : colors.border,
          borderStyle: cvUrl ? 'solid' : 'dashed',
          gap: spacing.sm,
        },
        style,
      ]}
    >
      {/* Label */}
      <Text style={[typography.label, { color: colors.textPrimary }]}>Curriculum Vitae</Text>

      {/* ── État : upload en cours ── */}
      {isUploading && (
        <View style={{ gap: spacing.xs }}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Envoi du fichier…
          </Text>
          <ProgressBar progress={progress} showLabel trackHeight={6} />
        </View>
      )}

      {/* ── État : analyse IA en cours ── */}
      {!isUploading && isAnalyzing && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[typography.caption, { color: colors.primary }]}>Analyse IA en cours…</Text>
        </View>
      )}

      {/* ── État : CV présent ── */}
      {!isUploading && !isAnalyzing && fileName && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.primaryLight,
            borderRadius: radius.full,
            paddingVertical: spacing.xs / 2,
            paddingHorizontal: spacing.sm,
            alignSelf: 'flex-start',
            gap: spacing.xs,
          }}
          accessibilityRole="text"
          accessibilityLabel={`Fichier CV : ${fileName}`}
        >
          {/* Icône PDF textuelle */}
          <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
            PDF
          </Text>
          <Text
            style={[typography.caption, { color: colors.primary, flexShrink: 1 }]}
            numberOfLines={1}
          >
            {fileName}
          </Text>
        </View>
      )}

      {/* ── État : pas de CV ── */}
      {!isUploading && !isAnalyzing && !fileName && (
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          Aucun CV importé — formats acceptés : PDF, max 10 Mo.
        </Text>
      )}

      {/* ── Bouton principal ── */}
      <TouchableOpacity
        onPress={onUpload}
        disabled={!isInteractive}
        accessibilityRole="button"
        accessibilityLabel={fileName ? 'Remplacer le CV' : 'Importer mon CV'}
        style={{
          alignSelf: 'flex-start',
          opacity: isInteractive ? 1 : 0.4,
        }}
      >
        <Text
          style={[
            typography.label,
            {
              color: colors.primary,
              borderWidth: 1.5,
              borderColor: colors.primary,
              borderRadius: radius.sm,
              paddingVertical: spacing.xs,
              paddingHorizontal: spacing.sm,
              overflow: 'hidden',
            },
          ]}
        >
          {fileName ? 'Remplacer' : 'Importer mon CV'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
