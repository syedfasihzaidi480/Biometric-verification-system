import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/utils/auth/useAuth';
import { ArrowLeft, Mic, Play, Square, CheckCircle } from 'lucide-react-native';
import { Audio } from 'expo-audio';

export default function VoiceVerificationScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  const verificationScript = "My voice is my unique digital signature for secure authentication";

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.setValue(1);
  };

  const startWaveAnimation = () => {
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      })
    ).start();
  };

  const stopWaveAnimation = () => {
    waveAnim.setValue(0);
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Microphone permission is required for voice verification'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      startPulseAnimation();
      startWaveAnimation();
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    stopPulseAnimation();
    stopWaveAnimation();

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const playRecording = async () => {
    if (!recordingUri) return;

    try {
      setIsPlaying(true);
      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
      await sound.playAsync();
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          sound.unloadAsync();
        }
      });
    } catch (err) {
      console.error('Failed to play recording', err);
      setIsPlaying(false);
    }
  };

  const submitVerification = async () => {
    if (!recordingUri) {
      Alert.alert('Error', 'Please record your voice first');
      return;
    }

    setIsVerifying(true);

    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: recordingUri,
        type: 'audio/m4a',
        name: 'voice_verification.m4a',
      });

      const response = await fetch('/api/voice/verify', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      if (result.success && result.data.isMatch) {
        // Update user profile to mark voice as verified
        await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            voice_verified: true,
          }),
        });

        setIsCompleted(true);
        
        setTimeout(() => {
          Alert.alert(
            'Voice Verification Complete!',
            `Match Score: ${(result.data.matchScore * 100).toFixed(1)}%\n\nYou can now proceed to Face Liveness Detection.`,
            [
              {
                text: 'Continue to Face Verification',
                onPress: () => router.replace('/face-verification'),
              },
              {
                text: 'Back to Verification',
                onPress: () => router.back(),
                style: 'cancel',
              },
            ]
          );
        }, 1000);
      } else {
        Alert.alert(
          'Verification Failed',
          'Voice verification did not match. Please try again.',
          [
            {
              text: 'Try Again',
              onPress: () => {
                setRecordingUri(null);
                setIsPlaying(false);
              },
            },
            {
              text: 'Cancel',
              onPress: () => router.back(),
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      console.error('Voice verification error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const getWaveHeight = (index) => {
    return waveAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 20 + Math.random() * 40],
    });
  };

  if (!isAuthenticated) {
    router.replace('/(tabs)');
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Verification</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Script Section */}
        <View style={styles.scriptSection}>
          <Text style={styles.instructionTitle}>Please read the following phrase:</Text>
          <View style={styles.scriptContainer}>
            <Text style={styles.scriptText}>"{verificationScript}"</Text>
          </View>
        </View>

        {/* Recording Visualization */}
        <View style={styles.recordingSection}>
          <Animated.View
            style={[
              styles.recordingButton,
              {
                transform: [{ scale: isRecording ? pulseAnim : 1 }],
                backgroundColor: isCompleted ? '#10B981' : (isRecording ? '#EF4444' : '#3B82F6'),
              },
            ]}
          >
            <TouchableOpacity
              style={styles.recordingButtonInner}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isVerifying || isCompleted}
            >
              {isCompleted ? (
                <CheckCircle size={40} color="#FFFFFF" />
              ) : isRecording ? (
                <Square size={32} color="#FFFFFF" fill="#FFFFFF" />
              ) : (
                <Mic size={32} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Wave visualization */}
          {isRecording && (
            <View style={styles.waveContainer}>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.waveLine,
                    {
                      height: getWaveHeight(i),
                    },
                  ]}
                />
              ))}
            </View>
          )}

          <Text style={styles.recordingStatus}>
            {isCompleted 
              ? 'Recording Complete' 
              : isRecording
              ? 'Recording...'
              : recordingUri
              ? 'Recording captured - ready to submit'
              : 'Tap to start recording'
            }
          </Text>
        </View>

        {/* Controls */}
        {recordingUri && !isRecording && !isCompleted && (
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={playRecording}
              disabled={isPlaying || isVerifying}
            >
              <Play size={16} color="#3B82F6" />
              <Text style={styles.playButtonText}>
                {isPlaying ? 'Playing...' : 'Play Recording'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setRecordingUri(null);
                setIsPlaying(false);
              }}
              disabled={isVerifying}
            >
              <Text style={styles.retryButtonText}>Record Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Submit Button */}
      {recordingUri && !isRecording && !isCompleted && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isVerifying && styles.submitButtonDisabled,
            ]}
            onPress={submitVerification}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Verification</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  scriptSection: {
    width: '100%',
    marginBottom: 48,
  },
  instructionTitle: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  scriptContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  scriptText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#1F2937',
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  recordingButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    marginBottom: 20,
    gap: 3,
  },
  waveLine: {
    width: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    opacity: 0.8,
  },
  recordingStatus: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  playButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});