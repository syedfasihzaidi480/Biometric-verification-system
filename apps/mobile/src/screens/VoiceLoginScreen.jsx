import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
  StyleSheet,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Mic, Play, Square } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { useTranslation } from '@/i18n/useTranslation';
import { apiFetch } from '@/utils/api';
import useUser from '@/utils/auth/useUser';

export default function VoiceLoginScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useUser();
  
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [recordingUri, setRecordingUri] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
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
        duration: 500,
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
          t('permissions.microphone.title'),
          t('permissions.microphone.message'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('permissions.openSettings'),
              onPress: () => Linking.openSettings(),
            },
          ]
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
      Alert.alert(t('common.error'), t('errors.audioRecording'));
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

  const verifyVoice = async () => {
    if (!recordingUri) {
      Alert.alert(t('common.error'), t('voiceLogin.recordFirst'));
      return;
    }

    setIsVerifying(true);

    try {
      const formData = new FormData();
      formData.append('audioFile', {
        uri: recordingUri,
        type: 'audio/m4a',
        name: 'voice_verification.m4a',
      });
      if (user?.id) formData.append('userId', String(user.id));

      const response = await apiFetch('/api/voice/verify', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data.isMatch) {
        Alert.alert(
          t('voiceLogin.verificationSuccess'),
          `${t('voiceLogin.matchScore')}: ${(result.data.matchScore * 100).toFixed(1)}%`,
          [
            {
              text: t('common.continue'),
              onPress: () => router.push('/liveness-check'),
            },
          ]
        );
      } else {
        setAttemptsLeft(prev => prev - 1);
        if (attemptsLeft <= 1) {
          Alert.alert(
            t('voiceLogin.verificationFailed'),
            t('voiceLogin.maxAttemptsReached'),
            [
              {
                text: t('common.ok'),
                onPress: () => router.back(),
              },
            ]
          );
        } else {
          Alert.alert(
            t('voiceLogin.verificationFailed'),
            t('voiceLogin.attemptsLeft', { attempts: attemptsLeft - 1 }),
            [
              {
                text: t('common.retry'),
                onPress: () => {
                  setRecordingUri(null);
                  setIsPlaying(false);
                },
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error('Voice verification error:', error);
      Alert.alert(t('common.error'), t('errors.network'));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('voiceLogin.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>{t('voiceLogin.subtitle')}</Text>

        {/* Voice Script */}
        <View style={styles.scriptContainer}>
          <Text style={styles.instructionsLabel}>{t('voiceLogin.instructions')}</Text>
          <Text style={styles.scriptText}>{t('voiceLogin.loginScript')}</Text>
        </View>

        {/* Recording Visualization */}
        <View style={styles.recordingContainer}>
          <Animated.View
            style={[
              styles.recordingButton,
              {
                transform: [{ scale: isRecording ? pulseAnim : 1 }],
                backgroundColor: isRecording ? '#FF4444' : '#007AFF',
              },
            ]}
          >
            <TouchableOpacity
              style={styles.recordingButtonInner}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isVerifying}
            >
              {isRecording ? (
                <Square size={32} color="#FFFFFF" fill="#FFFFFF" />
              ) : (
                <Mic size={32} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Wave visualization */}
          {isRecording && (
            <View style={styles.waveContainer}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.waveLine,
                    {
                      height: waveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [10, Math.random() * 40 + 20],
                      }),
                    },
                  ]}
                />
              ))}
            </View>
          )}

          <Text style={styles.recordingStatus}>
            {isRecording
              ? t('voiceLogin.tapToStop')
              : recordingUri
              ? t('voiceLogin.readyForVerification')
              : t('voiceLogin.tapToStart')}
          </Text>
        </View>

        {/* Attempts Left */}
        <Text style={styles.attemptsText}>
          {t('voiceLogin.attemptsLeft', { attempts: attemptsLeft })}
        </Text>

        {/* Controls */}
        {recordingUri && !isRecording && (
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, styles.playButton]}
              onPress={playRecording}
              disabled={isPlaying || isVerifying}
            >
              <Play size={20} color="#007AFF" />
              <Text style={styles.controlButtonText}>
                {isPlaying ? t('voiceLogin.playing') : t('voiceLogin.playRecording')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.retryButton]}
              onPress={() => {
                setRecordingUri(null);
                setIsPlaying(false);
              }}
              disabled={isVerifying}
            >
              <Mic size={20} color="#666" />
              <Text style={[styles.controlButtonText, { color: '#666' }] }>
                {t('voiceEnrollment.recordAgain')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Verify Button */}
      {recordingUri && !isRecording && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.verifyButton,
              isVerifying && styles.verifyButtonDisabled,
            ]}
            onPress={verifyVoice}
            disabled={isVerifying}
          >
            <Text style={styles.verifyButtonText}>
              {isVerifying ? t('common.loading') : t('voiceLogin.startVerification')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  scriptContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
    width: '100%',
  },
  instructionsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  scriptText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  recordingContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  recordingButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  recordingButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 50,
    marginBottom: 20,
  },
  waveLine: {
    width: 4,
    backgroundColor: '#007AFF',
    marginHorizontal: 2,
    borderRadius: 2,
  },
  recordingStatus: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  attemptsText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 24,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  playButton: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F9FF',
  },
  retryButton: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  controlButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  verifyButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});