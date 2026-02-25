import { View, Text, StyleSheet } from 'react-native';

// TODO Feed — Phase 4
export default function Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Feed — Phase 4</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { color: '#4F46E5', fontSize: 16, fontWeight: '600' },
});
