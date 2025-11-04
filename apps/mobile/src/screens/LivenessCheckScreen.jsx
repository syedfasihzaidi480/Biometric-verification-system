import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, RotateCw, CheckCircle } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { useTranslation } from '@/i18n/useTranslation';
import useUser from '@/utils/auth/useUser';
import { apiFetch } from '@/utils/api';

export default function LivenessCheckScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const cameraRef = useRef(null);
  const { user } = useUser();
  const params = useLocalSearchParams();
  const resolvedUserId = params?.userId || user?.id;

  const [permission, requestPermission] = useCameraPermissions();
  const [currentInstruction, setCurrentInstruction] = useState('ready');
  const [instructionStep, setInstructionStep] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConsent, setShowConsent] = useState(true);
  const [lastSelfieUri, setLastSelfieUri] = useState(null);

  const instructions = [
    { key: 'ready', duration: 3000 },
    { key: 'blink', duration: 2000 },
    { key: 'turnLeft', duration: 2000 },
    { key: 'turnRight', duration: 2000 },
    { key: 'lookStraight', duration: 2000 },
  ];

  useEffect(() => {
    if (permission && !permission.granted) {
      Alert.alert(
        t('permissions.camera.title'),
        t('permissions.camera.message'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('permissions.allowAccess'), onPress: () => requestPermission() },
          { text: t('permissions.openSettings'), onPress: () => Linking.openSettings() },
        ],
      );
    }
  }, [permission, t]);

  const handleConsent = () => {
    setShowConsent(false);
  };

  const startLivenessCheck = async () => {
    setIsCapturing(true);
    setInstructionStep(0);
    setCurrentInstruction(instructions[0].key);

    // Cycle through instructions
    for (let i = 0; i < instructions.length; i++) {
      setCurrentInstruction(instructions[i].key);
      setInstructionStep(i);
      
      await new Promise(resolve => setTimeout(resolve, instructions[i].duration));
      
      // Capture photo at key moments
      if (instructions[i].key === 'lookStraight') {
        const photo = await capturePhoto();
        if (photo?.uri) setLastSelfieUri(photo.uri);
      }
    }

    setIsCapturing(false);
    processLiveness();
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      console.log('Photo captured:', photo?.uri);
      return photo;
    } catch (error) {
      console.error('Error capturing photo:', error);
      return null;
    }
  };

  const processLiveness = async () => {
    setIsProcessing(true);

    try {
      if (!resolvedUserId) {
        throw new Error('Missing userId');
      }

      if (!lastSelfieUri) {
        // Fallback: capture one more photo
        const fallback = await capturePhoto();
        if (fallback?.uri) setLastSelfieUri(fallback.uri);
      }

      if (!lastSelfieUri) {
        throw new Error('No selfie captured');
      }

      // Read the image as base64 and send JSON payload
      const base64 = await FileSystem.readAsStringAsync(lastSelfieUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('[LivenessCheck] Sending liveness check with userId:', resolvedUserId);

      const res = await apiFetch('/api/liveness/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          userId: String(resolvedUserId),
          base64,
          mimeType: 'image/jpeg',
        },
      });
      const result = await res.json();

      if (result?.success) {
        try {
          // Mark face as verified locally so next step unlocks
          await apiFetch('/api/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: resolvedUserId, face_verified: true }),
          });
        } catch (_) {}

        Alert.alert(
          t('liveness.livenessSuccess'),
          '',
          [
            {
              text: t('common.continue'),
              onPress: () => router.push('/document-upload'),
            },
          ]
        );
      } else {
        Alert.alert(
          t('liveness.livenessFailed'),
          result?.error?.message || '',
          [
            {
              text: t('common.retry'),
              onPress: () => {
                setCurrentInstruction('ready');
                setInstructionStep(0);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Liveness processing error:', error);
      Alert.alert(t('common.error'), t('errors.network'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (showConsent) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('liveness.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.consentContainer}>
          <View style={styles.consentIcon}>
            <Camera size={48} color="#007AFF" />
          </View>
          
          <Text style={styles.consentTitle}>{t('liveness.consent.title')}</Text>
          <Text style={styles.consentMessage}>{t('liveness.consent.message')}</Text>
          
          <View style={styles.consentCheckbox}>
            <Text style={styles.consentCheckboxText}>
              {t('liveness.consent.understand')}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.consentButton}
            onPress={handleConsent}
          >
            <Text style={styles.consentButtonText}>{t('liveness.consent.agree')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.permissionText}>{t('permissions.camera.title')}</Text>
        <Text style={styles.permissionMessage}>{t('permissions.camera.message')}</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => requestPermission()}
        >
          <Text style={styles.permissionButtonText}>{t('permissions.allowAccess')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.permissionButton, styles.permissionButtonSecondary]}
          onPress={() => Linking.openSettings()}
        >
          <Text style={styles.permissionButtonText}>{t('permissions.openSettings')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.headerOverlay}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitleWhite}>{t('liveness.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Camera */}
      <CameraView
        style={styles.camera}
        facing="front"
        ref={cameraRef}
      >
        {/* Face outline overlay */}
        <View style={styles.overlay}>
          <View style={styles.faceOutline} />
        </View>

        {/* Instruction overlay */}
        <View style={styles.instructionOverlay}>
          <Text style={styles.instructionText}>
            {t(`liveness.instructions.${currentInstruction}`)}
          </Text>
          
          {isCapturing && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Step {instructionStep + 1} of {instructions.length}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${((instructionStep + 1) / instructions.length) * 100}%` },
                  ]}
                />
              </View>
            </View>
          )}
        </View>
      </CameraView>

      {/* Controls */}
      <View style={styles.controls}>
        {!isCapturing && !isProcessing && (
          <TouchableOpacity
            style={styles.captureButton}
            onPress={startLivenessCheck}
          >
            <Text style={styles.captureButtonText}>{t('liveness.takeSelfie')}</Text>
          </TouchableOpacity>
        )}

        {isProcessing && (
          <View style={styles.processingContainer}>
            <RotateCw size={24} color="#007AFF" />
            <Text style={styles.processingText}>{t('liveness.processing')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  headerOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 1,
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
  headerTitleWhite: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  consentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  consentIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  consentTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  consentMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  consentCheckbox: {
    marginBottom: 32,
  },
  consentCheckboxText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  consentButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 150,
  },
  consentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOutline: {
    width: 200,
    height: 250,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 100,
    backgroundColor: 'transparent',
  },
  instructionOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  instructionText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  captureButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 150,
  },
  captureButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionButtonSecondary: {
    backgroundColor: '#6B7280',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});