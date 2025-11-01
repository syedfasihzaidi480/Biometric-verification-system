import React, { useMemo, useState } from 'react';
import { View, TextInput, Modal, TouchableOpacity, Text, Platform } from 'react-native';
import { Calendar as CalendarIcon } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';

// Formats 'YYYY-MM-DD' -> 'DD/MM/YYYY'
const toDisplay = (iso) => {
  if (!iso || typeof iso !== 'string') return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso; // maybe already DD/MM/YYYY
  return `${m[3]}/${m[2]}/${m[1]}`;
};

// Formats 'DD/MM/YYYY' -> 'YYYY-MM-DD'
const toISO = (disp) => {
  if (!disp || typeof disp !== 'string') return '';
  const m = disp.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return disp; // not matching, keep raw
  return `${m[3]}-${m[2]}-${m[1]}`;
};

export default function DateInput({
  value,
  onChangeText,
  onChange,
  placeholder = 'DD/MM/YYYY',
  style,
  textInputStyle,
  minDate,
  maxDate,
}) {
  const [visible, setVisible] = useState(false);
  const isoForCalendar = useMemo(() => {
    // Accept DD/MM/YYYY or YYYY-MM-DD from callers
    if (/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return value;
    return toISO(value || '');
  }, [value]);

  const handleChange = (val) => {
    const handler = onChangeText || onChange;
    if (handler) handler(val);
  };

  return (
    <View style={[{ flex: 1, position: 'relative' }, style]}
    >
      <TextInput
        style={[{ flex: 1, fontSize: 16, color: '#1F2937', paddingRight: 36 }, textInputStyle]}
        value={value || ''}
        placeholder={placeholder}
        keyboardType={Platform.OS === 'android' ? 'numeric' : 'default'}
        onFocus={() => setVisible(true)}
        onChangeText={handleChange}
      />

      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={{ position: 'absolute', right: 6, top: 10, padding: 4 }}
        accessibilityRole="button"
        accessibilityLabel="Open calendar"
      >
        <CalendarIcon size={18} color="#9CA3AF" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 12, overflow: 'hidden' }}>
            <Calendar
              current={isoForCalendar || undefined}
              maxDate={maxDate}
              minDate={minDate}
              onDayPress={(day) => {
                const disp = toDisplay(day.dateString);
                handleChange(disp);
                setVisible(false);
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, padding: 12 }}>
              <TouchableOpacity onPress={() => setVisible(false)} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                <Text style={{ color: '#374151', fontWeight: '600' }}>Manual entry</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { handleChange(''); setVisible(false); }} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                <Text style={{ color: '#EF4444', fontWeight: '600' }}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
