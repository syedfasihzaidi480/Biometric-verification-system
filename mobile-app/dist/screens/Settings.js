import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LanguageSelector from '../components/LanguageSelector';
const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'so', name: 'Somali', nativeName: 'Soomaali' },
    { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
    { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo' }
];
export default function Settings() {
    const [current, setCurrent] = React.useState('en');
    return (_jsxs(View, { style: styles.wrap, children: [_jsx(Text, { style: styles.title, children: "Settings" }), _jsx(Text, { style: styles.label, children: "Language" }), _jsx(LanguageSelector, { languages: languages, current: current, onSelect: setCurrent })] }));
}
const styles = StyleSheet.create({
    wrap: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
    label: { marginBottom: 8, color: '#374151' }
});
