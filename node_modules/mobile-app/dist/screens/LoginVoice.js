import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View, Text, StyleSheet } from 'react-native';
import VoiceRecorder from '../components/VoiceRecorder';
import Button from '../components/Button';
export default function LoginVoice({ onSuccess }) {
    const onRecorded = () => {
        // Placeholder verify
        onSuccess?.();
    };
    return (_jsxs(View, { style: styles.wrap, children: [_jsx(Text, { style: styles.title, children: "Voice Login" }), _jsx(Text, { style: styles.sub, children: "Record a short phrase to verify." }), _jsx(VoiceRecorder, { onRecorded: () => onRecorded() }), _jsx(Button, { label: "Verify", onPress: () => onRecorded(), style: { marginTop: 16 } })] }));
}
const styles = StyleSheet.create({
    wrap: { flex: 1, padding: 20, gap: 12, backgroundColor: '#fff' },
    title: { fontSize: 22, fontWeight: '700' },
    sub: { color: '#6B7280' }
});
