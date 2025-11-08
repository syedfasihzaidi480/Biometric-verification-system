import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
export const LanguageSelector = ({ languages, current, onSelect }) => (_jsx(View, { style: styles.wrap, children: languages.map((l) => (_jsx(TouchableOpacity, { style: [styles.item, current === l.code && styles.itemActive], onPress: () => onSelect(l.code), children: _jsxs(Text, { style: [styles.itemText, current === l.code && styles.itemTextActive], children: [l.nativeName, " (", l.name, ")"] }) }, l.code))) }));
const styles = StyleSheet.create({
    wrap: { gap: 8 },
    item: { padding: 12, borderRadius: 8, backgroundColor: '#F3F4F6' },
    itemActive: { backgroundColor: '#DBEAFE' },
    itemText: { color: '#111827' },
    itemTextActive: { color: '#1D4ED8', fontWeight: '600' }
});
export default LanguageSelector;
