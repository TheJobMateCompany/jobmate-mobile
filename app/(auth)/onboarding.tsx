import { View, Text, StyleSheet } from 'react-native';

// TODO Phase 2 — Onboarding screens (pager-view + animations Lottie)
export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Onboarding — Phase 2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5' },
  text: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
