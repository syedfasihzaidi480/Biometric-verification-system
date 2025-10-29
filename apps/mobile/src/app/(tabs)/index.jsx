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
import { apiFetchJson } from '@/utils/api';
import { useAuth } from '@/utils/auth/useAuth';
import useUser from '@/utils/auth/useUser';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react-native';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, signIn } = useAuth();
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

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        
        <View style={styles.centerContent}>
          <Text style={styles.welcomeTitle}>Welcome</Text>
          <Text style={styles.subtitle}>Sign in to access your verification dashboard</Text>
          
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => signIn()}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const hasVerificationSession = profile?.voice_verified || profile?.face_verified || profile?.document_verified;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeTitle}>
            Welcome back, {profile?.name || authUser?.name || 'User'}
          </Text>
          <Text style={styles.subtitle}>
            Check your verification status below
          </Text>
        </View>

        {/* Verification Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.shieldIcon}>
              <Text style={styles.shieldEmoji}>🛡️</Text>
            </View>
            <Text style={styles.statusTitle}>Verification Status</Text>
          </View>
          <Text style={styles.statusMessage}>
            {hasVerificationSession 
              ? 'Continue your verification process'
              : 'No verification session found. Start by registering your profile.'}
          </Text>
        </View>

        {/* Verification Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Steps</Text>
          
          {/* Voice Verification */}
          <TouchableOpacity 
            style={styles.verificationCard}
            onPress={() => router.push('/(tabs)/verify')}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.iconEmoji}>🎙️</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Voice Verification</Text>
              <Text style={styles.cardSubtitle}>Record voice sample for biometric enrollment</Text>
            </View>
            {profile?.voice_verified ? (
              <CheckCircle size={24} color="#10B981" />
            ) : (
              <AlertCircle size={24} color="#F59E0B" />
            )}
          </TouchableOpacity>

          {/* Face Liveness */}
          <TouchableOpacity 
            style={styles.verificationCard}
            onPress={() => router.push('/(tabs)/verify')}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.iconEmoji}>🤳</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Face Liveness Detection</Text>
              <Text style={styles.cardSubtitle}>Capture selfie for liveness verification</Text>
            </View>
            {profile?.face_verified ? (
              <CheckCircle size={24} color="#10B981" />
            ) : (
              <AlertCircle size={24} color="#F59E0B" />
            )}
          </TouchableOpacity>

          {/* Document Verification */}
          <TouchableOpacity 
            style={styles.verificationCard}
            onPress={() => router.push('/(tabs)/verify')}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.iconEmoji}>📄</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Document Verification</Text>
              <Text style={styles.cardSubtitle}>Upload and verify your ID document</Text>
            </View>
            {profile?.document_verified ? (
              <CheckCircle size={24} color="#10B981" />
            ) : (
              <AlertCircle size={24} color="#F59E0B" />
            )}
          </TouchableOpacity>
        </View>

        {/* Next Steps */}
        {!profile?.profile_completed && (
          <View style={styles.nextStepsSection}>
            <Text style={styles.nextStepsTitle}>Next Steps</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/(tabs)/register')}
            >
              <Text style={styles.primaryButtonText}>
                Complete Profile Registration
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
    paddingHorizontal: 24,
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
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shieldEmoji: {
    fontSize: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
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
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 24,
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
});