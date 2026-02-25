/**
 * Divider — ligne de séparation horizontale (ou verticale)
 * Phase 2.1
 */

import { View, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export interface DividerProps {
  /** Orientation (défaut : horizontal) */
  orientation?: 'horizontal' | 'vertical';
  /** Épaisseur en dp (défaut : 1) */
  thickness?: number;
  /** Couleur override (défaut : colors.border) */
  color?: string;
  style?: ViewStyle;
}

export function Divider({ orientation = 'horizontal', thickness = 1, color, style }: DividerProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        orientation === 'horizontal'
          ? { height: thickness, width: '100%' }
          : { width: thickness, alignSelf: 'stretch' },
        { backgroundColor: color ?? colors.border },
        style,
      ]}
    />
  );
}
