import { View, Text, StyleSheet } from 'react-native';

// TODO Phase 2 — Formulaire inscription
export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Register — Phase 2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { color: '#4F46E5', fontSize: 18, fontWeight: '600' },
});
