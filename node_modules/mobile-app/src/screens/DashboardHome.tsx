import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useVerificationStatus } from '../hooks/useVerificationStatus';

type Props = {
  onOpenVerify?: () => void;
};

const stepCopy: Record<string, { title: string; description: string; icon: string }> = {
  voice: {
    title: 'Voice Verification',
    description: 'Record voice sample for biometric enrollment',
    icon: 'MIC',
  },
  face: {
    title: 'Face Liveness Detection',
    description: 'Capture selfie for liveness verification',
    icon: 'FACE',
  },
  document: {
    title: 'Document Verification',
    description: 'Upload and verify your ID document',
    icon: 'ID',
  },
};

const DashboardHome: React.FC<Props> = ({ onOpenVerify }) => {
  const { status, loading } = useVerificationStatus();

  const steps = useMemo(
    () => [
      { key: 'voice' as const, completed: status.steps.voice.completed },
      { key: 'face' as const, completed: status.steps.face.completed },
      { key: 'document' as const, completed: status.steps.document.completed },
    ],
    [status.steps.document.completed, status.steps.face.completed, status.steps.voice.completed]
  );

  const completedSteps = steps.filter((step) => step.completed).length;
  const progressPercent = Math.round((completedSteps / steps.length) * 100);

  const handleOpenVerify = () => {
    onOpenVerify?.();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome back</Text>
        <Text style={styles.subtitle}>Check your verification status below</Text>
      </View>

      <TouchableOpacity
        style={styles.statusCard}
        activeOpacity={0.85}
        onPress={handleOpenVerify}
      >
        <View style={styles.statusIconWrapper}>
          <Text style={styles.statusIcon}>VS</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.statusTitle}>Verification Status</Text>
          <Text style={styles.statusDescription}>
            {status.adminApproved
              ? 'Your identity has been successfully verified.'
              : 'Continue your verification process'}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{`${progressPercent}%`}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Verification Steps</Text>
        {loading && <Text style={styles.refreshingLabel}>Refreshing...</Text>}
      </View>

      {steps.map((step) => {
        const copy = stepCopy[step.key];
        const completed = step.completed;
        return (
          <TouchableOpacity
            key={step.key}
            onPress={handleOpenVerify}
            activeOpacity={0.9}
            style={[styles.stepCard, completed && styles.stepCardCompleted]}
          >
            <View style={[styles.stepIconWrapper, completed && styles.stepIconWrapperCompleted]}>
              <Text style={styles.stepIconText}>{copy.icon}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{copy.title}</Text>
              <Text style={styles.stepDescription}>{copy.description}</Text>
            </View>
            <View style={[styles.stepStatus, completed ? styles.stepStatusDone : styles.stepStatusPending]}>
              <Text
                style={completed ? styles.stepStatusTextDone : styles.stepStatusTextPending}
              >
                {completed ? 'Verified' : 'Start'}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default DashboardHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 24,
  },
  header: {
    marginBottom: 24,
  },
  welcome: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statusDescription: {
    color: '#6B7280',
    fontSize: 14,
  },
  statusBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 16,
  },
  statusBadgeText: {
    color: '#2563EB',
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  stepCardCompleted: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  stepIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepIconWrapperCompleted: {
    backgroundColor: '#D1FAE5',
  },
  stepIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  stepStatus: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  stepStatusPending: {
    backgroundColor: '#FDF2F8',
  },
  stepStatusDone: {
    backgroundColor: '#DCFCE7',
  },
  stepStatusTextPending: {
    color: '#DB2777',
    fontWeight: '600',
  },
  stepStatusTextDone: {
    color: '#047857',
    fontWeight: '600',
  },
  refreshingLabel: {
    fontSize: 12,
    color: '#2563EB',
  },
});
