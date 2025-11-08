import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import VoiceRecorder from '../components/VoiceRecorder';
import Button from '../components/Button';
export default function RegisterVoice({ onComplete }) {
    const [current, setCurrent] = useState(1);
    const [samples, setSamples] = useState([]);
    const total = 3;
    const onRecorded = (uri) => {
        setSamples((s) => [...s, uri]);
        if (current >= total) {
            onComplete?.(0.93);
        }
        else {
            setCurrent((c) => c + 1);
        }
    };
    return (_jsxs(View, { style: styles.wrap, children: [_jsx(Text, { style: styles.title, children: "Voice Enrollment" }), _jsx(Text, { style: styles.sub, children: "Record 3 samples saying the displayed phrase." }), _jsx(View, { style: styles.card, children: _jsxs(Text, { style: styles.script, children: ["This is sample ", current, " of ", total] }) }), _jsx(View, { style: styles.progress, children: _jsx(View, { style: [styles.progressFill, { width: `${(samples.length / total) * 100}%` }] }) }), _jsx(VoiceRecorder, { onRecorded: onRecorded }), samples.length > 0 && (_jsx(Button, { label: "Record again", onPress: () => setSamples([]), style: { marginTop: 16 } }))] }));
}
const styles = StyleSheet.create({
    wrap: { flex: 1, padding: 20, gap: 12, backgroundColor: '#fff' },
    title: { fontSize: 22, fontWeight: '700' },
    sub: { color: '#6B7280' },
    card: { padding: 16, borderRadius: 12, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
    script: { textAlign: 'center', color: '#1F2937' },
    progress: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 },
    progressFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 2 }
});
