import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, Alert, Linking, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ExternalLink, ShieldCheck, Download, Trash2 } from 'lucide-react-native';
import { PREF_KEYS, loadPreferences, setPreference } from '@/utils/preferences';
import { apiFetchJson } from '@/utils/api';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '@/utils/theme/ThemeProvider';
import { useTranslation } from '@/i18n/useTranslation';

const POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL || 'https://example.com/privacy';

export default function PrivacySettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [analytics, setAnalytics] = useState(true);
  const [personalized, setPersonalized] = useState(true);

  useEffect(() => {
    (async () => {
      const prefs = await loadPreferences();
      // Backward compatible defaults
      setAnalytics(prefs.analytics ?? true);
      setPersonalized(prefs.personalized ?? true);
    })();
  }, []);

  const onToggle = async (key, value) => {
    if (key === 'analytics') setAnalytics(value);
    if (key === 'personalized') setPersonalized(value);
    const map = { analytics: PREF_KEYS.analytics, personalized: PREF_KEYS.personalized };
    const storageKey = map[key] || `pref.${key}`;
    await setPreference(storageKey, value);
    // Best-effort server sync
    try {
      await apiFetchJson('/api/privacy/preferences', { method: 'POST', body: { [key]: !!value } });
    } catch {}
  };

  const openPolicy = async () => {
    try { await Linking.openURL(POLICY_URL); } catch {}
  };

  const exportData = async () => {
    try {
  const res = await apiFetchJson('/api/account/export');
  const data = JSON.stringify(res, null, 2);
  const fileUri = FileSystem.cacheDirectory + 'my-account-export.json';
      await FileSystem.writeAsStringAsync(fileUri, data, { encoding: FileSystem.EncodingType.UTF8 });
      try {
        const Sharing = await import('expo-sharing');
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Your Account Data' });
          return;
        }
      } catch {}
      Alert.alert(t('privacyScreen.dataExported'), t('privacyScreen.dataExportedMessage', { path: fileUri }));
    } catch (e) {
      Alert.alert(t('privacyScreen.exportFailed'), e?.message || t('privacyScreen.exportFailedMessage'));
    }
  };

  const requestDeletion = async () => {
    Alert.alert(
      t('privacyScreen.deleteAccount'),
      t('privacyScreen.deleteConfirm'),
      [
        { text: t('privacyScreen.cancel'), style: 'cancel' },
        {
          text: t('privacyScreen.delete'), style: 'destructive', onPress: async () => {
            try {
              // If backend route isn’t available, this will fail gracefully
              await apiFetchJson('/api/account/delete', { method: 'POST' });
              Alert.alert(t('privacyScreen.requestSubmitted'), t('privacyScreen.requestSubmittedMessage'));
              router.replace('/');
            } catch (e) {
              Alert.alert(t('privacyScreen.unsupported'), t('privacyScreen.unsupportedMessage'));
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}> 
      <StatusBar style="dark" />
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('privacyScreen.title')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Section title={t('privacyScreen.sections.dataPreferences')} colors={colors}>
          <RowSwitch title={t('privacyScreen.analytics')} subtitle={t('privacyScreen.analyticsSubtitle')} value={analytics} onValueChange={(v) => onToggle('analytics', v)} colors={colors} />
          <RowSwitch title={t('privacyScreen.personalized')} subtitle={t('privacyScreen.personalizedSubtitle')} value={personalized} onValueChange={(v) => onToggle('personalized', v)} colors={colors} last />
        </Section>

        <Section title={t('privacyScreen.sections.yourData')} colors={colors}>
          <RowButton title={t('privacyScreen.downloadData')} icon={<Download size={18} color={colors.text} />} onPress={exportData} colors={colors} />
          <RowButton title={t('privacyScreen.requestDeletion')} icon={<Trash2 size={18} color="#EF4444" />} danger onPress={requestDeletion} colors={colors} last />
        </Section>

        <TouchableOpacity style={[styles.policyBtn, { borderColor: colors.border }]} onPress={openPolicy}>
          <ShieldCheck size={18} color={colors.text} />
          <Text style={[styles.policyText, { color: colors.text }]}>{t('privacyScreen.viewPolicy')}</Text>
          <ExternalLink size={16} color={colors.muted} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Section({ title, children, colors }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: colors.muted, fontWeight: '600', marginBottom: 10 }}>{title}</Text>
      <View style={{ backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
        {children}
      </View>
    </View>
  );
}

function RowSwitch({ title, subtitle, value, onValueChange, colors, last }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ color: colors.text, fontWeight: '500' }}>{title}</Text>
        {!!subtitle && <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>{subtitle}</Text>}
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#D1D5DB', true: '#007AFF' }} thumbColor="#fff" />
    </View>
  );
}

function RowButton({ title, icon, onPress, colors, last, danger }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ color: danger ? '#EF4444' : colors.text, fontWeight: '500' }}>{title}</Text>
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: '600', fontSize: 18 },
  policyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 10, borderWidth: 1 },
  policyText: { fontWeight: '500' },
});
