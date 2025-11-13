import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import { parsePhoneNumber, isValidPhoneNumber, AsYouType } from 'libphonenumber-js';

export default function PhoneNumberInput({
  value,
  onChangeText,
  onChange,
  onValidationChange,
  placeholder = 'Phone number',
  style,
  textInputStyle,
  error,
}) {
  const [countryCode, setCountryCode] = useState('US');
  const [callingCode, setCallingCode] = useState('1');
  const [nationalNumber, setNationalNumber] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef(null);

  // Parse initial value when component mounts or value changes externally
  useEffect(() => {
    if (value && value.startsWith('+')) {
      try {
        const phoneNumber = parsePhoneNumber(value);
        if (phoneNumber) {
          setCountryCode(phoneNumber.country || 'US');
          setCallingCode(phoneNumber.countryCallingCode);
          setNationalNumber(phoneNumber.nationalNumber);
          const valid = phoneNumber.isValid();
          setIsValid(valid);
          if (onValidationChange) onValidationChange(valid);
        }
      } catch (error) {
        console.warn('Failed to parse phone number:', error);
      }
    } else if (!value) {
      // Reset when value is cleared
      setNationalNumber('');
      setIsValid(false);
      if (onValidationChange) onValidationChange(false);
    }
  }, [value]);

  const handleCountrySelect = (country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
    setShowPicker(false);
    
    // Revalidate with new country code
    if (nationalNumber) {
      const fullNumber = `+${country.callingCode[0]}${nationalNumber}`;
      try {
        const valid = isValidPhoneNumber(fullNumber);
        setIsValid(valid);
        if (onValidationChange) onValidationChange(valid);
        
        const handler = onChangeText || onChange;
        if (handler) handler(fullNumber);
      } catch (error) {
        setIsValid(false);
        if (onValidationChange) onValidationChange(false);
      }
    }
    
    // Focus input after selecting country
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const handlePhoneNumberChange = (text) => {
    // Remove any non-digit characters
    const cleanedNumber = text.replace(/\D/g, '');
    setNationalNumber(cleanedNumber);

    // Build full international number
    const fullNumber = `+${callingCode}${cleanedNumber}`;

    // Validate
    let valid = false;
    try {
      valid = cleanedNumber.length > 0 && isValidPhoneNumber(fullNumber);
    } catch (error) {
      valid = false;
    }

    setIsValid(valid);
    if (onValidationChange) onValidationChange(valid);

    // Call parent handler
    const handler = onChangeText || onChange;
    if (handler) handler(fullNumber);
  };

  const formatNationalNumber = (number) => {
    if (!number) return '';
    
    // Use AsYouType formatter for better display
    try {
      const formatter = new AsYouType(countryCode);
      formatter.input(`+${callingCode}${number}`);
      const formatted = formatter.getNumber();
      return formatted ? formatted.formatNational() : number;
    } catch (error) {
      return number;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.countryButton, error && styles.errorBorder]}
        onPress={() => setShowPicker(true)}
        accessibilityRole="button"
        accessibilityLabel="Select country code"
      >
        <CountryPicker
          countryCode={countryCode}
          withFilter
          withFlag
          withCallingCode
          withEmoji
          onSelect={handleCountrySelect}
          visible={showPicker}
          onClose={() => setShowPicker(false)}
        />
        <Text style={styles.callingCode}>+{callingCode}</Text>
      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          error && styles.errorBorder,
          textInputStyle,
        ]}
        value={nationalNumber}
        onChangeText={handlePhoneNumberChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
      />

      {nationalNumber.length > 0 && (
        <View style={styles.validationIndicator}>
          {isValid ? (
            <Text style={styles.validText}>✓</Text>
          ) : (
            <Text style={styles.invalidText}>✗</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginRight: 8,
    minWidth: 100,
  },
  callingCode: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingRight: 40,
  },
  errorBorder: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  validationIndicator: {
    position: 'absolute',
    right: 12,
    top: 16,
  },
  validText: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: 'bold',
  },
  invalidText: {
    fontSize: 18,
    color: '#EF4444',
    fontWeight: 'bold',
  },
});

