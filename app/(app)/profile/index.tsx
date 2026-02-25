import { View, Text, StyleSheet } from 'react-native';

// TODO Profil — Phase 3
export default function Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profil — Phase 3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { color: '#4F46E5', fontSize: 16, fontWeight: '600' },
});
