import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from '../components/Button';
import { useVerificationStatus } from '../hooks/useVerificationStatus';

export default function DocumentUpload({ onUploaded }: { onUploaded?: (url: string) => void }) {
  const { markStepComplete, markAdminApproved } = useVerificationStatus();

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Document Upload</Text>
      <Text style={styles.sub}>Take a photo of your ID or upload from gallery.</Text>

      {/* TODO: integrate expo-image-picker */}
      <View style={styles.placeholder} />

      <Button
        label="Upload"
        onPress={() => {
          markStepComplete('document');
          markAdminApproved(true);
          onUploaded?.('https://example.com/id.jpg');
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
