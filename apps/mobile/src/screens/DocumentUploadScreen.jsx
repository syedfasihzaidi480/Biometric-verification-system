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
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useTranslation } from '@/i18n/useTranslation';
import { apiFetch } from '@/utils/api';
import useUser from '@/utils/auth/useUser';

export default function DocumentUploadScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useUser();

  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
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
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setDocumentFile({
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || asset.uri.split('/').pop() || 'document.jpg',
        previewUri: asset.uri,
      });
    }
  };

  const selectFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('permissions.mediaLibrary.title'),
        t('permissions.mediaLibrary.message')
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setDocumentFile({
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || asset.uri.split('/').pop() || 'document.jpg',
        previewUri: asset.uri,
      });
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setDocumentFile({
        uri: asset.uri,
        mimeType: asset.mimeType || 'application/octet-stream',
        fileName: asset.name || 'document',
        previewUri: asset.mimeType?.startsWith('image/') ? asset.uri : null,
      });
    }
  };

  const uploadDocument = async () => {
    if (!selectedDocumentType) {
      Alert.alert(t('common.error'), t('document.selectDocumentType'));
      return;
    }

    if (!documentFile) {
      Alert.alert(t('common.error'), t('document.noFileSelected'));
      return;
    }

    setIsUploading(true);

    try {
  const fileInfo = await FileSystem.getInfoAsync(documentFile.uri);
      if (fileInfo?.size && fileInfo.size > 15 * 1024 * 1024) {
        Alert.alert(t('common.error'), t('document.fileTooLarge15'));
        return;
      }

      const base64Data = await FileSystem.readAsStringAsync(documentFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const result = await apiFetch('/api/document/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          documentType: selectedDocumentType,
          documentBase64: base64Data,
          documentMimeType: documentFile.mimeType,
          documentFileName: documentFile.fileName,
          userId: user?.id ? String(user.id) : undefined,
        },
      }).then((r) => r.json());

      if (result.success) {
        setExtractedData(result.data.extractedText);
        setTamperDetected(result.data.tamperDetected || result.data.tamperFlag);

        try {
          await apiFetch('/api/profile', {
            method: 'PUT',
            body: { document_verified: true },
          });
        } catch (updateError) {
          console.warn('Failed to update profile status after document upload', updateError);
        }

        router.replace({
          pathname: '/verification-submitted',
          params: {
            requestId: result.data?.verificationRequestId || '',
            tamper: (result.data?.tamperDetected || result.data?.tamperFlag) ? 'true' : 'false',
          },
        });
        return;
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
          <Text style={styles.instructionsTitle}>{t('document.tipsTitle')}</Text>
          <Text style={styles.instructionItem}>• {t('document.instructions.position')}</Text>
          <Text style={styles.instructionItem}>• {t('document.instructions.lighting')}</Text>
          <Text style={styles.instructionItem}>• {t('document.instructions.clear')}</Text>
          <Text style={styles.instructionItem}>• {t('document.instructions.flat')}</Text>
        </View>

        {/* Image Capture/Display */}
        <View style={styles.section}>
          {documentFile ? (
            <View style={styles.imagePreviewContainer}>
              {documentFile.previewUri ? (
                <Image source={{ uri: documentFile.previewUri }} style={styles.imagePreview} />
              ) : (
                <View style={styles.filePreviewPlaceholder}>
                  <Upload size={32} color="#6B7280" />
                  <Text style={styles.fileNameText}>{documentFile.fileName}</Text>
                </View>
              )}
              <View style={styles.imageOverlay}>
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={() => setDocumentFile(null)}
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
                  <Text style={styles.captureFrameText}>{t('document.instructions.position')}</Text>
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
                <TouchableOpacity
                  style={[styles.captureButton, styles.libraryButton]}
                  onPress={pickDocument}
                >
                  <Upload size={24} color="#007AFF" />
                  <Text style={[styles.captureButtonText, { color: '#007AFF' }]}>
                    {t('document.browseFiles', { defaultValue: 'Browse Files' })}
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
      {documentFile && selectedDocumentType && (
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
  filePreviewPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  fileNameText: {
    marginTop: 8,
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
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