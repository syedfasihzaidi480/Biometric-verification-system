import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/utils/auth/useAuth';
import useUser from '@/utils/auth/useUser';
import { apiFetchJson } from '@/utils/api';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  LogOut,
  Shield,
  CreditCard,
  Settings
} from 'lucide-react-native';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/utils/theme/ThemeProvider';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, signIn, signOut } = useAuth();
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

  // Ensure the profile is refreshed when returning from Settings/Profile edit
  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) {
        fetchProfile();
      }
      // no cleanup necessary
      return undefined;
    }, [isAuthenticated])
  );

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

  const getStatusIcon = (isCompleted) => {
    if (isCompleted) {
      return <CheckCircle size={16} color="#10B981" />;
    } else {
      return <Clock size={16} color="#F59E0B" />;
    }
  };

  const getStatusText = (isCompleted) => {
    return isCompleted ? t('verify.statuses.verified') : t('verify.statuses.notStarted');
  };

  const getStatusColor = (isCompleted) => {
    return isCompleted ? '#10B981' : '#F59E0B';
  };

  const handleSignOut = () => {
    Alert.alert(
      t('profile.signOutConfirmTitle'),
      t('profile.signOutConfirmMessage'),
      [
        {
          text: t('profile.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.signOut'),
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('profile.notProvided');
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top, backgroundColor: colors.background }]}> 
        <StatusBar style={isDark ? 'light' : 'dark'} />
        
        <Text style={[styles.title, { color: colors.text }]}>{t('auth.signInRequired')}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{t('auth.pleaseSignInToViewProfile')}</Text>
        
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
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top, backgroundColor: colors.background }]}> 
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={[styles.loadingText, { color: colors.muted }]}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}> 
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}> 
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.title')}</Text>
        <TouchableOpacity accessibilityLabel="Open Settings" onPress={() => router.push('/settings')} style={styles.headerAction}>
          <Settings size={22} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <View style={[styles.userCard, { backgroundColor: colors.surface }]}> 
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarInitial}>
              {(profile?.name || authUser?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{profile?.name || authUser?.name || 'User'}</Text>
          <Text style={[styles.userEmail, { color: colors.muted }]}>{profile?.email || authUser?.email}</Text>
          
          {/* Status Badge */}
          {profile?.admin_approved ? (
            <View style={styles.approvedBadge}>
              <CheckCircle size={16} color="#10B981" />
              <Text style={styles.approvedText}>{t('profile.verifiedAccount')}</Text>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <Clock size={16} color="#F59E0B" />
              <Text style={styles.pendingText}>{t('profile.pendingVerification')}</Text>
            </View>
          )}
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.accountInformation')}</Text>
          
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}> 
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <User size={16} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.muted }]}>{t('profile.fullName')}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{profile?.name || t('profile.notProvided')}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Phone size={16} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.muted }]}>{t('profile.phoneNumber')}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{profile?.phone || t('profile.notProvided')}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Mail size={16} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.muted }]}>{t('profile.email')}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{profile?.email || authUser?.email || t('profile.notProvided')}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Calendar size={16} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.muted }]}>{t('profile.dateOfBirth')}</Text>
                <Text style={styles.infoValue}>{formatDate(profile?.date_of_birth)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Verification Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.verificationStatus')}</Text>
          
          <View style={[styles.verificationCard, { backgroundColor: colors.surface }]}> 
            <View style={styles.verificationItem}>
              <View style={styles.verificationHeader}>
                <Text style={[styles.verificationLabel, { color: colors.text }]}>{t('profile.voiceVerification')}</Text>
                {getStatusIcon(profile?.voice_verified)}
              </View>
              <Text style={[
                styles.verificationStatus,
                { color: getStatusColor(profile?.voice_verified) }
              ]}>
                {getStatusText(profile?.voice_verified)}
              </Text>
            </View>

            <View style={styles.verificationSeparator} />

            <View style={styles.verificationItem}>
              <View style={styles.verificationHeader}>
                <Text style={[styles.verificationLabel, { color: colors.text }]}>{t('profile.faceVerification')}</Text>
                {getStatusIcon(profile?.face_verified)}
              </View>
              <Text style={[
                styles.verificationStatus,
                { color: getStatusColor(profile?.face_verified) }
              ]}>
                {getStatusText(profile?.face_verified)}
              </Text>
            </View>

            <View style={styles.verificationSeparator} />

            <View style={styles.verificationItem}>
              <View style={styles.verificationHeader}>
                <Text style={[styles.verificationLabel, { color: colors.text }]}>{t('profile.documentVerification')}</Text>
                {getStatusIcon(profile?.document_verified)}
              </View>
              <Text style={[
                styles.verificationStatus,
                { color: getStatusColor(profile?.document_verified) }
              ]}>
                {getStatusText(profile?.document_verified)}
              </Text>
            </View>
          </View>
        </View>

        {/* Admin Review Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.adminReviewStatus')}</Text>
          
          <View style={[styles.adminCard, { backgroundColor: colors.surface }]}> 
            <View style={styles.adminItem}>
              <View style={styles.adminIcon}>
                <Shield size={16} color="#6B7280" />
              </View>
              <View style={styles.adminContent}>
                <Text style={[styles.adminLabel, { color: colors.text }]}>{t('profile.adminApproval')}</Text>
                <Text style={[
                  styles.adminStatus,
                  { color: profile?.admin_approved ? '#10B981' : '#F59E0B' }
                ]}>
                  {profile?.admin_approved ? t('profile.approved') : t('profile.pending')}
                </Text>
              </View>
            </View>

            <View style={styles.adminSeparator} />

            <View style={styles.adminItem}>
              <View style={styles.adminIcon}>
                <CreditCard size={16} color="#6B7280" />
              </View>
              <View style={styles.adminContent}>
                <Text style={[styles.adminLabel, { color: colors.text }]}>{t('profile.paymentStatus')}</Text>
                <Text style={[
                  styles.adminStatus,
                  { color: profile?.payment_released ? '#10B981' : '#F59E0B' }
                ]}>
                  {profile?.payment_released ? t('profile.released') : t('profile.pending')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <LogOut size={20} color="#DC2626" />
            <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
          </TouchableOpacity>
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  headerAction: {
    padding: 8,
    borderRadius: 10,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    paddingLeft: 4,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  approvedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
    marginLeft: 4,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
  },
  verificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  verificationItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  verificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  verificationLabel: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
  },
  verificationStatus: {
    fontSize: 13,
    fontWeight: '500',
  },
  verificationSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  adminCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  adminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  adminIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adminContent: {
    flex: 1,
  },
  adminLabel: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 4,
  },
  adminStatus: {
    fontSize: 13,
    fontWeight: '500',
  },
  adminSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
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