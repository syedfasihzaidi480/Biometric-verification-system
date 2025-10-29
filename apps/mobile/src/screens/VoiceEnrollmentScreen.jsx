import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Animated,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Mic,
  Square,
  RotateCcw,
  CheckCircle,
} from "lucide-react-native";
import { Audio } from "expo-audio";
import { useTranslation } from "@/i18n/useTranslation";
import { useUpload } from "@/utils/useUpload";

export default function VoiceEnrollmentScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { userId, userName, dateOfBirth } = useLocalSearchParams();
  const [upload, { loading: uploadLoading }] = useUpload();

  const [currentSample, setCurrentSample] = useState(1);
  const [totalSamples] = useState(3);
  const [sessionToken, setSessionToken] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showConsent, setShowConsent] = useState(true);
  const [completedSamples, setCompletedSamples] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [enrollmentComplete, setEnrollmentComplete] = useState(false);
  const [matchScore, setMatchScore] = useState(null);

  const recording = useRef(null);
  const durationInterval = useRef(null);
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // Get today's date in a readable format
  const getTodaysDate = () => {
    const today = new Date();
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return today.toLocaleDateString("en-US", options);
  };

  // Get the current question based on sample number
  const getCurrentQuestion = () => {
    switch (currentSample) {
      case 1:
        return `What is your full name? Please say: ${userName}`;
      case 2:
        return `What is your date of birth? Please say: ${dateOfBirth}`;
      case 3:
        return `What is today's date? Please say: ${getTodaysDate()}`;
      default:
        return `Please read clearly: ${userName}`;
    }
  };

  // Get the expected answer for validation
  const getExpectedAnswer = () => {
    switch (currentSample) {
      case 1:
        return userName;
      case 2:
        return dateOfBirth;
      case 3:
        return getTodaysDate();
      default:
        return userName;
    }
  };

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
      if (permission.status !== "granted") {
        Alert.alert(
          t("permissions.microphone.title"),
          t("permissions.microphone.message"),
          [
            { text: t("common.cancel"), style: "cancel" },
            { text: t("permissions.allowAccess"), onPress: requestPermissions },
          ],
        );
      }
    } catch (error) {
      console.error("Permission request failed:", error);
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
      ]),
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
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      recording.current = newRecording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      durationInterval.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert(t("common.error"), t("errors.audioRecording"));
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
      console.error("Failed to stop recording:", error);
      return null;
    }
  };

  const processRecording = async () => {
    const audioUri = await stopRecording();
    if (!audioUri) {
      Alert.alert(t("common.error"), t("errors.audioRecording"));
      return;
    }

    setIsProcessing(true);

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("questionNumber", currentSample);
      formData.append("expectedAnswer", getExpectedAnswer());
      formData.append("audioFile", {
        uri: audioUri,
        type: "audio/m4a",
        name: `voice_sample_${currentSample}.m4a`,
      });
      if (sessionToken) {
        formData.append("sessionToken", sessionToken);
      }

      const response = await fetch("/api/voice/enroll", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const result = await response.json();

      if (result.success) {
        const {
          sessionToken: newToken,
          isComplete,
          matchScore: score,
        } = result.data;

        if (!sessionToken) {
          setSessionToken(newToken);
        }

        setCompletedSamples((prev) => [...prev, currentSample]);

        if (isComplete) {
          setEnrollmentComplete(true);
          setMatchScore(score);
        } else {
          setCurrentSample((prev) => prev + 1);
        }
      } else {
        Alert.alert(
          t("common.error"),
          result.error?.message ||
            "Voice recording quality is too low. Please try again in a quiet environment.",
        );
      }
    } catch (error) {
      console.error("Failed to process recording:", error);
      Alert.alert(t("common.error"), t("errors.network"));
    } finally {
      setIsProcessing(false);
    }
  };

  const retryCurrentSample = () => {
    setRecordingDuration(0);
    // Don't increment current sample, just allow re-recording
  };

  const handleContinue = () => {
    if (enrollmentComplete) {
      router.push({
        pathname: "/liveness-check",
        params: { userId },
      });
    }
  };

  const handleConsentAgree = () => {
    setShowConsent(false);
  };

  const renderConsentModal = () => (
    <Modal
      visible={showConsent}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.consentContainer}>
        <View style={styles.consentContent}>
          <Text style={styles.consentTitle}>
            {t("voiceEnrollment.consent.title")}
          </Text>

          <Text style={styles.consentMessage}>
            {t("voiceEnrollment.consent.message")}
          </Text>

          <View style={styles.consentCheckbox}>
            <Text style={styles.consentCheckboxText}>
              {t("voiceEnrollment.consent.understand")}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.consentButton}
            onPress={handleConsentAgree}
          >
            <Text style={styles.consentButtonText}>
              {t("voiceEnrollment.consent.agree")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (showConsent) {
    return renderConsentModal();
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
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("voiceEnrollment.title")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!enrollmentComplete ? (
          <>
            {/* Progress */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {t("voiceEnrollment.sample")} {currentSample}{" "}
                {t("voiceEnrollment.of")} {totalSamples}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(completedSamples.length / totalSamples) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.subtitle}>
                Record your voice for Voice ID verification
              </Text>
              <Text style={styles.instructions}>
                Please answer the following question clearly and loudly:
              </Text>
            </View>

            {/* Question Text */}
            <View style={styles.scriptContainer}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionLabel}>
                  Question {currentSample} of {totalSamples}
                </Text>
              </View>
              <Text style={styles.scriptText}>{getCurrentQuestion()}</Text>
            </View>

            {/* Recording Controls */}
            <View style={styles.recordingContainer}>
              {/* Duration Display */}
              {(isRecording || recordingDuration > 0) && (
                <Text style={styles.durationText}>
                  {Math.floor(recordingDuration / 60)}:
                  {(recordingDuration % 60).toString().padStart(2, "0")}
                </Text>
              )}

              {/* Recording Button */}
              <Animated.View
                style={[
                  styles.recordButton,
                  { transform: [{ scale: isRecording ? pulseAnimation : 1 }] },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.recordButtonInner,
                    isRecording && styles.recordButtonActive,
                  ]}
                  onPress={isRecording ? processRecording : startRecording}
                  disabled={isProcessing}
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
                  ? t("voiceEnrollment.processing")
                  : isRecording
                    ? t("voiceEnrollment.stopRecording")
                    : t("voiceEnrollment.startRecording")}
              </Text>

              {/* Retry Button */}
              {recordingDuration > 0 && !isRecording && !isProcessing && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={retryCurrentSample}
                >
                  <RotateCcw size={20} color="#007AFF" />
                  <Text style={styles.retryText}>
                    {t("voiceEnrollment.recordAgain")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          /* Enrollment Complete */
          <View style={styles.completedContainer}>
            <View style={styles.completedIcon}>
              <CheckCircle size={64} color="#10B981" />
            </View>

            <Text style={styles.completedTitle}>
              {t("voiceEnrollment.enrollmentComplete")}
            </Text>

            {matchScore && (
              <Text style={styles.matchScoreText}>
                {t("voiceEnrollment.matchScore", {
                  score: Math.round(matchScore * 100),
                })}
              </Text>
            )}

            <Text style={styles.qualityText}>
              {matchScore > 0.8
                ? t("voiceEnrollment.qualityGood")
                : t("voiceEnrollment.qualityPoor")}
            </Text>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>
                {t("common.continue")}
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
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
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
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  progressText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    textAlign: "center",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },
  instructionsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
  },
  instructions: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  scriptContainer: {
    margin: 24,
    padding: 20,
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  questionHeader: {
    marginBottom: 12,
    alignItems: "center",
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  scriptText: {
    fontSize: 16,
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 24,
  },
  recordingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  durationText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 20,
  },
  recordButton: {
    marginBottom: 20,
  },
  recordButtonInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recordButtonActive: {
    backgroundColor: "#EF4444",
  },
  recordText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#007AFF",
  },
  // Consent Modal Styles
  consentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  consentContent: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  consentTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 16,
  },
  consentMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  consentCheckbox: {
    marginBottom: 24,
  },
  consentCheckboxText: {
    fontSize: 14,
    color: "#374151",
  },
  consentButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  consentButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Completion Styles
  completedContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  completedIcon: {
    marginBottom: 24,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 16,
  },
  matchScoreText: {
    fontSize: 18,
    color: "#10B981",
    marginBottom: 8,
  },
  qualityText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 32,
  },
  continueButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
