import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
};

export const Button: React.FC<Props> = ({ label, onPress, disabled, style }) => (
  <TouchableOpacity
    accessibilityRole="button"
    style={[styles.btn, disabled && styles.btnDisabled, style]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
  >
    <Text style={styles.label}>{label}</Text>
  </TouchableOpacity>
);

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
