import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/utils/auth/useAuth';
import useUser from '@/utils/auth/useUser';
import { ChevronDown, Upload, CheckCircle, User, Phone, Calendar } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import KeyboardAvoidingAnimatedView from '@/components/KeyboardAvoidingAnimatedView';
import { apiFetch, apiFetchJson } from '@/utils/api';
import DateInput from '@/components/DateInput';
import { useTranslation } from '@/i18n/useTranslation';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, signIn } = useAuth();
  const { data: authUser } = useUser();
  const { t } = useTranslation();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [idDocumentType, setIdDocumentType] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  const documentTypes = [
    { value: 'national_id', label: t('document.documentTypes.national_id') },
    { value: 'passport', label: t('document.documentTypes.passport') },
    { value: 'drivers_license', label: t('document.documentTypes.drivers_license') },
  ];

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const result = await apiFetchJson('/api/profile');
      if (result?.success && result.user) {
        const user = result.user;
        setProfile(user);
        setFullName(user.name || '');
        setMobileNumber(user.phone || '');
        setDateOfBirth(user.date_of_birth ? formatDate(user.date_of_birth) : '');
        // Note: ID document type would need to be stored separately or inferred
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const handleDocumentPicker = () => {
    Alert.alert(
      t('document.title'),
      t('document.subtitle'),
      [
        {
          text: t('document.takePhoto'),
          onPress: openCamera,
        },
        {
          text: t('document.selectFromLibrary'),
          onPress: openGallery,
        },
        {
          text: t('document.browseFiles'),
          onPress: openDocumentPicker,
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('permissions.camera.title'), t('permissions.camera.message'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedDocument({
        uri: result.assets[0].uri,
        name: `document_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('permissions.mediaLibrary.title'), t('permissions.mediaLibrary.message'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedDocument({
        uri: result.assets[0].uri,
        name: result.assets[0].fileName || `document_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
    }
  };

  const openDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedDocument({
          uri: result.assets[0].uri,
          name: result.assets[0].name,
          type: result.assets[0].mimeType,
        });
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('document.uploadFailed'));
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert(t('common.error'), t('registration.nameRequired'));
      return;
    }
    if (!mobileNumber.trim()) {
      Alert.alert(t('common.error'), t('registration.phoneRequired'));
      return;
    }
    if (!dateOfBirth.trim()) {
      Alert.alert(t('common.error'), t('registration.dateRequired'));
      return;
    }

    // If document is selected, document type is required
    if (selectedDocument && !idDocumentType) {
      Alert.alert('Error', 'Please select an ID document type before uploading');
      return;
    }

    // Validate date format (DD/MM/YYYY)
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dateRegex.test(dateOfBirth)) {
      Alert.alert(t('common.error'), t('registration.dateFormat'));
      return;
    }

    // Prevent future DOBs (optional rule)
    try {
      const [d, m, y] = dateOfBirth.split('/').map((v) => parseInt(v, 10));
      const dob = new Date(y, m - 1, d);
      const today = new Date();
      if (isFinite(dob.getTime()) && dob > today) {
        Alert.alert(t('common.error'), t('registration.dateFormat'));
        return;
      }
    } catch {}

    setSaving(true);
    
    try {
      // Convert date format for API (YYYY-MM-DD)
      const [day, month, year] = dateOfBirth.split('/');
      const apiDate = `${year}-${month}-${day}`;

      const updateData = {
        name: fullName.trim(),
        phone: mobileNumber.trim(),
        date_of_birth: apiDate,
        profile_completed: true,
      };

      const result = await apiFetchJson('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: updateData,
      });
      
      if (result.success) {
        setProfile(result.user);
        
        // Upload document if selected
        if (selectedDocument) {
          try {
            await uploadDocument();
            Alert.alert(t('common.success'), t('profile.updated'), [
              { text: t('common.ok') }
            ]);
          } catch (docError) {
            console.error('Document upload failed:', docError);
            Alert.alert(t('common.error'), t('document.uploadFailed'));
          }
        } else {
          Alert.alert(t('common.success'), t('profile.updated'), [
            { text: t('common.ok') }
          ]);
        }
      } else {
        Alert.alert(t('common.error'), result.error || t('errors.server'));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert(t('common.error'), t('errors.network'));
    } finally {
      setSaving(false);
    }
  };

  const uploadDocument = async () => {
    try {
      console.log('[Upload] Starting document upload:', selectedDocument.name);
      console.log('[Upload] Document type:', idDocumentType);
      
      // Validate document type is set
      if (!idDocumentType || idDocumentType.trim() === '') {
        throw new Error('document_type_required');
      }
      
      // Read the file as base64 using expo-file-system
      const base64 = await FileSystem.readAsStringAsync(selectedDocument.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('[Upload] File read as base64, length:', base64.length);

      // Send as JSON with base64
      const uploadResult = await apiFetchJson('/api/document/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          documentBase64: base64,
          documentType: idDocumentType.trim(),
          documentMimeType: selectedDocument.type,
          documentFileName: selectedDocument.name,
        },
      });

      if (!uploadResult.success) {
        throw new Error(uploadResult.error?.message || 'Document upload failed');
      }
      
      console.log('[Upload] Document uploaded successfully:', uploadResult.document?.id);
    } catch (error) {
      console.error('[Upload] Document upload error:', error);
      throw error; // Re-throw so we can inform the user
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        
        <Text style={styles.title}>{t('auth.signInRequired')}</Text>
        <Text style={styles.subtitle}>{t('auth.pleaseSignInToRegister')}</Text>
        
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => signIn()}
        >
          <Text style={styles.primaryButtonText}>{t('auth.signIn')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('home.completeProfileRegistration')}</Text>
          <Text style={styles.headerSubtitle}>{t('verify.subtitle')}</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Personal Information Card */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>{t('registration.personalInformation')}</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('registration.fullName')}</Text>
              <View style={styles.inputContainer}>
                <User size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder={profile?.name || t('registration.fullNamePlaceholder')}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('registration.phoneNumber')} *</Text>
              <View style={styles.inputContainer}>
                <Phone size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  placeholder={t('registration.phoneNumberPlaceholder')}
                  keyboardType="phone-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('registration.dateOfBirth')} *</Text>
              <View style={styles.inputContainer}>
                <Calendar size={18} color="#9CA3AF" style={styles.inputIcon} />
                <DateInput value={dateOfBirth} onChangeText={setDateOfBirth} />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('registration.idDocumentType')}</Text>
              <View style={styles.documentTypeRow}>
                {documentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.documentTypeButton,
                      idDocumentType === type.value && styles.documentTypeButtonActive
                    ]}
                    onPress={() => setIdDocumentType(type.value)}
                  >
                    <Text style={[
                      styles.documentTypeText,
                      idDocumentType === type.value && styles.documentTypeTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Document Upload Card */}
          <View style={styles.uploadCard}>
            <Text style={styles.cardTitle}>{t('registration.idDocumentUpload')}</Text>
            
            <TouchableOpacity
              style={styles.uploadArea}
              onPress={handleDocumentPicker}
            >
              {selectedDocument ? (
                <View style={styles.uploadedDocument}>
                  <CheckCircle size={24} color="#10B981" />
                  <Text style={styles.uploadedText}>{t('registration.documentSelected')}</Text>
                  <Text style={styles.fileName}>{selectedDocument.name}</Text>
                </View>
              ) : (
                <View style={styles.uploadPrompt}>
                  <Upload size={32} color="#9CA3AF" />
                  <Text style={styles.uploadText}>{t('registration.tapToUploadId')}</Text>
                  <Text style={styles.uploadSubtext}>
                    {t('registration.supportedFormats')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>{t('registration.saveProfile')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  // Card styles
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  documentTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  documentTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  documentTypeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#EFF6FF',
  },
  documentTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  documentTypeTextActive: {
    color: '#007AFF',
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  uploadPrompt: {
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  uploadedDocument: {
    alignItems: 'center',
  },
  uploadedText: {
    fontSize: 16,
    color: '#10B981',
    marginTop: 8,
    fontWeight: '500',
  },
  fileName: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});