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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/utils/auth/useAuth';
import useUser from '@/utils/auth/useUser';
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
  CreditCard
} from 'lucide-react-native';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, signIn, signOut } = useAuth();
  const { data: authUser } = useUser();
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

  const getStatusIcon = (isCompleted) => {
    if (isCompleted) {
      return <CheckCircle size={16} color="#10B981" />;
    } else {
      return <Clock size={16} color="#F59E0B" />;
    }
  };

  const getStatusText = (isCompleted) => {
    return isCompleted ? 'Verified' : 'Not Started';
  };

  const getStatusColor = (isCompleted) => {
    return isCompleted ? '#10B981' : '#F59E0B';
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        
        <Text style={styles.title}>Please Sign In</Text>
        <Text style={styles.subtitle}>You need to sign in to view your profile</Text>
        
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <Text style={styles.headerSubtitle}>Account information and verification status</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Section */}
        <View style={styles.section}>
          <View style={styles.userInfoHeader}>
            <View style={styles.avatarContainer}>
              <User size={32} color="#3B82F6" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{profile?.name || authUser?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{profile?.email || authUser?.email}</Text>
              
              {/* Status Badge */}
              <View style={styles.statusContainer}>
                {profile?.admin_approved ? (
                  <View style={styles.approvedBadge}>
                    <CheckCircle size={14} color="#10B981" />
                    <Text style={styles.approvedText}>Verified Account</Text>
                  </View>
                ) : (
                  <View style={styles.pendingBadge}>
                    <Clock size={14} color="#F59E0B" />
                    <Text style={styles.pendingText}>Pending Verification</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <User size={16} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{profile?.name || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Phone size={16} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{profile?.phone || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Mail size={16} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile?.email || authUser?.email || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Calendar size={16} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date of Birth</Text>
                <Text style={styles.infoValue}>{formatDate(profile?.date_of_birth)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Verification Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Status</Text>
          
          <View style={styles.verificationCard}>
            <View style={styles.verificationItem}>
              <View style={styles.verificationHeader}>
                <Text style={styles.verificationLabel}>Voice Verification</Text>
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
                <Text style={styles.verificationLabel}>Face Verification</Text>
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
                <Text style={styles.verificationLabel}>Document Verification</Text>
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
          <Text style={styles.sectionTitle}>Admin Review Status</Text>
          
          <View style={styles.adminCard}>
            <View style={styles.adminItem}>
              <View style={styles.adminIcon}>
                <Shield size={16} color="#6B7280" />
              </View>
              <View style={styles.adminContent}>
                <Text style={styles.adminLabel}>Admin Approval</Text>
                <Text style={[
                  styles.adminStatus,
                  { color: profile?.admin_approved ? '#10B981' : '#F59E0B' }
                ]}>
                  {profile?.admin_approved ? 'Approved' : 'Pending Review'}
                </Text>
              </View>
            </View>

            <View style={styles.adminSeparator} />

            <View style={styles.adminItem}>
              <View style={styles.adminIcon}>
                <CreditCard size={16} color="#6B7280" />
              </View>
              <View style={styles.adminContent}>
                <Text style={styles.adminLabel}>Payment Status</Text>
                <Text style={[
                  styles.adminStatus,
                  { color: profile?.payment_released ? '#10B981' : '#F59E0B' }
                ]}>
                  {profile?.payment_released ? 'Released' : 'Pending'}
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
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
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
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  statusContainer: {
    alignSelf: 'flex-start',
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  verificationCard: {
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
  verificationItem: {
    paddingVertical: 12,
  },
  verificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  verificationLabel: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  verificationStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  verificationSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: -16,
  },
  adminCard: {
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
  adminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  adminIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adminContent: {
    flex: 1,
  },
  adminLabel: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    marginBottom: 2,
  },
  adminStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  adminSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: -16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
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