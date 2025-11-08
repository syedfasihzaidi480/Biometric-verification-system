import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from '../components/Button';
import { useVerificationStatus } from '../hooks/useVerificationStatus';

export default function LivenessCamera({ onDone }: { onDone?: (live: boolean) => void }) {
  const { markStepComplete } = useVerificationStatus();

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Liveness Check</Text>
      <Text style={styles.sub}>Center your face and follow the prompts.</Text>

      {/* TODO: integrate expo-camera with prompts */}
      <View style={styles.placeholder} />

      <Button
        label="Start"
        onPress={() => {
          markStepComplete('face');
          onDone?.(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, gap: 12, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700' },
  sub: { color: '#6B7280' },
  placeholder: { height: 220, backgroundColor: '#F3F4F6', borderRadius: 12 }
});
