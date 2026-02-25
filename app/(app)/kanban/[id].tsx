import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

// TODO Phase 5 — Détail candidature (statut, historique, notes, rappel relance)
export default function KanbanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Candidature #{id} — Phase 5</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { color: '#4F46E5', fontSize: 16, fontWeight: '600' },
});
