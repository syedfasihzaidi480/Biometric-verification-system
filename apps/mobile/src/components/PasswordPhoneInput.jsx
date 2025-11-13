import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';

export default function PasswordPhoneInput({
  value,
  onChangeText,
  placeholder = 'Enter password',
  style,
  textInputStyle,
  error,
}) {
  const handlePhoneNumberChange = (text) => {
    // Only allow digits and basic phone characters
    const cleaned = text.replace(/[^\d\s\-\(\)\+]/g, '');
    onChangeText(cleaned);
  };

  return (
    <View style={[styles.container, error && styles.errorBorder, style]}>
      <Lock size={20} color="#666" style={styles.icon} />
      <TextInput
        style={[styles.input, textInputStyle]}
        value={value}
        onChangeText={handlePhoneNumberChange}
        placeholder={placeholder}
        keyboardType="phone-pad"
        autoComplete="off"
        secureTextEntry={false}
        textContentType="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  errorBorder: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
});

