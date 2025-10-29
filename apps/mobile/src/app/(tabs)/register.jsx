import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/utils/auth/useAuth';
import useUser from '@/utils/auth/useUser';
import { ChevronDown, Upload, CheckCircle, User, Phone, Calendar } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import KeyboardAvoidingAnimatedView from '@/components/KeyboardAvoidingAnimatedView';
import { apiFetch, apiFetchJson } from '@/utils/api';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, signIn } = useAuth();
  const { data: authUser } = useUser();
  
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
    { value: 'cnic', label: 'CNIC' },
    { value: 'passport', label: 'Passport' },
    { value: 'license', label: 'License' },
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
      'Select Document',
      'Choose how you want to upload your ID document',
      [
        {
          text: 'Camera',
          onPress: openCamera,
        },
        {
          text: 'Gallery',
          onPress: openGallery,
        },
        {
          text: 'Files',
          onPress: openDocumentPicker,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      Alert.alert('Permission needed', 'Gallery permission is required to select photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleSave = async () => {
    if (!fullName.trim() || !mobileNumber.trim() || !dateOfBirth.trim() || !idDocumentType) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate date format (DD/MM/YYYY)
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dateRegex.test(dateOfBirth)) {
      Alert.alert('Error', 'Please enter date in DD/MM/YYYY format');
      return;
    }

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
        // TODO: Upload document if selected
        if (selectedDocument) {
          await uploadDocument();
        }
        
        setProfile(result.user);
        Alert.alert(
          'Success',
          'Profile updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to verify tab or home
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const uploadDocument = async () => {
    try {
      const formData = new FormData();
      formData.append('document', selectedDocument);
      formData.append('documentType', idDocumentType);

      const response = await apiFetch('/api/document/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Document upload failed');
      }
    } catch (error) {
      console.error('Document upload error:', error);
      // Don't fail the entire save for document upload issues
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        
        <Text style={styles.title}>Please Sign In</Text>
        <Text style={styles.subtitle}>You need to sign in to complete profile registration</Text>
        
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => signIn()}
        >
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile Registration</Text>
          <Text style={styles.headerSubtitle}>Complete your profile to begin verification</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Personal Information Card */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <User size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder={profile?.name || 'Fasih'}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mobile Number *</Text>
              <View style={styles.inputContainer}>
                <Phone size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  placeholder="Enter your mobile number"
                  keyboardType="phone-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Date of Birth *</Text>
              <View style={styles.inputContainer}>
                <Calendar size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>ID Document Type</Text>
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
            <Text style={styles.cardTitle}>ID Document Upload</Text>
            
            <TouchableOpacity
              style={styles.uploadArea}
              onPress={handleDocumentPicker}
            >
              {selectedDocument ? (
                <View style={styles.uploadedDocument}>
                  <CheckCircle size={24} color="#10B981" />
                  <Text style={styles.uploadedText}>Document Selected</Text>
                  <Text style={styles.fileName}>{selectedDocument.name}</Text>
                </View>
              ) : (
                <View style={styles.uploadPrompt}>
                  <Upload size={32} color="#9CA3AF" />
                  <Text style={styles.uploadText}>Tap to upload your ID document</Text>
                  <Text style={styles.uploadSubtext}>
                    Supported formats: JPG, PNG, PDF
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
              <Text style={styles.saveButtonText}>Save Profile</Text>
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