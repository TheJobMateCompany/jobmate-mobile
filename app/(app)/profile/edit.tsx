import { View, Text, StyleSheet } from 'react-native';

// TODO Éditer profil — Phase 3
export default function Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Éditer profil — Phase 3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { color: '#4F46E5', fontSize: 16, fontWeight: '600' },
});
