import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View, Text, StyleSheet } from 'react-native';
import Button from '../components/Button';
export default function DocumentUpload({ onUploaded }) {
    return (_jsxs(View, { style: styles.wrap, children: [_jsx(Text, { style: styles.title, children: "Document Upload" }), _jsx(Text, { style: styles.sub, children: "Take a photo of your ID or upload from gallery." }), _jsx(View, { style: styles.placeholder }), _jsx(Button, { label: "Upload", onPress: () => onUploaded?.('https://example.com/id.jpg') })] }));
}
const styles = StyleSheet.create({
    wrap: { flex: 1, padding: 20, gap: 12, backgroundColor: '#fff' },
    title: { fontSize: 22, fontWeight: '700' },
    sub: { color: '#6B7280' },
    placeholder: { height: 220, backgroundColor: '#F3F4F6', borderRadius: 12 }
});
