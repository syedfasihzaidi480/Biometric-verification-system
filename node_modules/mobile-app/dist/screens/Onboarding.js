import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import Button from '../components/Button';
import LanguageSelector from '../components/LanguageSelector';
import { validateRegistration } from '../utils/validators';
import { supportedLanguages, createI18n } from '../i18n/core';
export default function Onboarding({ onContinue }) {
    const [lang, setLang] = useState('en');
    const { t } = useMemo(() => createI18n(lang), [lang]);
    const [form, setForm] = useState({ fullName: '', phoneNumber: '', email: '', dateOfBirth: '' });
    const [errors, setErrors] = useState({});
    const handleNext = () => {
        const raw = validateRegistration(form);
        const localized = {};
        Object.keys(raw).forEach((k) => (localized[k] = t(raw[k])));
        setErrors(localized);
        if (Object.keys(raw).length === 0)
            onContinue?.({ ...form, preferredLanguage: lang });
    };
    return (_jsxs(ScrollView, { contentContainerStyle: styles.wrap, children: [_jsx(Text, { style: styles.title, children: t('onboarding.title') }), _jsx(Text, { style: styles.sub, children: t('onboarding.subtitle') }), _jsx(View, { style: { marginVertical: 16 }, children: _jsx(LanguageSelector, { languages: supportedLanguages, current: lang, onSelect: setLang }) }), _jsxs(View, { style: styles.group, children: [_jsxs(Text, { style: styles.label, children: [t('registration.fullName'), " *"] }), _jsx(TextInput, { style: styles.input, value: form.fullName, onChangeText: (v) => setForm({ ...form, fullName: v }) }), !!errors.fullName && _jsx(Text, { style: styles.err, children: errors.fullName })] }), _jsxs(View, { style: styles.group, children: [_jsxs(Text, { style: styles.label, children: [t('registration.phoneNumber'), " *"] }), _jsx(TextInput, { style: styles.input, value: form.phoneNumber, onChangeText: (v) => setForm({ ...form, phoneNumber: v }) }), !!errors.phoneNumber && _jsx(Text, { style: styles.err, children: errors.phoneNumber })] }), _jsxs(View, { style: styles.group, children: [_jsx(Text, { style: styles.label, children: t('registration.email') }), _jsx(TextInput, { style: styles.input, value: form.email, onChangeText: (v) => setForm({ ...form, email: v }) }), !!errors.email && _jsx(Text, { style: styles.err, children: errors.email })] }), _jsxs(View, { style: styles.group, children: [_jsx(Text, { style: styles.label, children: t('registration.dateOfBirth') }), _jsx(TextInput, { style: styles.input, value: form.dateOfBirth, onChangeText: (v) => setForm({ ...form, dateOfBirth: v }) })] }), _jsx(Text, { style: styles.terms, children: t('registration.terms') }), _jsx(Button, { label: t('onboarding.getStarted'), onPress: handleNext })] }));
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
