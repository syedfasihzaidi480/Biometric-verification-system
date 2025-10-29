import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/utils/auth/useAuth';
import { CheckCircle, Clock, Mic, Camera, FileText, ArrowRight } from 'lucide-react-native';

export default function VerifyScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, signIn } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      const result = await response.json();
      if (result.success) {
        setProfile(result.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationSteps = () => {
    if (!profile) {
      return [
        { id: 'voice', title: 'Voice Verification', status: 'not_started', description: 'My voice is my unique digital signature for secure authentication', route: '/voice-verification' },
        { id: 'face', title: 'Face Liveness Detection', status: 'not_started', description: 'Confirm your identity with facial recognition', route: '/face-verification' },
        { id: 'document', title: 'Document Verification', status: 'not_started', description: 'Upload and verify your identity document', route: '/document-verification' },
      ];
    }

    return [
      { 
        id: 'voice', 
        title: 'Voice Verification', 
        status: profile.voice_verified ? 'verified' : 'not_started', 
        description: 'My voice is my unique digital signature for secure authentication',
        route: '/voice-verification'
      },
      { 
        id: 'face', 
        title: 'Face Liveness Detection', 
        status: profile.face_verified ? 'verified' : (profile.voice_verified ? 'available' : 'not_started'), 
        description: 'Confirm your identity with facial recognition',
        route: '/face-verification'
      },
      { 
        id: 'document', 
        title: 'Document Verification', 
        status: profile.document_verified ? 'verified' : (profile.face_verified ? 'available' : 'not_started'), 
        description: 'Upload and verify your identity document',
        route: '/document-verification'
      },
    ];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle size={24} color="#10B981" />;
      case 'available':
        return <Clock size={24} color="#3B82F6" />;
      case 'in_progress':
        return <Clock size={24} color="#F59E0B" />;
      default:
        return <Clock size={24} color="#9CA3AF" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return '#10B981';
      case 'available':
        return '#3B82F6';
      case 'in_progress':
        return '#F59E0B';
      default:
        return '#9CA3AF';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'available':
        return 'Start Verification';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  const getStepIcon = (stepId) => {
    switch (stepId) {
      case 'voice':
        return <Mic size={20} color="#3B82F6" />;
      case 'face':
        return <Camera size={20} color="#3B82F6" />;
      case 'document':
        return <FileText size={20} color="#3B82F6" />;
      default:
        return null;
    }
  };

  const handleStepPress = (step) => {
    if (step.status === 'not_started' && step.id !== 'voice') {
      // Show message that previous steps need to be completed first
      return;
    }

    if (step.status === 'verified') {
      // Maybe show details or allow re-verification
      return;
    }

    // Navigate to the verification screen
    router.push(step.route);
  };

  const canStartVerification = () => {
    return isAuthenticated && profile && profile.profile_completed;
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        
        <Text style={styles.title}>Please Sign In</Text>
        <Text style={styles.subtitle}>You need to sign in to access verification</Text>
        
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
        <Text style={styles.loadingText}>Loading verification status...</Text>
      </View>
    );
  }

  if (!canStartVerification()) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        
        <Text style={styles.title}>Complete Profile First</Text>
        <Text style={styles.subtitle}>Please complete your profile registration before starting verification</Text>
        
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(tabs)/register')}
        >
          <Text style={styles.primaryButtonText}>Go to Registration</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const verificationSteps = getVerificationSteps();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Biometric Verification</Text>
        <Text style={styles.headerSubtitle}>Complete all verification steps</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Verification Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Progress</Text>
          
          <View style={styles.progressContainer}>
            {verificationSteps.map((step, index) => (
              <TouchableOpacity
                key={step.id}
                style={[
                  styles.stepCard,
                  step.status === 'not_started' && step.id !== 'voice' && styles.stepCardDisabled
                ]}
                onPress={() => handleStepPress(step)}
                disabled={step.status === 'not_started' && step.id !== 'voice'}
              >
                <View style={styles.stepHeader}>
                  <View style={styles.stepIconContainer}>
                    {getStepIcon(step.id)}
                  </View>
                  
                  <View style={styles.stepInfo}>
                    <View style={styles.stepTitleRow}>
                      <Text style={[
                        styles.stepTitle,
                        step.status === 'not_started' && step.id !== 'voice' && styles.stepTitleDisabled
                      ]}>
                        {step.title}
                      </Text>
                      {getStatusIcon(step.status)}
                    </View>
                    
                    <Text style={[
                      styles.stepDescription,
                      step.status === 'not_started' && step.id !== 'voice' && styles.stepDescriptionDisabled
                    ]}>
                      {step.description}
                    </Text>
                    
                    <View style={styles.stepActions}>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(step.status) + '20' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: getStatusColor(step.status) }
                        ]}>
                          {getStatusText(step.status)}
                        </Text>
                      </View>
                      
                      {(step.status === 'available' || (step.status === 'not_started' && step.id === 'voice')) && (
                        <ArrowRight size={16} color="#3B82F6" />
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Overall Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Status</Text>
          
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>Overall Progress</Text>
              <Text style={styles.statusPercentage}>
                {Math.round((verificationSteps.filter(s => s.status === 'verified').length / verificationSteps.length) * 100)}%
              </Text>
            </View>
            
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${(verificationSteps.filter(s => s.status === 'verified').length / verificationSteps.length) * 100}%` 
                  }
                ]}
              />
            </View>
            
            <Text style={styles.statusDescription}>
              {verificationSteps.filter(s => s.status === 'verified').length} of {verificationSteps.length} verifications completed
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsText}>
              • Complete verifications in order: Voice → Face → Document{'\n'}
              • Each step must be completed before the next unlocks{'\n'}
              • Ensure good lighting and audio quality{'\n'}
              • Have your ID document ready for the final step
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
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
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  progressContainer: {
    gap: 12,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  stepCardDisabled: {
    opacity: 0.5,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  stepTitleDisabled: {
    color: '#9CA3AF',
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  stepDescriptionDisabled: {
    color: '#D1D5DB',
  },
  stepActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  instructionsText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});