import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { apiFetchJson } from '@/utils/api';
import { useAuth } from '@/utils/auth/useAuth';
import useUser from '@/utils/auth/useUser';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/utils/theme/ThemeProvider';
import {
  CheckCircle,
  AlertCircle,
  Fingerprint,
  HelpCircle,
  PhoneCall,
  ShieldCheck,
  Mic,
  Camera,
  FileText,
} from 'lucide-react-native';

const INPS_LOGO = require('../../../assets/images/icon.png');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, signIn } = useAuth();
  const { data: authUser } = useUser();
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
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
      const result = await apiFetchJson('/api/profile');
      if (result?.success) {
        setProfile(result.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    signIn();
  };

  const handleCreateAccount = () => {
    router.push('/registration');
  };

  const handleBiometric = () => {
    if (isAuthenticated) {
      router.push('/(tabs)/verify');
    } else {
      signIn();
    }
  };

  const handleHelp = () => {
    Alert.alert(
      t('help.title', { defaultValue: 'Need Help?' }),
      t('help.message', { defaultValue: 'Email support@inps.gov or visit your nearest INPS office for assistance.' })
    );
  };

  const handleSupport = async () => {
    const supportNumber = '+22320202020';
    const telUrl = `tel:${supportNumber}`;
    try {
      const canCall = await Linking.canOpenURL(telUrl);
      if (canCall) {
        await Linking.openURL(telUrl);
      } else {
        Alert.alert('Support', `Call ${supportNumber} for support.`);
      }
    } catch (error) {
      Alert.alert('Support', `Call ${supportNumber} for support.`);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}> 
        <StatusBar style={isDark ? 'light' : 'dark'} />

        <ScrollView
          contentContainerStyle={[styles.authContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Image source={INPS_LOGO} style={styles.logoImage} resizeMode="contain" />
            </View>
          </View>

          <Text style={[styles.brandTitle, { color: colors.text }]}>{t('home.brandTitle')}</Text>
          <Text style={[styles.brandSubtitle, { color: colors.muted }]}>{t('home.brandSubtitle')}</Text>

          <TouchableOpacity style={styles.primaryButtonLarge} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>{t('auth.login')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleCreateAccount}>
            <Text style={styles.secondaryButtonText}>{t('registration.createAccount')}</Text>
          </TouchableOpacity>

          <View style={styles.quickActionRow}>
            <TouchableOpacity style={styles.quickAction} onPress={handleBiometric}>
              <View style={styles.quickActionIcon}>
                <Fingerprint size={22} color="#1F2937" />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>{t('verify.title')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction} onPress={handleHelp}>
              <View style={styles.quickActionIcon}>
                <HelpCircle size={22} color="#1F2937" />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>
                {t('settings.items.help.title', { defaultValue: 'Help & Support' })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction} onPress={handleSupport}>
              <View style={styles.quickActionIcon}>
                <PhoneCall size={22} color="#1F2937" />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>{t('settings.support', { defaultValue: 'Support' })}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top, backgroundColor: colors.background }]}> 
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[styles.loadingText, { color: colors.muted }]}>{t('common.loading')}</Text>
      </View>
    );
  }

  const verificationSteps = [
    {
      id: 'voice',
      title: t('home.voiceVerification'),
      subtitle: t('home.voiceVerificationSubtitle'),
      verified: Boolean(profile?.voice_verified),
      icon: Mic,
    },
    {
      id: 'face',
      title: t('home.faceLiveness'),
      subtitle: t('home.faceLivenessSubtitle'),
      verified: Boolean(profile?.face_verified),
      icon: Camera,
    },
    {
      id: 'document',
      title: t('home.documentVerification'),
      subtitle: t('home.documentVerificationSubtitle'),
      verified: Boolean(profile?.document_verified),
      icon: FileText,
    },
  ];

  const allVerificationsCompleted = verificationSteps.every((step) => step.verified);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}> 
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>
            {t('home.welcomeBack', { name: profile?.name || authUser?.name || 'User' })}
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {allVerificationsCompleted 
              ? t('home.allVerificationsComplete', { defaultValue: 'Your account is fully verified' })
              : t('home.checkStatusBelow')}
          </Text>
        </View>

        {/* Verification Status Card */}
        <View style={[styles.statusCard, { backgroundColor: colors.surface }]}> 
          <View style={styles.statusHeader}>
            <View style={[styles.shieldIcon, { backgroundColor: '#EEF2FF' }]}> 
              <ShieldCheck size={24} color="#2563EB" />
            </View>
            <View style={styles.statusTextGroup}>
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                {t('home.verificationStatus', { defaultValue: 'Verification Status' })}
              </Text>
              <Text style={[styles.statusMessage, { color: colors.muted }]}>
                {allVerificationsCompleted
                  ? t('home.verificationCompleteMessage', {
                      defaultValue: 'Your identity has been successfully verified. You now have full access to all services.',
                    })
                  : t('home.continueVerification', {
                      defaultValue: 'Continue your verification process',
                    })}
              </Text>
            </View>
          </View>
        </View>

        {/* Verification Steps */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('home.verificationSteps', { defaultValue: 'Verification Steps' })}
          </Text>

          {verificationSteps.map((step) => {
            const StepIcon = step.icon;
            const statusColor = step.verified ? '#10B981' : '#F59E0B';
            const StatusIcon = step.verified ? CheckCircle : AlertCircle;

            return (
              <TouchableOpacity
                key={step.id}
                style={[styles.verificationCard, { backgroundColor: colors.surface }]}
                onPress={() => router.push('/(tabs)/verify')}
                activeOpacity={0.8}
              >
                <View style={styles.cardIcon}>
                  <StepIcon size={22} color="#2563EB" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{step.title}</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.muted }]}>{step.subtitle}</Text>
                </View>
                <StatusIcon size={24} color={statusColor} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  authContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 32,
    width: '100%',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  logoImage: {
    width: 90,
    height: 90,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  // Verification Status Card
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusTextGroup: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  // Verification Steps
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  verificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4FF',
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
    color: '#1F2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  // Next Steps
  nextStepsSection: {
    marginBottom: 24,
  },
  nextStepsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  primaryButtonLarge: {
    width: '100%',
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  primaryButton: {
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
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
    marginBottom: 32,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '700',
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 6,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
});