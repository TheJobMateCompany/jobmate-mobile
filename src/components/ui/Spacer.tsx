/**
 * Spacer — espace vide configurable
 * Phase 2.1
 *
 * Si `flex` est vrai, le Spacer prend tout l'espace restant (flex: 1).
 * Sinon il utilise `size` en dp (vertical par défaut, horizontal si `axis='x'`).
 */

import { View } from 'react-native';

export interface SpacerProps {
  /** Taille fixe en dp (ignoré si flex=true) */
  size?: number;
  /** Axe (défaut : 'y' = vertical) */
  axis?: 'x' | 'y';
  /** Prendre tout l'espace disponible (flex: 1) */
  flex?: boolean;
}

export function Spacer({ size = 16, axis = 'y', flex = false }: SpacerProps) {
  if (flex) {
    return <View style={{ flex: 1 }} />;
  }

  return <View style={axis === 'y' ? { height: size } : { width: size }} />;
}
