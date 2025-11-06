import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/utils/auth/useAuth';
import { apiFetchJson } from '@/utils/api';
import { CheckCircle, Clock, Mic, Camera, FileText, ArrowRight } from 'lucide-react-native';
import { useTranslation } from '@/i18n/useTranslation';

export default function VerifyScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, signIn } = useAuth();
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileRef = useRef(null);
  const lastFetchedAtRef = useRef(0);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const fetchProfile = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchedAtRef.current < 10000) {
      return; // avoid spamming server on rapid tab changes
    }
    lastFetchedAtRef.current = now;
    if (!profileRef.current) {
      setLoading(true);
    }
    try {
      const result = await apiFetchJson('/api/profile');
      if (result?.success) {
        setProfile(result.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    } else {
      setProfile(null);
      profileRef.current = null;
      setLoading(false);
    }
  }, [isAuthenticated, fetchProfile]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchProfile();
      }
    }, [isAuthenticated, fetchProfile]),
  );

  const getVerificationSteps = () => {
    const steps = [
      {
        id: 'voice',
        title: t('profile.voiceVerification'),
        description: t('voiceLogin.subtitle'),
        status: 'not_started',
        route: '/voice-verification',
      },
      {
        id: 'face',
        title: t('profile.faceVerification'),
        description: t('liveness.subtitle'),
        status: 'not_started',
        route: '/liveness-check',
      },
      {
        id: 'document',
        title: t('profile.documentVerification'),
        description: t('document.subtitle'),
        status: 'not_started',
        route: '/document-upload',
      },
    ];

    if (!profile) {
      return steps;
    }

    return steps.map((step) => {
      if (step.id === 'voice') {
        return {
          ...step,
          status: profile.voice_verified ? 'verified' : 'available',
        };
      }

      if (step.id === 'face') {
        return {
          ...step,
          status: profile.face_verified
            ? 'verified'
            : profile.voice_verified
            ? 'available'
            : 'not_started',
        };
      }

      if (step.id === 'document') {
        return {
          ...step,
          status: profile.document_verified
            ? 'verified'
            : profile.face_verified
            ? 'available'
            : 'not_started',
        };
      }

      return step;
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle size={20} color="#10B981" />;
      case 'available':
        return <Clock size={20} color="#3B82F6" />;
      case 'in_progress':
        return <Clock size={20} color="#F59E0B" />;
      default:
        return <Clock size={20} color="#9CA3AF" />;
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
        return t('verify.statuses.verified');
      case 'available':
        return t('verify.statuses.start');
      case 'in_progress':
        return t('verify.statuses.inProgress');
      default:
        return t('verify.statuses.notStarted');
    }
  };

  const getStepIcon = (stepId) => {
    switch (stepId) {
      case 'voice':
        return Mic;
      case 'face':
        return Camera;
      case 'document':
        return FileText;
      default:
        return FileText;
    }
  };

  const handleStepPress = (step) => {
    if (!canStartVerification()) {
      return;
    }

    if (step.id === 'face' && !profile?.voice_verified) {
      return;
    }

    if (step.id === 'document' && !profile?.face_verified) {
      return;
    }

    if (step.status === 'verified') {
      return;
    }

    router.push(step.route);
  };

  const canStartVerification = () => {
    return isAuthenticated && profile && profile.profile_completed;
  };

  const getOverallProgress = () => {
    if (!profile) return 0;
    let completed = 0;
    if (profile.voice_verified) completed++;
    if (profile.face_verified) completed++;
    if (profile.document_verified) completed++;
    return (completed / 3) * 100;
  };

  const verificationSteps = getVerificationSteps();
  const progress = getOverallProgress();

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.centerContent}>
          <Text style={styles.title}>{t('verify.signInRequired')}</Text>
          <Text style={styles.subtitle}>{t('verify.pleaseSignIn')}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => signIn()}>
            <Text style={styles.primaryButtonText}>{t('auth.signIn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  if (!profile?.profile_completed) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.centerContent}>
          <Text style={styles.title}>{t('verify.completeYourProfile')}</Text>
          <Text style={styles.subtitle}>{t('verify.pleaseCompleteProfileFirst')}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.primaryButtonText}>{t('verify.goToProfile')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('verify.title')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('verify.subtitle')}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('verify.progress')}</Text>

          {verificationSteps.map((step, index) => {
            const StepIcon = getStepIcon(step.id);
            const isDisabled =
              step.status === 'not_started' &&
              (step.id !== 'voice' ||
                (step.id === 'face' && !profile?.voice_verified) ||
                (step.id === 'document' && !profile?.face_verified));

            return (
              <TouchableOpacity
                key={step.id}
                style={[
                  styles.card,
                  step.status === 'verified' && styles.cardVerified,
                  isDisabled && styles.cardDisabled,
                ]}
                onPress={() => handleStepPress(step)}
                disabled={isDisabled || step.status === 'verified'}
              >
                <View style={styles.cardIcon}>
                  <StepIcon size={24} color={getStatusColor(step.status)} />
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{step.title}</Text>
                  <Text style={styles.cardDescription}>{step.description}</Text>
                  <View style={styles.cardStatus}>
                    {getStatusIcon(step.status)}
                    <Text
                      style={[
                        styles.cardStatusText,
                        { color: getStatusColor(step.status) },
                      ]}
                    >
                      {getStatusText(step.status)}
                    </Text>
                  </View>
                </View>

                {step.status !== 'verified' && !isDisabled && (
                  <ArrowRight size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('verify.overallStatus')}</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>{t('verify.progress')}</Text>
              <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressDescription}>
              {progress === 100
                ? t('verify.allStepsCompleted')
                : t('verify.stepsCompletedOf', { count: Math.round(progress / 33.33) })}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('verify.instructions')}</Text>
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsText}>{t('verify.bulletPoints')}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardVerified: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  cardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardStatusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  progressCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  instructionsCard: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  instructionsText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
});
