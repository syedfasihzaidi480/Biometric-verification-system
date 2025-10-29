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
import { apiFetch, apiFetchJson } from "@/utils/api";

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

      const response = await apiFetch("/api/voice/enroll", {
        method: "POST",
        body: formData,
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

  const handleContinue = async () => {
    if (!enrollmentComplete) return;
    try {
      await apiFetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          voice_verified: true,
        }),
      });
    } catch (error) {
      console.error("Failed to update user verification status:", error);
    } finally {
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
        <Text style={styles.headerTitle}>Voice Verification</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {!enrollmentComplete ? (
          <>
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Sample {currentSample} of {totalSamples}
              </Text>
              <View style={styles.dotsContainer}>
                {[1, 2, 3].map((num) => (
                  <View
                    key={num}
                    style={[
                      styles.dot,
                      completedSamples.includes(num) && styles.dotCompleted,
                      currentSample === num && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Instructions */}
            <View style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>
                Please read the following phrase clearly:
              </Text>
              <View style={styles.phraseBox}>
                <Text style={styles.phraseText}>{getCurrentQuestion()}</Text>
              </View>
            </View>

            {/* Recording Area */}
            <View style={styles.recordingArea}>
              {/* Recording Button */}
              <Animated.View
                style={[
                  styles.recordButtonContainer,
                  { transform: [{ scale: isRecording ? pulseAnimation : 1 }] },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.recordButton,
                    isRecording && styles.recordButtonActive,
                  ]}
                  onPress={isRecording ? processRecording : startRecording}
                  disabled={isProcessing}
                >
                  <Mic size={48} color="#FFFFFF" />
                </TouchableOpacity>
              </Animated.View>

              {/* Status Text */}
              <Text style={styles.statusText}>
                {isProcessing
                  ? "Processing..."
                  : isRecording
                    ? "Recording..."
                    : recordingDuration > 0
                      ? "Recording Complete"
                      : "Tap to Record"}
              </Text>

              {/* Duration */}
              {isRecording && (
                <Text style={styles.durationText}>
                  {Math.floor(recordingDuration / 60)}:
                  {(recordingDuration % 60).toString().padStart(2, "0")}
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => router.back()}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              {recordingDuration > 0 && !isRecording && (
                <TouchableOpacity
                  style={[styles.submitButton, isProcessing && styles.submitButtonDisabled]}
                  onPress={processRecording}
                  disabled={isProcessing}
                >
                  <Text style={styles.submitButtonText}>
                    {isProcessing ? "Processing..." : "Submit"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          /* Enrollment Complete */
          <View style={styles.completedContainer}>
            <View style={styles.completedIcon}>
              <CheckCircle size={80} color="#10B981" />
            </View>

            <Text style={styles.completedTitle}>
              Voice Verification Complete!
            </Text>

            <Text style={styles.completedSubtitle}>
              Your voice has been successfully enrolled
            </Text>

            {matchScore && (
              <View style={styles.scoreCard}>
                <Text style={styles.scoreLabel}>Match Score</Text>
                <Text style={styles.scoreValue}>
                  {Math.round(matchScore * 100)}%
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
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
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
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
    padding: 20,
  },
  progressContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  progressText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
    fontWeight: "500",
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E5E7EB",
  },
  dotCompleted: {
    backgroundColor: "#10B981",
  },
  dotActive: {
    backgroundColor: "#007AFF",
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  instructionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 20,
  },
  phraseBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  phraseText: {
    fontSize: 15,
    fontStyle: "italic",
    color: "#374151",
    textAlign: "center",
    lineHeight: 22,
  },
  recordingArea: {
    alignItems: "center",
    marginBottom: 40,
  },
  recordButtonContainer: {
    marginBottom: 20,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: "#EF4444",
    shadowColor: "#EF4444",
  },
  statusText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  durationText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#9CA3AF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#10B981",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  // Consent Modal Styles
  consentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  consentContent: {
    backgroundColor: "#FFFFFF",
    padding: 28,
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  consentTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 16,
  },
  consentMessage: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  consentCheckbox: {
    marginBottom: 24,
  },
  consentCheckboxText: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
  },
  consentButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  consentButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  // Completion Styles
  completedContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  completedIcon: {
    marginBottom: 30,
  },
  completedTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
  },
  completedSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 30,
  },
  scoreCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginBottom: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  scoreLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    fontWeight: "500",
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: "700",
    color: "#10B981",
  },
  continueButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
