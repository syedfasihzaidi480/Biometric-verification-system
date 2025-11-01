import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle, Clock } from 'lucide-react-native';

export default function VerificationSubmittedScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const tamperFlag = params?.tamper === 'true';
  const requestId = typeof params?.requestId === 'string' ? params.requestId : '';

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>      
      <StatusBar style="dark" />
      <View style={styles.iconWrapper}>
        <CheckCircle size={96} color="#10B981" />
      </View>
      <Text style={styles.title}>Verification Submitted</Text>
      <Text style={styles.subtitle}>
        Your documents were uploaded successfully and are now pending review by our compliance team.
      </Text>

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Clock size={24} color="#F59E0B" />
          <Text style={styles.statusTitle}>Status: Pending Review</Text>
        </View>
        <Text style={styles.statusBody}>
          We will notify you once the verification is complete. This typically takes less than 24 hours.
        </Text>
        {tamperFlag && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              We detected a potential issue with the document image. An agent has been notified to take a closer look.
            </Text>
          </View>
        )}
        {requestId ? (
          <Text style={styles.referenceText}>Reference ID: {requestId}</Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(tabs)/verify')}>
          <Text style={styles.primaryButtonText}>View Verification Status</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/dashboard')}>
          <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  statusCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  statusBody: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  notice: {
    marginTop: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
  },
  noticeText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  referenceText: {
    marginTop: 16,
    fontSize: 13,
    color: '#6B7280',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
});
