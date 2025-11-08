import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View, Text, StyleSheet } from 'react-native';
export default function DashboardHome() {
    return (_jsxs(View, { style: styles.wrap, children: [_jsx(Text, { style: styles.title, children: "Dashboard" }), _jsx(Text, { children: "Status: Pending verification" })] }));
}
const styles = StyleSheet.create({
    wrap: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 12 }
});
