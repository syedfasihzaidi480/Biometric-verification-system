import { jsx as _jsx } from "react/jsx-runtime";
import { View, StyleSheet } from 'react-native';
export const Card = ({ children, style }) => {
    return _jsx(View, { style: [styles.card, style], children: children });
};
const styles = StyleSheet.create({
    card: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    }
});
export default Card;
