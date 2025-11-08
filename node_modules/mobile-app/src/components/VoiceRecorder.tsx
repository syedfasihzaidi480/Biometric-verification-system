import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Placeholder voice recorder component. In a real app, integrate expo-av.
// TODO: integrate expo-av Recording API, handle permissions, upload hooks.

type Props = {
  onRecorded?: (uri: string) => void;
};

export const VoiceRecorder: React.FC<Props> = ({ onRecorded }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (!isRecording) {
      setIsRecording(true);
      setDuration(0);
      // Fake timer
      setTimeout(() => setDuration(3), 300);
    } else {
      setIsRecording(false);
      onRecorded?.('file://fake/audio.m4a');
    }
  };

  return (
    <View style={styles.wrap}>
      {isRecording && <Text style={styles.time}>{duration}s</Text>}
      <TouchableOpacity style={[styles.btn, isRecording && styles.btnActive]} onPress={toggle}>
        <Text style={styles.btnText}>{isRecording ? 'Stop' : 'Record'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  time: { marginBottom: 12, fontSize: 18, fontWeight: '600' },
  btn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnActive: { backgroundColor: '#EF4444' },
  btnText: { color: '#fff', fontWeight: '700' }
});

export default VoiceRecorder;
