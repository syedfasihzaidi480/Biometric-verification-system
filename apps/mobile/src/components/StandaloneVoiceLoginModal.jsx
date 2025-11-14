import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Mic, Square, X, CheckCircle, Mail, Phone } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useTranslation } from '@/i18n/useTranslation';
import { apiFetch } from '@/utils/api';
import PhoneNumberInput from './PhoneNumberInput';

/**
 * StandaloneVoiceLoginModal Component
 * 
 * Complete voice authentication from welcome screen without requiring
 * credentials to be entered beforehand.
 * 
 * Flow:
 * 1. User enters email or phone
 * 2. System looks up user
 * 3. User answers 2 voice questions (name + date of birth)
 * 4. System verifies voice + answers
 * 5. User is authenticated and logged in
 */
export default function StandaloneVoiceLoginModal({ visible, onClose, onSuccess }) {
  const { t } = useTranslation();
  
  const [step, setStep] = useState('identifier'); // 'identifier', 'question1', 'question2'
  const [identifierMode, setIdentifierMode] = useState('email'); // 'email' or 'phone'
  const [identifier, setIdentifier] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState(null);
  const [, setRecordingUri] = useState(null);
  const [question1Verified, setQuestion1Verified] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Reset state when modal opens
      setStep('identifier');
      setIdentifier('');
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

  const handleContinueWithIdentifier = () => {
    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier) {
      Alert.alert(
        t('voiceLogin.identifierRequired', { defaultValue: 'Required' }),
        t('voiceLogin.enterIdentifier', { 
          defaultValue: 'Please enter your email or phone number to continue.' 
        })
      );
      return;
    }

    // Validate format
    if (identifierMode === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedIdentifier)) {
        Alert.alert(
          t('common.error', { defaultValue: 'Error' }),
          t('login.validEmail', { defaultValue: 'Please enter a valid email address.' })
        );
        return;
      }
    } else {
      if (!phoneValid || !trimmedIdentifier) {
        Alert.alert(
          t('common.error', { defaultValue: 'Error' }),
          t('login.validPhone', { defaultValue: 'Please enter a valid phone number.' })
        );
        return;
      }
    }

    // Move to voice questions
    setStep('question1');
  };

  const startRecording = async () => {
    if (isProcessing || isRecording) {
      return;
    }

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('permissions.microphone.title', { defaultValue: 'Microphone Permission' }),
          t('permissions.microphone.message', { 
            defaultValue: 'We need access to your microphone for voice authentication.' 
          })
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
      setRecordingUri(uri);
      
      // Automatically verify after recording
      await verifyVoice(uri);
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
      const audioBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await apiFetch('/api/auth/voice-login', {
        method: 'POST',
        body: {
          identifier: identifier.trim(),
          questionNumber: currentQuestion,
          audioBase64,
          audioFormat: 'audio/m4a',
        },
      });

      let result = null;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.warn('Voice login response parsing failed:', jsonError);
      }

      const verified = response.ok && result?.success && result?.data?.verified;

      if (verified) {
        setRecordingUri(null);

        if (currentQuestion === 1) {
          setQuestion1Verified(true);
          setCurrentQuestion(2);
          setStep('question2');
          setAttemptsLeft(3);
          Alert.alert(
            t('voiceLogin.question1Success', { defaultValue: 'Great!' }),
            t('voiceLogin.question1NextStep', {
              defaultValue: 'First question verified. Now please answer the second question.',
            })
          );
        } else {
          setAttemptsLeft(3);
          Alert.alert(
            t('voiceLogin.authSuccess', { defaultValue: 'Success!' }),
            t('voiceLogin.authSuccessMessage', {
              defaultValue: 'Voice authentication successful!',
            }),
            [
              {
                text: t('common.ok', { defaultValue: 'OK' }),
                onPress: () => {
                  onSuccess?.(result?.data?.user);
                  onClose();
                },
              },
            ]
          );
        }
        return;
      }

      const errorPayload = result?.data || result?.error || {};
      const failureMessage =
        errorPayload.message ||
        t('voiceLogin.verificationFailed', {
          defaultValue: 'Voice verification failed. Please try again.',
        });

      if (errorPayload.needsEnrollment) {
        Alert.alert(
          t('voiceLogin.enrollmentRequiredTitle', { defaultValue: 'Voice Enrollment Required' }),
          failureMessage,
          [
            {
              text: t('voiceLogin.enrollNow', { defaultValue: 'Enroll Now' }),
              onPress: () => {
                setRecordingUri(null);
                onClose();
              },
            },
            {
              text: t('common.cancel', { defaultValue: 'Cancel' }),
              style: 'cancel',
            },
          ]
        );
        return;
      }

      const nextAttempts =
        typeof errorPayload.attemptsRemaining === 'number'
          ? Math.max(errorPayload.attemptsRemaining, 0)
          : Math.max(attemptsLeft - 1, 0);

      setAttemptsLeft(nextAttempts);

      if (nextAttempts <= 0) {
        Alert.alert(
          t('voiceLogin.authFailed', { defaultValue: 'Authentication Failed' }),
          t('voiceLogin.maxAttemptsReached', {
            defaultValue: 'Maximum attempts reached. Please use password login.',
          }),
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
          `${failureMessage}\n\n${t('voiceLogin.attemptsLeft', {
            attempts: nextAttempts,
            defaultValue: `${nextAttempts} attempts remaining`,
          })}`,
          [
            {
              text: t('common.retry', { defaultValue: 'Try Again' }),
            },
          ]
        );
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

  const renderIdentifierStep = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.content}
    >
      <Text style={styles.stepTitle}>
        {t('voiceLogin.enterIdentifierTitle', { 
          defaultValue: 'Sign in with Voice' 
        })}
      </Text>
      <Text style={styles.stepInstructions}>
        {t('voiceLogin.enterIdentifierInstructions', { 
          defaultValue: 'Enter your email or phone number to begin voice authentication.' 
        })}
      </Text>

      {/* Mode Toggle */}
      <View style={styles.modeToggleContainer}>
        <TouchableOpacity
          style={[styles.modeToggle, identifierMode === 'email' && styles.modeToggleActive]}
          onPress={() => {
            setIdentifierMode('email');
            setIdentifier('');
          }}
        >
          <Mail size={18} color={identifierMode === 'email' ? '#007AFF' : '#6B7280'} />
          <Text style={[
            styles.modeToggleText,
            identifierMode === 'email' && styles.modeToggleTextActive
          ]}>
            {t('login.email', { defaultValue: 'Email' })}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeToggle, identifierMode === 'phone' && styles.modeToggleActive]}
          onPress={() => {
            setIdentifierMode('phone');
            setIdentifier('');
          }}
        >
          <Phone size={18} color={identifierMode === 'phone' ? '#007AFF' : '#6B7280'} />
          <Text style={[
            styles.modeToggleText,
            identifierMode === 'phone' && styles.modeToggleTextActive
          ]}>
            {t('login.phone', { defaultValue: 'Phone' })}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input */}
      {identifierMode === 'email' ? (
        <View style={styles.inputContainer}>
          <Mail size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder={t('login.emailPlaceholder', { defaultValue: 'you@example.com' })}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoFocus
          />
        </View>
      ) : (
        <PhoneNumberInput
          value={identifier}
          onChangeText={setIdentifier}
          onValidationChange={setPhoneValid}
          placeholder={t('login.phonePlaceholder', { 
            defaultValue: 'Enter your phone number' 
          })}
        />
      )}

      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinueWithIdentifier}
      >
        <Text style={styles.continueButtonText}>
          {t('common.continue', { defaultValue: 'Continue' })}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );

  const renderVoiceQuestionStep = () => (
    <View style={styles.content}>
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
  );

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

          {/* Content based on step */}
          {step === 'identifier' && renderIdentifierStep()}
          {(step === 'question1' || step === 'question2') && renderVoiceQuestionStep()}

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
    maxHeight: '90%',
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
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepInstructions: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  modeToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  modeToggleActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#007AFF',
  },
  modeToggleText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  modeToggleTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 24,
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
  questionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
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

