import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { useTheme } from '@/utils/theme/ThemeProvider';

export default function VerifyScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, signIn } = useAuth();
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileRef = useRef(null);
  const lastFetchedAtRef = useRef(0);

  const normalizedProfile = useMemo(() => {
    if (!profile) return null;
    if (profile.admin_approved) {
      return {
        ...profile,
        voice_verified: profile.voice_verified ?? true,
        face_verified: profile.face_verified ?? true,
        document_verified: profile.document_verified ?? true,
        profile_completed: profile.profile_completed ?? true,
      };
    }
    return profile;
  }, [profile]);

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
    const currentProfile = normalizedProfile;
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

    if (!currentProfile) {
      return steps;
    }

    return steps.map((step) => {
      if (step.id === 'voice') {
        return {
          ...step,
          status: currentProfile.voice_verified ? 'verified' : 'available',
        };
      }

      if (step.id === 'face') {
        return {
          ...step,
          status: currentProfile.face_verified
            ? 'verified'
            : currentProfile.voice_verified
            ? 'available'
            : 'not_started',
        };
      }

      if (step.id === 'document') {
        return {
          ...step,
          status: currentProfile.document_verified
            ? 'verified'
            : currentProfile.face_verified
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

  const getCardTheme = (status) => {
    switch (status) {
      case 'verified':
        return {
          backgroundColor: '#ECFDF5',
          borderColor: '#A7F3D0',
          iconBackground: '#D1FAE5',
          statusColor: '#047857',
        };
      case 'available':
        return {
          backgroundColor: '#EFF6FF',
          borderColor: '#BFDBFE',
          iconBackground: '#DBEAFE',
          statusColor: '#2563EB',
        };
      case 'in_progress':
        return {
          backgroundColor: '#FEF3C7',
          borderColor: '#FCD34D',
          iconBackground: '#FDE68A',
          statusColor: '#B45309',
        };
      default:
        return {
          backgroundColor: '#F9FAFB',
          borderColor: '#E5E7EB',
          iconBackground: '#E5E7EB',
          statusColor: '#6B7280',
        };
    }
  };

  const handleStepPress = (step) => {
    if (!canStartVerification()) {
      return;
    }

    if (step.id === 'face' && !normalizedProfile?.voice_verified) {
      return;
    }

    if (step.id === 'document' && !normalizedProfile?.face_verified) {
      return;
    }

    if (step.status === 'verified') {
      return;
    }

    router.push(step.route);
  };

  const canStartVerification = () => {
    return isAuthenticated && normalizedProfile;
  };

  const getOverallProgress = () => {
    if (!normalizedProfile) return 0;
    let completed = 0;
    if (normalizedProfile.voice_verified) completed++;
    if (normalizedProfile.face_verified) completed++;
    if (normalizedProfile.document_verified) completed++;
    return (completed / 3) * 100;
  };

  const verificationSteps = getVerificationSteps();
  const progress = getOverallProgress();
  const completedSteps = verificationSteps.filter((step) => step.status === 'verified').length;
  const totalSteps = verificationSteps.length;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}> 
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.centerContent}>
          <Text style={[styles.title, { color: colors.text }]}>{t('verify.signInRequired')}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{t('verify.pleaseSignIn')}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => signIn()}>
            <Text style={styles.primaryButtonText}>{t('auth.signIn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}> 
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, { color: colors.muted }]}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}> 
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>
            {t('verify.title', { defaultValue: 'Identity Verification' })}
          </Text>
          <Text style={[styles.pageSubtitle, { color: colors.muted }]}>
            {t('verify.subtitle', { defaultValue: 'Complete all steps to verify your identity' })}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('verify.progress')}</Text>

          {!normalizedProfile?.profile_completed && (
            <View style={[styles.noticeCard, { backgroundColor: colors.surface }]}> 
              <Text style={[styles.noticeTitle, { color: colors.text }]}>{t('verify.completeYourProfile')}</Text>
              <Text style={[styles.noticeDescription, { color: colors.muted }]}>
                {t('verify.pleaseCompleteProfileFirst')}
              </Text>
              <TouchableOpacity
                style={styles.noticeButton}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Text style={styles.noticeButtonText}>{t('verify.goToProfile')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {verificationSteps.map((step, index) => {
            const StepIcon = getStepIcon(step.id);
            const isDisabled =
              step.status === 'not_started' &&
              (step.id !== 'voice' ||
                (step.id === 'face' && !normalizedProfile?.voice_verified) ||
                (step.id === 'document' && !normalizedProfile?.face_verified));
            const theme = getCardTheme(step.status);
            const StatusIcon = step.status === 'verified' ? CheckCircle : Clock;

            return (
              <TouchableOpacity
                key={step.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.backgroundColor,
                    borderColor: theme.borderColor,
                  },
                  isDisabled && styles.cardDisabled,
                ]}
                onPress={() => handleStepPress(step)}
                disabled={isDisabled || step.status === 'verified'}
              >
                <View style={[styles.cardIcon, { backgroundColor: theme.iconBackground }]}>
                  <StepIcon size={24} color={theme.statusColor} />
                </View>

                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{step.title}</Text>
                  <Text style={[styles.cardDescription, { color: colors.muted }]}>{step.description}</Text>
                  <View style={styles.cardStatus}>
                    <StatusIcon size={20} color={theme.statusColor} />
                    <Text
                      style={[styles.cardStatusText, { color: theme.statusColor }]}
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('verify.overallStatus')}</Text>
          <View style={[styles.progressCard, { backgroundColor: colors.surface }]}> 
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: colors.text }]}>{t('verify.progress')}</Text>
              <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={[styles.progressDescription, { color: colors.muted }]}>
              {progress === 100
                ? t('verify.allStepsCompleted', { defaultValue: 'All verification steps completed!' })
                : t('verify.stepsCompletedOf', {
                    defaultValue: '{{completed}} of {{total}} steps completed',
                    completed: completedSteps,
                    total: totalSteps,
                  })}
            </Text>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  pageHeader: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  section: {
    marginBottom: 28,
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  noticeCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
    padding: 16,
    marginBottom: 16,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  noticeDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  noticeButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  noticeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
