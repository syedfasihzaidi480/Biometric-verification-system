import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type Language = { code: string; name: string; nativeName: string };

type Props = {
  languages: Language[];
  current: string;
  onSelect: (code: string) => void;
};

export const LanguageSelector: React.FC<Props> = ({ languages, current, onSelect }) => (
  <View style={styles.wrap}>
    {languages.map((l) => (
      <TouchableOpacity
        key={l.code}
        style={[styles.item, current === l.code && styles.itemActive]}
        onPress={() => onSelect(l.code)}
      >
        <Text style={[styles.itemText, current === l.code && styles.itemTextActive]}>
          {l.nativeName} ({l.name})
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  item: { padding: 12, borderRadius: 8, backgroundColor: '#F3F4F6' },
  itemActive: { backgroundColor: '#DBEAFE' },
  itemText: { color: '#111827' },
  itemTextActive: { color: '#1D4ED8', fontWeight: '600' }
});

export default LanguageSelector;
