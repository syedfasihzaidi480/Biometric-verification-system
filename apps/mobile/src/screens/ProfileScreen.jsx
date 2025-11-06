import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Save } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from '@/i18n/useTranslation';
import { apiFetchJson } from '@/utils/api';
import { useTheme } from '@/utils/theme/ThemeProvider';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t, currentLanguage } = useTranslation();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetchJson('/api/profile');
        if (res?.user) {
          setForm({
            name: res.user.name || '',
            phone: res.user.phone || '',
            email: res.user.email || '',
          });
        }
      } catch (e) {
  Alert.alert(t('common.error'), e?.message || t('errors.server'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await apiFetchJson('/api/profile', {
        method: 'PUT',
        body: {
          name: form.name?.trim(),
          phone: form.phone?.trim(),
          // email is optional per backend; only send if changed/non-empty
          ...(form.email?.trim() ? { email: form.email.trim() } : {}),
          // keep preferred_language in sync with current i18n selection
          preferred_language: currentLanguage,
        },
      });
  Alert.alert(t('common.success'), t('profile.updated'));
      router.back();
    } catch (e) {
  Alert.alert(t('common.error'), e?.message || t('errors.server'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}> 
      <StatusBar style="dark" />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
  <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings.items.profile.title')}</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : (
        <KeyboardAvoidingScreen onSave={save} saving={saving} colors={colors} form={form} onChange={onChange} />
      )}
    </View>
  );
}

function KeyboardAvoidingScreen({ onSave, saving, colors, form, onChange }) {
  const { t } = useTranslation();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <Field label={t('registration.fullName')} value={form.name} onChangeText={(v) => onChange('name', v)} colors={colors} />
        <Field label={t('registration.phoneNumber')} value={form.phone} onChangeText={(v) => onChange('phone', v)} colors={colors} keyboardType="phone-pad" />
        <Field label={`${t('registration.email')} (${t('registration.emailOptionalTag')})`} value={form.email} onChangeText={(v) => onChange('email', v)} colors={colors} keyboardType="email-address" />

        <TouchableOpacity onPress={onSave} disabled={saving} style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}> 
          <Save size={18} color="#fff" />
          <Text style={styles.saveText}>{saving ? t('common.loading') : t('common.save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChangeText, colors, keyboardType }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: colors.muted, marginBottom: 6, fontSize: 13 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={label}
        placeholderTextColor={colors.muted}
        style={{
          backgroundColor: colors.surface,
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 12,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 10, marginTop: 8 },
  saveText: { color: '#fff', fontWeight: '600', marginLeft: 8 },
});
