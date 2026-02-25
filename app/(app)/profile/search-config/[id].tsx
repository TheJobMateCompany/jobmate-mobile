import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

// TODO Phase 3 — Éditer une configuration de recherche
export default function EditSearchConfigScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Éditer config #{id} — Phase 3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { color: '#4F46E5', fontSize: 16, fontWeight: '600' },
});
