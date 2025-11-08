import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import VoiceRecorder from '../components/VoiceRecorder';
import Button from '../components/Button';

export default function LoginVoice({ onSuccess }: { onSuccess?: () => void }) {
  const onRecorded = () => {
    // Placeholder verify
    onSuccess?.();
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Voice Login</Text>
      <Text style={styles.sub}>Record a short phrase to verify.</Text>

      <VoiceRecorder onRecorded={() => onRecorded()} />
      <Button label="Verify" onPress={() => onRecorded()} style={{ marginTop: 16 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, gap: 12, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700' },
  sub: { color: '#6B7280' }
});
