import { View, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

// TODO Paramètres — Phase 7
export default function Screen() {
  const { colors, typography } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}
    >
      <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
        Paramètres — bientôt disponible
      </Text>
    </View>
  );
}
