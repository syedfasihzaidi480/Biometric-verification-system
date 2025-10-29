import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Camera, ImageIcon, CheckCircle, Upload, RotateCw } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from '@/i18n/useTranslation';

export default function DocumentUploadScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [documentImage, setDocumentImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [tamperDetected, setTamperDetected] = useState(false);

  const documentTypes = [
    { key: 'id_card', label: t('document.documentTypes.id_card') },
    { key: 'passport', label: t('document.documentTypes.passport') },
    { key: 'drivers_license', label: t('document.documentTypes.drivers_license') },
    { key: 'national_id', label: t('document.documentTypes.national_id') },
    { key: 'other', label: t('document.documentTypes.other') },
  ];

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('permissions.camera.title'),
        t('permissions.camera.message')
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.8,
    });

    if (!result.canceled) {
      setDocumentImage(result.assets[0]);
    }
  };

  const selectFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photo library to select a document image.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.8,
    });

    if (!result.canceled) {
      setDocumentImage(result.assets[0]);
    }
  };

  const uploadDocument = async () => {
    if (!selectedDocumentType) {
      Alert.alert(t('common.error'), t('document.selectDocumentType'));
      return;
    }

    if (!documentImage) {
      Alert.alert(t('common.error'), 'Please capture or select a document image');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('document', {
        uri: documentImage.uri,
        type: 'image/jpeg',
        name: 'document.jpg',
      });
      formData.append('documentType', selectedDocumentType);
      formData.append('userId', '1'); // Should come from user context

      const response = await fetch('/api/document/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      if (result.success) {
        setExtractedData(result.data.extractedText);
        setTamperDetected(result.data.tamperFlag);
        
        Alert.alert(
          t('document.uploadSuccess'),
          tamperDetected ? t('document.tamperDetected') : '',
          [
            {
              text: t('common.continue'),
              onPress: () => router.push('/dashboard'),
            },
          ]
        );
      } else {
        Alert.alert(t('common.error'), result.error?.message || t('document.uploadFailed'));
      }
    } catch (error) {
      console.error('Document upload error:', error);
      Alert.alert(t('common.error'), t('errors.network'));
    } finally {
      setIsUploading(false);
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
        <Text style={styles.headerTitle}>{t('document.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle */}
        <Text style={styles.subtitle}>{t('document.subtitle')}</Text>

        {/* Document Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('document.selectDocumentType')}</Text>
          <View style={styles.documentTypeGrid}>
            {documentTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.documentTypeButton,
                  selectedDocumentType === type.key && styles.documentTypeButtonSelected,
                ]}
                onPress={() => setSelectedDocumentType(type.key)}
              >
                <Text
                  style={[
                    styles.documentTypeText,
                    selectedDocumentType === type.key && styles.documentTypeTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Tips for best results:</Text>
          <Text style={styles.instructionItem}>• {t('document.instructions.position')}</Text>
          <Text style={styles.instructionItem}>• {t('document.instructions.lighting')}</Text>
          <Text style={styles.instructionItem}>• {t('document.instructions.clear')}</Text>
          <Text style={styles.instructionItem}>• {t('document.instructions.flat')}</Text>
        </View>

        {/* Image Capture/Display */}
        <View style={styles.section}>
          {documentImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: documentImage.uri }} style={styles.imagePreview} />
              <View style={styles.imageOverlay}>
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={() => setDocumentImage(null)}
                >
                  <Text style={styles.retakeButtonText}>{t('document.retakePhoto')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.captureContainer}>
              <View style={styles.captureFrame}>
                <View style={styles.captureFrameInner}>
                  <ImageIcon size={48} color="#D1D5DB" />
                  <Text style={styles.captureFrameText}>Position document here</Text>
                </View>
              </View>
              
              <View style={styles.captureButtons}>
                <TouchableOpacity
                  style={[styles.captureButton, styles.cameraButton]}
                  onPress={takePhoto}
                >
                  <Camera size={24} color="#FFFFFF" />
                  <Text style={styles.captureButtonText}>{t('document.takePhoto')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.captureButton, styles.libraryButton]}
                  onPress={selectFromLibrary}
                >
                  <ImageIcon size={24} color="#007AFF" />
                  <Text style={[styles.captureButtonText, { color: '#007AFF' }]}>
                    {t('document.selectFromLibrary')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Extracted Data Display */}
        {extractedData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('document.extractedText')}</Text>
            <View style={styles.extractedDataContainer}>
              <Text style={styles.extractedDataText}>{extractedData}</Text>
              {tamperDetected && (
                <View style={styles.tamperWarning}>
                  <Text style={styles.tamperWarningText}>{t('document.tamperDetected')}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Upload Button */}
      {documentImage && selectedDocumentType && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              isUploading && styles.uploadButtonDisabled,
            ]}
            onPress={uploadDocument}
            disabled={isUploading}
          >
            {isUploading ? (
              <View style={styles.uploadingContainer}>
                <RotateCw size={20} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>{t('document.processing')}</Text>
              </View>
            ) : (
              <View style={styles.uploadContainer}>
                <Upload size={20} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>{t('document.uploadDocument')}</Text>
              </View>
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  documentTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  documentTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    minWidth: '48%',
    alignItems: 'center',
  },
  documentTypeButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F9FF',
  },
  documentTypeText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  documentTypeTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  instructionsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  captureContainer: {
    alignItems: 'center',
  },
  captureFrame: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  captureFrameInner: {
    alignItems: 'center',
  },
  captureFrameText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  captureButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  cameraButton: {
    backgroundColor: '#007AFF',
  },
  libraryButton: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  captureButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  retakeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retakeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  extractedDataContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  extractedDataText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  tamperWarning: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  tamperWarningText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  uploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});