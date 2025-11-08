import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Button from '../components/Button';
import { useVerificationStatus } from '../hooks/useVerificationStatus';

type Props = {
  onBack?: () => void;
};

type StepConfig = {
  key: 'voice' | 'face' | 'document';
  title: string;
  description: string;
  icon: string;
};

const COPIES: StepConfig[] = [
  {
    key: 'voice',
    title: 'Voice Verification',
    description: 'Record your voice for verification',
    icon: 'MIC',
  },
  {
    key: 'face',
    title: 'Face Verification',
    description: 'Take a selfie for facial recognition',
    icon: 'FACE',
  },
  {
    key: 'document',
    title: 'Document Verification',
    description: 'Upload your ID document',
    icon: 'ID',
  },
];

const VerificationCenter: React.FC<Props> = ({ onBack }) => {
  const { status, refresh, loading } = useVerificationStatus();

  const steps = useMemo(
    () =>
      COPIES.map((item) => ({
        ...item,
        completed: status.steps[item.key].completed,
      })),
    [
      status.steps.voice.completed,
      status.steps.face.completed,
      status.steps.document.completed,
    ]
  );

  const completedSteps = steps.filter((step) => step.completed).length;
  const totalSteps = steps.length;
  const progress = Math.round((completedSteps / totalSteps) * 100);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Identity Verification</Text>
        <Text style={styles.subtitle}>Complete all steps to verify your identity</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verification Progress</Text>
        {steps.map((step) => (
          <View
            key={step.key}
            style={[styles.card, step.completed && styles.cardCompleted]}
          >
            <View style={[styles.cardIcon, step.completed && styles.cardIconCompleted]}>
              <Text style={styles.iconText}>{step.icon}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{step.title}</Text>
              <Text style={styles.cardDescription}>{step.description}</Text>
              <Text style={step.completed ? styles.statusVerified : styles.statusPending}>
                {step.completed ? 'Verified' : 'Pending'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Status</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Verification Progress</Text>
            <Text style={styles.progressValue}>{progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressDescription}>
            {progress === 100
              ? 'All verification steps completed!'
              : `${completedSteps} of ${totalSteps} steps completed`}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsText}>
            - Ensure you are in a quiet, well-lit space.
            {'\n'}- Have your identification documents ready.
            {'\n'}- Follow the prompts carefully for the best results.
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          label={loading ? 'Refreshing...' : 'Refresh status'}
          onPress={() => {
            void refresh();
          }}
          style={[styles.button, styles.buttonSpacer, styles.refreshButton]}
        />
        <Button
          label={onBack ? 'Back to dashboard' : 'Close'}
          onPress={() => onBack?.()}
          style={[styles.button, styles.backButton]}
        />
      </View>
    </ScrollView>
  );
};

export default VerificationCenter;

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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  card: {
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
  cardCompleted: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardIconCompleted: {
    backgroundColor: '#D1FAE5',
  },
  iconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
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
    marginBottom: 6,
  },
  statusVerified: {
    color: '#047857',
    fontWeight: '600',
  },
  statusPending: {
    color: '#DB2777',
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  progressValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563EB',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 999,
  },
  progressDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  instructionsCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  instructionsText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
  },
  buttonSpacer: {
    marginRight: 12,
  },
  refreshButton: {
    backgroundColor: '#2563EB',
  },
  backButton: {
    backgroundColor: '#111827',
  },
});
