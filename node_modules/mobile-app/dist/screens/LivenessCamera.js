import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View, Text, StyleSheet } from 'react-native';
import Button from '../components/Button';
export default function LivenessCamera({ onDone }) {
    return (_jsxs(View, { style: styles.wrap, children: [_jsx(Text, { style: styles.title, children: "Liveness Check" }), _jsx(Text, { style: styles.sub, children: "Center your face and follow the prompts." }), _jsx(View, { style: styles.placeholder }), _jsx(Button, { label: "Start", onPress: () => onDone?.(true) })] }));
}
const styles = StyleSheet.create({
    wrap: { flex: 1, padding: 20, gap: 12, backgroundColor: '#fff' },
    title: { fontSize: 22, fontWeight: '700' },
    sub: { color: '#6B7280' },
    placeholder: { height: 220, backgroundColor: '#F3F4F6', borderRadius: 12 }
});
