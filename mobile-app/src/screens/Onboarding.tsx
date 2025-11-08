import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import Button from '../components/Button';
import LanguageSelector from '../components/LanguageSelector';
import { validateRegistration } from '../utils/validators';
import { supportedLanguages, createI18n } from '../i18n/core';

export default function Onboarding({ onContinue }: { onContinue?: (data: any) => void }) {
  const [lang, setLang] = useState('en');
  const { t } = useMemo(() => createI18n(lang), [lang]);
  const [form, setForm] = useState({ fullName: '', phoneNumber: '', email: '', dateOfBirth: '' });
  const [errors, setErrors] = useState<any>({});

  const handleNext = () => {
    const raw = validateRegistration(form);
    const localized: any = {};
    Object.keys(raw).forEach((k) => (localized[k] = t(raw[k])));
    setErrors(localized);
    if (Object.keys(raw).length === 0) onContinue?.({ ...form, preferredLanguage: lang });
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>{t('onboarding.title')}</Text>
      <Text style={styles.sub}>{t('onboarding.subtitle')}</Text>

      <View style={{ marginVertical: 16 }}>
        <LanguageSelector languages={supportedLanguages} current={lang} onSelect={setLang} />
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>{t('registration.fullName')} *</Text>
        <TextInput style={styles.input} value={form.fullName} onChangeText={(v) => setForm({ ...form, fullName: v })} />
        {!!errors.fullName && <Text style={styles.err}>{errors.fullName}</Text>}
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>{t('registration.phoneNumber')} *</Text>
        <TextInput style={styles.input} value={form.phoneNumber} onChangeText={(v) => setForm({ ...form, phoneNumber: v })} />
        {!!errors.phoneNumber && <Text style={styles.err}>{errors.phoneNumber}</Text>}
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>{t('registration.email')}</Text>
        <TextInput style={styles.input} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} />
        {!!errors.email && <Text style={styles.err}>{errors.email}</Text>}
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>{t('registration.dateOfBirth')}</Text>
        <TextInput style={styles.input} value={form.dateOfBirth} onChangeText={(v) => setForm({ ...form, dateOfBirth: v })} />
      </View>

      <Text style={styles.terms}>{t('registration.terms')}</Text>

      <Button label={t('onboarding.getStarted')} onPress={handleNext} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, gap: 12, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginTop: 24 },
  sub: { color: '#6B7280' },
  group: { marginTop: 8 },
  label: { color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', padding: 12, borderRadius: 8, backgroundColor: '#F9FAFB' },
  err: { color: '#EF4444', marginTop: 4 },
  terms: { color: '#9CA3AF', fontSize: 12, marginVertical: 16 }
});
