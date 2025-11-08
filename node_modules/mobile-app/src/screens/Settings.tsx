import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LanguageSelector from '../components/LanguageSelector';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo' }
];

export default function Settings() {
  const [current, setCurrent] = React.useState('en');
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.label}>Language</Text>
      <LanguageSelector languages={languages} current={current} onSelect={setCurrent} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  label: { marginBottom: 8, color: '#374151' }
});
