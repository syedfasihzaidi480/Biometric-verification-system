import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Mic, Square, RotateCcw, CheckCircle, Volume2 } from 'lucide-react-native';
import { Audio } from 'expo-audio';
import { useTranslation } from '@/i18n/useTranslation';

export default function VoiceVerificationScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { userId, userName, dateOfBirth, returnUrl = "/dashboard" } = useLocalSearchParams();
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [matchScore, setMatchScore] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(3);
  
  const recording = useRef(null);
  const durationInterval = useRef(null);
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // Get today's date in a readable format
  const getTodaysDate = () => {
    const today = new Date();
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString('en-US', options);
  };

  // Generate a random verification phrase (from the 3 questions)
  const getVerificationPhrase = () => {
    const phrases = [
      `My name is ${userName}`,
      `My date of birth is ${dateOfBirth}`,
      `Today's date is ${getTodaysDate()}`
    ];
    
    const randomIndex = Math.floor(Math.random() * phrases.length);
    return phrases[randomIndex];
  };

  const [verificationPhrase] = useState(getVerificationPhrase());

  useEffect(() => {
    // Request audio permissions on mount
    requestPermissions();
    
    return () => {
      stopRecording();
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isRecording]);

  const requestPermissions = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(
          t('permissions.microphone.title'),
          t('permissions.microphone.message'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('permissions.allowAccess'), onPress: requestPermissions }
          ]
        );
      }
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    Animated.timing(pulseAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recording.current = newRecording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      durationInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert(
        t('common.error'),
        t('errors.audioRecording')
      );
    }
  };

  const stopRecording = async () => {
    if (!recording.current) return;

    try {
      setIsRecording(false);
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      recording.current = null;

      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return null;
    }
  };

  const processRecording = async () => {
    const audioUri = await stopRecording();
    if (!audioUri) {
      Alert.alert(t('common.error'), t('errors.audioRecording'));
      return;
    }

    setIsProcessing(true);
    setAttempts(prev => prev + 1);

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('expectedPhrase', verificationPhrase);
      formData.append('audioFile', {
        uri: audioUri,
        type: 'audio/m4a',
        name: `voice_verification.m4a`,
      });

      const response = await fetch('/api/voice/verify', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      if (result.success) {
        const { verified, matchScore: score } = result.data;
        
        if (verified) {
          setVerificationComplete(true);
          setMatchScore(score);
          
          // Update user verification status
          await updateUserVerificationStatus();
        } else {
          if (attempts >= maxAttempts) {
            Alert.alert(
              'Verification Failed',
              'Maximum attempts reached. Please try again later or contact support.',
              [
                { text: 'OK', onPress: () => router.back() }
              ]
            );
          } else {
            Alert.alert(
              'Voice Not Recognized',
              `Voice verification failed. Please try again. ${maxAttempts - attempts} attempts remaining.`,
              [{ text: 'Try Again' }]
            );
          }
        }
      } else {
        Alert.alert(
          t('common.error'), 
          result.error?.message || 'Verification failed. Please try again.'
        );
      }
    } catch (error) {
      console.error('Failed to process recording:', error);
      Alert.alert(
        t('common.error'),
        t('errors.network')
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const updateUserVerificationStatus = async () => {
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          voice_verified: true
        }),
      });
    } catch (error) {
      console.error('Failed to update user verification status:', error);
    }
  };

  const retryVerification = () => {
    setRecordingDuration(0);
    setMatchScore(null);
  };

  const handleContinue = () => {
    if (verificationComplete) {
      router.push(returnUrl);
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
        <Text style={styles.headerTitle}>
          Voice Verification
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!verificationComplete ? (
          <>
            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <View style={styles.iconContainer}>
                <Volume2 size={48} color="#007AFF" />
              </View>
              <Text style={styles.title}>
                Voice ID Verification
              </Text>
              <Text style={styles.subtitle}>
                Verify your identity with your voice
              </Text>
              <Text style={styles.instructions}>
                Please say the following phrase clearly:
              </Text>
            </View>

            {/* Verification Phrase */}
            <View style={styles.phraseContainer}>
              <Text style={styles.phraseText}>
                "{verificationPhrase}"
              </Text>
            </View>

            {/* Attempts Remaining */}
            {attempts > 0 && attempts < maxAttempts && (
              <View style={styles.attemptsContainer}>
                <Text style={styles.attemptsText}>
                  {maxAttempts - attempts} attempts remaining
                </Text>
              </View>
            )}

            {/* Recording Controls */}
            <View style={styles.recordingContainer}>
              {/* Duration Display */}
              {(isRecording || recordingDuration > 0) && (
                <Text style={styles.durationText}>
                  {Math.floor(recordingDuration / 60)}:
                  {(recordingDuration % 60).toString().padStart(2, '0')}
                </Text>
              )}

              {/* Recording Button */}
              <Animated.View 
                style={[
                  styles.recordButton,
                  { transform: [{ scale: isRecording ? pulseAnimation : 1 }] }
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.recordButtonInner,
                    isRecording && styles.recordButtonActive
                  ]}
                  onPress={isRecording ? processRecording : startRecording}
                  disabled={isProcessing || attempts >= maxAttempts}
                >
                  {isRecording ? (
                    <Square size={32} color="#FFFFFF" />
                  ) : (
                    <Mic size={32} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Control Text */}
              <Text style={styles.recordText}>
                {isProcessing 
                  ? 'Verifying your voice...'
                  : isRecording 
                    ? 'Tap to stop and verify'
                    : attempts >= maxAttempts
                      ? 'Maximum attempts reached'
                      : 'Tap to start verification'
                }
              </Text>

              {/* Retry Button */}
              {recordingDuration > 0 && !isRecording && !isProcessing && attempts < maxAttempts && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={retryVerification}
                >
                  <RotateCcw size={20} color="#007AFF" />
                  <Text style={styles.retryText}>
                    Record Again
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          /* Verification Complete */
          <View style={styles.completedContainer}>
            <View style={styles.completedIcon}>
              <CheckCircle size={64} color="#10B981" />
            </View>
            
            <Text style={styles.completedTitle}>
              Voice Verified Successfully!
            </Text>
            
            {matchScore && (
              <Text style={styles.matchScoreText}>
                Match Score: {Math.round(matchScore * 100)}%
              </Text>
            )}
            
            <Text style={styles.verifiedText}>
              Your identity has been verified. You can now proceed.
            </Text>
            
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  instructionsContainer: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  instructions: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  phraseContainer: {
    margin: 24,
    padding: 24,
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
  },
  phraseText: {
    fontSize: 18,
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },
  attemptsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  attemptsText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
  },
  recordingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  durationText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  recordButton: {
    marginBottom: 20,
  },
  recordButtonInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recordButtonActive: {
    backgroundColor: '#EF4444',
  },
  recordText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
  },
  // Completion Styles
  completedContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  completedIcon: {
    marginBottom: 24,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  matchScoreText: {
    fontSize: 18,
    color: '#10B981',
    marginBottom: 8,
    fontWeight: '500',
  },
  verifiedText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});