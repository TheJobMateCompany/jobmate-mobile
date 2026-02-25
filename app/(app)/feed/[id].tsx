import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

// TODO Phase 4 — Détail offre d'emploi (ScoreRing, lettre motivation, approve/reject)
export default function FeedDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Détail offre #{id} — Phase 4</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { color: '#4F46E5', fontSize: 16, fontWeight: '600' },
});
