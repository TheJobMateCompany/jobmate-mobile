/**
 * JobCardSkeleton — Phase 4.2
 *
 * Placeholder shimmer d'une carte d'offre pendant le chargement initial.
 * Utilisé par app/(app)/feed/index.tsx (5 items affichés).
 *
 * Utilisé par :
 *   app/(app)/feed/index.tsx
 */

import { View, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Skeleton } from '@/components/ui/Skeleton';

export interface JobCardSkeletonProps {
  style?: ViewStyle;
}

export function JobCardSkeleton({ style }: JobCardSkeletonProps) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          gap: spacing.sm,
        },
        style,
      ]}
    >
      {/* Titre */}
      <Skeleton width="75%" height={20} borderRadius={4} />
      {/* Sous-titre */}
      <Skeleton width="50%" height={16} borderRadius={4} />
      {/* Lieu */}
      <Skeleton width="40%" height={14} borderRadius={4} />
      {/* Badges */}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4 }}>
        <Skeleton width={72} height={22} borderRadius={999} />
        <Skeleton width={60} height={22} borderRadius={999} />
      </View>
    </View>
  );
}

/** 5 skeletons empilés — utilisé pendant le chargement initial du feed */
export function JobCardSkeletonList() {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      {Array.from({ length: 5 }, (_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </View>
  );
}
