import { jsx as _jsx } from "react/jsx-runtime";
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
export const Button = ({ label, onPress, disabled, style }) => (_jsx(TouchableOpacity, { accessibilityRole: "button", style: [styles.btn, disabled && styles.btnDisabled, style], onPress: onPress, disabled: disabled, activeOpacity: 0.7, children: _jsx(Text, { style: styles.label, children: label }) }));
const styles = StyleSheet.create({
    btn: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center'
    },
    btnDisabled: { backgroundColor: '#9CA3AF' },
    label: { color: '#fff', fontWeight: '600', fontSize: 16 }
});
export default Button;
