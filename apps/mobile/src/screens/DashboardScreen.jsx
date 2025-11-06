import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  User, 
  Mic, 
  Camera, 
  FileText,
  Settings,
  Bell,
  Shield
} from 'lucide-react-native';
import { useTranslation } from '@/i18n/useTranslation';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [userProfile, setUserProfile] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Mock user data - replace with actual API call
      setUserProfile({
        id: 1,
        name: 'John Doe',
        phone: '+1-555-0123',
        email: 'john@example.com',
        createdAt: '2025-01-01T00:00:00Z',
      });

      setVerificationStatus({
        status: 'pending', // pending, approved, rejected
        voiceEnrollment: true,
        voiceVerification: true,
        livenessCheck: true,
        documentUpload: true,
        submittedAt: '2025-01-15T12:00:00Z',
        notes: null,
      });

      setCompletedSteps([
        'voiceEnrollment',
        'voiceVerification', 
        'livenessCheck',
        'documentUpload'
      ]);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'pending':
      default:
        return '#F59E0B';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={24} color="#10B981" />;
      case 'rejected':
        return <XCircle size={24} color="#EF4444" />;
      case 'pending':
      default:
        return <Clock size={24} color="#F59E0B" />;
    }
  };

  const getStatusText = (status) => {
    return t(`dashboard.status.${status}`);
  };

  const verificationSteps = [
    {
      key: 'voiceEnrollment',
      label: t('dashboard.steps.voiceEnrollment'),
      icon: <Mic size={20} color="#007AFF" />,
      route: '/voice-enrollment',
    },
    {
      key: 'voiceVerification',
      label: t('dashboard.steps.voiceVerification'),
      icon: <Shield size={20} color="#007AFF" />,
      route: '/voice-login',
    },
    {
      key: 'livenessCheck',
      label: t('dashboard.steps.livenessCheck'),
      icon: <Camera size={20} color="#007AFF" />,
      route: '/liveness-check',
    },
    {
      key: 'documentUpload',
      label: t('dashboard.steps.documentUpload'),
      icon: <FileText size={20} color="#007AFF" />,
      route: '/document-upload',
    },
  ];

  const isStepCompleted = (stepKey) => completedSteps.includes(stepKey);
  const allStepsCompleted = verificationSteps.every(step => isStepCompleted(step.key));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <User size={24} color="#FFFFFF" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>
              {t('dashboard.welcome', { name: userProfile?.name || 'User' })}
            </Text>
            <Text style={styles.phoneText}>{userProfile?.phone}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Settings size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Verification Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>{t('dashboard.verificationStatus')}</Text>
            {getStatusIcon(verificationStatus?.status)}
          </View>
          
          <Text style={[styles.statusText, { color: getStatusColor(verificationStatus?.status) }]}>
            {getStatusText(verificationStatus?.status)}
          </Text>

          {verificationStatus?.status === 'pending' && allStepsCompleted && (
            <View style={styles.pendingMessage}>
              <Text style={styles.pendingMessageText}>
                {t('dashboard.pendingReviewMessage')}
              </Text>
            </View>
          )}

          {verificationStatus?.status === 'rejected' && verificationStatus?.notes && (
            <View style={styles.rejectionMessage}>
              <Text style={styles.rejectionMessageTitle}>{t('dashboard.rejectionReason')}</Text>
              <Text style={styles.rejectionMessageText}>{verificationStatus.notes}</Text>
            </View>
          )}
        </View>

        {/* Completed Steps */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>{t('dashboard.completedSteps')}</Text>
          
          <View style={styles.stepsList}>
            {verificationSteps.map((step) => {
              const completed = isStepCompleted(step.key);
              return (
                <TouchableOpacity
                  key={step.key}
                  style={styles.stepItem}
                  onPress={() => !completed && router.push(step.route)}
                  disabled={completed}
                >
                  <View style={styles.stepIcon}>
                    {step.icon}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      completed && styles.stepLabelCompleted,
                    ]}
                  >
                    {step.label}
                  </Text>
                  <View style={styles.stepStatus}>
                    {completed ? (
                      <CheckCircle size={20} color="#10B981" />
                    ) : (
                      <View style={styles.stepIncomplete} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quick Actions */}
        {(!allStepsCompleted || verificationStatus?.status === 'rejected') && (
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>{t('dashboard.quickActions')}</Text>
            
            {!allStepsCompleted && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  const nextStep = verificationSteps.find(step => !isStepCompleted(step.key));
                  if (nextStep) {
                    router.push(nextStep.route);
                  }
                }}
              >
                <Text style={styles.actionButtonText}>
                  {t('dashboard.startVerification')}
                </Text>
              </TouchableOpacity>
            )}

            {verificationStatus?.status === 'rejected' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.retryButton]}
                onPress={() => {
                  // Reset verification and start over
                  router.push('/voice-enrollment');
                }}
              >
                <Text style={styles.actionButtonText}>{t('dashboard.retryVerification')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Account Information */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('dashboard.accountInfo')}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('dashboard.labels.name')}</Text>
            <Text style={styles.infoValue}>{userProfile?.name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('dashboard.labels.phone')}</Text>
            <Text style={styles.infoValue}>{userProfile?.phone}</Text>
          </View>
          
          {userProfile?.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('dashboard.labels.email')}</Text>
              <Text style={styles.infoValue}>{userProfile.email}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('dashboard.labels.memberSince')}</Text>
            <Text style={styles.infoValue}>
              {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : '-'}
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  phoneText: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
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
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  pendingMessage: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
  },
  pendingMessageText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  rejectionMessage: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
  },
  rejectionMessageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  rejectionMessageText: {
    fontSize: 14,
    color: '#DC2626',
    lineHeight: 20,
  },
  stepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepLabel: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  stepLabelCompleted: {
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  stepStatus: {
    marginLeft: 8,
  },
  stepIncomplete: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
});