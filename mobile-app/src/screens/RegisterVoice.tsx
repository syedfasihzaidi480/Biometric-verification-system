import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import VoiceRecorder from '../components/VoiceRecorder';
import Button from '../components/Button';
import { useVerificationStatus } from '../hooks/useVerificationStatus';

export default function RegisterVoice({ onComplete }: { onComplete?: (score: number) => void }) {
  const [current, setCurrent] = useState(1);
  const [samples, setSamples] = useState<string[]>([]);
  const total = 3;
  const { markStepComplete } = useVerificationStatus();

  const onRecorded = (uri: string) => {
    setSamples((s) => [...s, uri]);
    if (current >= total) {
      markStepComplete('voice');
      onComplete?.(0.93);
    } else {
      setCurrent((c) => c + 1);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Voice Enrollment</Text>
      <Text style={styles.sub}>Record 3 samples saying the displayed phrase.</Text>

      <View style={styles.card}>
        <Text style={styles.script}>This is sample {current} of {total}</Text>
      </View>

      <View style={styles.progress}><View style={[styles.progressFill, { width: `${(samples.length/total)*100}%` }]} /></View>

      <VoiceRecorder onRecorded={onRecorded} />

      {samples.length > 0 && (
        <Button
          label="Record again"
          onPress={() => {
            setSamples([]);
            setCurrent(1);
            markStepComplete('voice', false);
          }}
          style={{ marginTop: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, gap: 12, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700' },
  sub: { color: '#6B7280' },
  card: { padding: 16, borderRadius: 12, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  script: { textAlign: 'center', color: '#1F2937' },
  progress: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 2 }
});
