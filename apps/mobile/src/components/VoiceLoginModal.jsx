import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { Mic, Square, X, CheckCircle } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { useTranslation } from '@/i18n/useTranslation';
import { apiFetch } from '@/utils/api';

/**
 * VoiceLoginModal Component
 * 
 * Handles voice-based authentication with two security questions:
 * 1. "What is your name?"
 * 2. "What is your date of birth?"
 * 
 * Verifies both voice biometric and answers to questions
 */
export default function VoiceLoginModal({ visible, onClose, identifier, onSuccess }) {
  const { t } = useTranslation();
  
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState(null);
  const [question1Verified, setQuestion1Verified] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Reset state when modal opens
      setCurrentQuestion(1);
      setQuestion1Verified(false);
      setAttemptsLeft(3);
    }
  }, [visible]);

  useEffect(() => {
    if (isRecording) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isRecording]);

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

  const getCurrentQuestionText = () => {
    if (currentQuestion === 1) {
      return t('voiceLogin.question1', { defaultValue: 'What is your full name?' });
    } else {
      return t('voiceLogin.question2', { defaultValue: 'What is your date of birth?' });
    }
  };

  const getCurrentInstructions = () => {
    if (currentQuestion === 1) {
      return t('voiceLogin.question1Instructions', { 
        defaultValue: 'Please say your full name clearly as it appears on your ID.' 
      });
    } else {
      return t('voiceLogin.question2Instructions', { 
        defaultValue: 'Please say your date of birth in the format: Month, Day, Year.' 
      });
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('permissions.microphone.title', { defaultValue: 'Microphone Permission' }),
          t('permissions.microphone.message', { defaultValue: 'We need access to your microphone for voice authentication.' })
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
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert(
        t('common.error', { defaultValue: 'Error' }),
        t('errors.audioRecording', { defaultValue: 'Failed to start audio recording.' })
      );
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      // Automatically verify after recording
      verifyVoice(uri);
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert(
        t('common.error', { defaultValue: 'Error' }),
        t('errors.audioRecording', { defaultValue: 'Failed to process audio recording.' })
      );
    }
  };

  const verifyVoice = async (uri) => {
    if (!uri) return;

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('audioFile', {
        uri: uri,
        type: 'audio/m4a',
        name: 'voice_login.m4a',
      });
      formData.append('identifier', identifier);
      formData.append('questionNumber', String(currentQuestion));

      const response = await apiFetch('/api/auth/voice-login', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data.verified) {
        // Question verified successfully
        if (currentQuestion === 1) {
          // First question passed, move to second question
          setQuestion1Verified(true);
          setCurrentQuestion(2);
          Alert.alert(
            t('voiceLogin.question1Success', { defaultValue: 'Great!' }),
            t('voiceLogin.question1NextStep', { defaultValue: 'First question verified. Now please answer the second question.' })
          );
        } else {
          // Both questions passed - authentication successful!
          Alert.alert(
            t('voiceLogin.authSuccess', { defaultValue: 'Success!' }),
            t('voiceLogin.authSuccessMessage', { defaultValue: 'Voice authentication successful!' }),
            [
              {
                text: t('common.ok', { defaultValue: 'OK' }),
                onPress: () => {
                  onSuccess(result.data.user);
                  onClose();
                },
              },
            ]
          );
        }
      } else {
        // Verification failed
        setAttemptsLeft(prev => prev - 1);
        
        const failureMessage = result.data?.message || t('voiceLogin.verificationFailed', { 
          defaultValue: 'Voice verification failed. Please try again.' 
        });

        if (attemptsLeft <= 1) {
          Alert.alert(
            t('voiceLogin.authFailed', { defaultValue: 'Authentication Failed' }),
            t('voiceLogin.maxAttemptsReached', { defaultValue: 'Maximum attempts reached. Please use password login.' }),
            [
              {
                text: t('common.ok', { defaultValue: 'OK' }),
                onPress: onClose,
              },
            ]
          );
        } else {
          Alert.alert(
            t('voiceLogin.authFailed', { defaultValue: 'Verification Failed' }),
            `${failureMessage}\n\n${t('voiceLogin.attemptsLeft', { attempts: attemptsLeft - 1, defaultValue: `${attemptsLeft - 1} attempts remaining` })}`,
            [
              {
                text: t('common.retry', { defaultValue: 'Try Again' }),
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error('Voice verification error:', error);
      Alert.alert(
        t('common.error', { defaultValue: 'Error' }),
        t('errors.network', { defaultValue: 'Network error. Please try again.' })
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {t('voiceLogin.title', { defaultValue: 'Voice Login' })}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, question1Verified && styles.progressDotCompleted]}>
              {question1Verified ? (
                <CheckCircle size={16} color="#10B981" />
              ) : (
                <Text style={styles.progressDotText}>1</Text>
              )}
            </View>
            <View style={[styles.progressLine, question1Verified && styles.progressLineCompleted]} />
            <View style={[
              styles.progressDot, 
              currentQuestion === 2 && styles.progressDotActive
            ]}>
              <Text style={styles.progressDotText}>2</Text>
            </View>
          </View>

          {/* Question */}
          <View style={styles.content}>
            <Text style={styles.questionLabel}>
              {t('voiceLogin.questionLabel', { 
                number: currentQuestion, 
                total: 2,
                defaultValue: `Question ${currentQuestion} of 2` 
              })}
            </Text>
            <Text style={styles.questionText}>
              {getCurrentQuestionText()}
            </Text>
            <Text style={styles.instructions}>
              {getCurrentInstructions()}
            </Text>

            {/* Recording Button */}
            <View style={styles.recordingContainer}>
              <Animated.View
                style={[
                  styles.recordingButton,
                  {
                    transform: [{ scale: isRecording ? pulseAnim : 1 }],
                    backgroundColor: isRecording ? '#EF4444' : '#007AFF',
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.recordingButtonInner}
                  onPress={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                >
                  {isRecording ? (
                    <Square size={36} color="#FFFFFF" fill="#FFFFFF" />
                  ) : (
                    <Mic size={36} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </Animated.View>

              <Text style={styles.recordingStatus}>
                {isProcessing
                  ? t('voiceLogin.processing', { defaultValue: 'Processing...' })
                  : isRecording
                  ? t('voiceLogin.recording', { defaultValue: 'Recording... Tap to stop' })
                  : t('voiceLogin.tapToRecord', { defaultValue: 'Tap to record' })}
              </Text>
            </View>

            {/* Attempts Counter */}
            <Text style={styles.attemptsText}>
              {t('voiceLogin.attemptsLeft', { 
                attempts: attemptsLeft,
                defaultValue: `${attemptsLeft} attempts remaining` 
              })}
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>
                {t('common.usePassword', { defaultValue: 'Use Password Instead' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 40,
  },
  progressDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: '#007AFF',
  },
  progressDotCompleted: {
    backgroundColor: '#D1FAE5',
  },
  progressDotText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  progressLineCompleted: {
    backgroundColor: '#10B981',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: 'center',
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  instructions: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  recordingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  recordingButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  recordingStatus: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  attemptsText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});

