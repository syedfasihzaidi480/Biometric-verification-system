import React, { useMemo, useState } from 'react';
import { View, TextInput, Modal, TouchableOpacity, Text, Platform, ScrollView } from 'react-native';
import { Calendar as CalendarIcon } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';

// Helpers for formatting/parsing between display formats and ISO
const formatISOToDisplay = (iso, displayFormat) => {
  if (!iso || typeof iso !== 'string') return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  if (displayFormat === 'YYYY-MM-DD') return iso;
  // default DD/MM/YYYY
  return `${m[3]}/${m[2]}/${m[1]}`;
};

const parseDisplayToISO = (disp, displayFormat) => {
  if (!disp || typeof disp !== 'string') return '';
  if (displayFormat === 'YYYY-MM-DD') {
    const m = disp.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? disp : disp; // keep raw if not matching
  }
  // DD/MM/YYYY -> ISO
  const m = disp.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return disp;
  return `${m[3]}-${m[2]}-${m[1]}`;
};

// Get today's date in YYYY-MM-DD format
const getTodayISO = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DateInput({
  value,
  onChangeText,
  onChange,
  placeholder,
  style,
  textInputStyle,
  minDate,
  maxDate,
  blockFutureDates = true,
  displayFormat = 'DD/MM/YYYY', // 'DD/MM/YYYY' | 'YYYY-MM-DD'
}) {
  const [visible, setVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState('calendar'); // 'calendar' | 'month' | 'year'
  const [tempMonth, setTempMonth] = useState(null); // 0-11 when selecting month
  // Track the month we're showing in the calendar header
  const initialISO = useMemo(() => {
    // Accept either display format or ISO from callers
    if (/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return value;
    return parseDisplayToISO(value || '', displayFormat);
  }, [value, displayFormat]);
  const [currentShownISO, setCurrentShownISO] = useState(initialISO || getTodayISO());
  
  // Block future dates by default for Date of Birth
  const effectiveMaxDate = useMemo(() => {
    if (maxDate) return maxDate;
    if (blockFutureDates) return getTodayISO();
    return undefined;
  }, [maxDate, blockFutureDates]);

  const isoForCalendar = useMemo(() => {
    // Always provide ISO to calendar
    if (/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return value;
    return parseDisplayToISO(value || '', displayFormat);
  }, [value, displayFormat]);

  const handleChange = (val) => {
    const handler = onChangeText || onChange;
    if (handler) handler(val);
  };

  const handleManualInput = (text) => {
    // Numeric keypad friendly formatting
    const digits = text.replace(/\D/g, '');
    let formatted = '';
    if (displayFormat === 'YYYY-MM-DD') {
      if (digits.length > 0) {
        formatted = digits.substring(0, 4);
        if (digits.length >= 5) {
          formatted += '-' + digits.substring(4, 6);
        }
        if (digits.length >= 7) {
          formatted += '-' + digits.substring(6, 8);
        }
      }
    } else {
      // DD/MM/YYYY
      if (digits.length > 0) {
        formatted = digits.substring(0, 2);
        if (digits.length >= 3) {
          formatted += '/' + digits.substring(2, 4);
        }
        if (digits.length >= 5) {
          formatted += '/' + digits.substring(4, 8);
        }
      }
    }
    handleChange(formatted);
  };

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const parseISOToParts = (iso) => {
    const m = (iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) {
      const today = new Date();
      return { y: today.getFullYear(), m: today.getMonth(), d: today.getDate() };
    }
    return { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) };
  };
  const partsToISO = (y, m, d = 1) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const { y: shownYear, m: shownMonth } = parseISOToParts(currentShownISO);
  const headerTitle = `${monthNames[shownMonth]} ${shownYear}`;

  const goPrevMonth = () => {
    const date = new Date(shownYear, shownMonth - 1, 1);
    setCurrentShownISO(partsToISO(date.getFullYear(), date.getMonth(), 1));
  };
  const goNextMonth = () => {
    const date = new Date(shownYear, shownMonth + 1, 1);
    const max = effectiveMaxDate ? new Date(effectiveMaxDate) : null;
    // Prevent moving past max month if blocking future
    if (max && (date.getFullYear() > max.getFullYear() || (date.getFullYear() === max.getFullYear() && date.getMonth() > max.getMonth()))) {
      setCurrentShownISO(partsToISO(max.getFullYear(), max.getMonth(), 1));
      return;
    }
    setCurrentShownISO(partsToISO(date.getFullYear(), date.getMonth(), 1));
  };

  const renderMonthGrid = () => (
    <View style={{ padding: 16 }}>
      <Text style={{ fontWeight: '700', fontSize: 16, textAlign: 'center', marginBottom: 12 }}>Select month</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {monthNames.map((name, idx) => (
          <TouchableOpacity
            key={name}
            onPress={() => { setTempMonth(idx); setPickerMode('year'); }}
            style={{ width: '33.33%', padding: 8 }}
          >
            <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ color: '#374151' }}>{name.substring(0,3)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8 }}>
        <TouchableOpacity onPress={() => setPickerMode('calendar')} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={{ color: '#374151', fontWeight: '600' }}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderYearDropdown = () => {
    const maxYear = (effectiveMaxDate ? new Date(effectiveMaxDate) : new Date()).getFullYear();
    const years = [];
    for (let yy = maxYear; yy >= 1900; yy--) years.push(yy);
    return (
      <View style={{ padding: 16, maxHeight: 320 }}>
        <Text style={{ fontWeight: '700', fontSize: 16, textAlign: 'center', marginBottom: 12 }}>Select year</Text>
        <ScrollView>
          {years.map((yy) => (
            <TouchableOpacity
              key={yy}
              onPress={() => {
                const targetMonth = tempMonth != null ? tempMonth : shownMonth;
                setCurrentShownISO(partsToISO(yy, targetMonth, 1));
                setPickerMode('calendar');
                setTempMonth(null);
              }}
              style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
            >
              <Text style={{ fontSize: 16, color: '#374151', textAlign: 'center' }}>{yy}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8 }}>
          <TouchableOpacity onPress={() => { setPickerMode('calendar'); setTempMonth(null); }} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ color: '#374151', fontWeight: '600' }}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[{ flex: 1, position: 'relative' }, style]}>
      <TextInput
        style={[{ flex: 1, fontSize: 16, color: '#1F2937', paddingRight: 36 }, textInputStyle]}
        value={value || ''}
        placeholder={placeholder || (displayFormat === 'YYYY-MM-DD' ? 'YYYY-MM-DD' : 'DD/MM/YYYY')}
        keyboardType={'numeric'}
        maxLength={displayFormat === 'YYYY-MM-DD' ? 10 : 10}
        onChangeText={handleManualInput}
        onFocus={Platform.OS === 'web' ? undefined : () => {}}
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
            {/* Custom header with month/year and arrows */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
              <TouchableOpacity onPress={goPrevMonth} style={{ padding: 8 }}>
                <Text style={{ fontSize: 18, color: '#374151' }}>{'‹'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPickerMode('month')} style={{ padding: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{headerTitle}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={goNextMonth} style={{ padding: 8 }}>
                <Text style={{ fontSize: 18, color: '#374151' }}>{'›'}</Text>
              </TouchableOpacity>
            </View>

            {pickerMode === 'calendar' && (
              <Calendar
                hideArrows
                current={currentShownISO || isoForCalendar || effectiveMaxDate}
                maxDate={effectiveMaxDate}
                minDate={minDate}
                onMonthChange={(month) => {
                  setCurrentShownISO(partsToISO(month.year, month.month - 1, 1));
                }}
                onDayPress={(day) => {
                  const disp = formatISOToDisplay(day.dateString, displayFormat);
                  handleChange(disp);
                  setVisible(false);
                }}
                theme={{
                  todayTextColor: '#007AFF',
                  arrowColor: '#007AFF',
                  selectedDayBackgroundColor: '#007AFF',
                  selectedDayTextColor: '#FFFFFF',
                }}
              />
            )}

            {pickerMode === 'month' && renderMonthGrid()}
            {pickerMode === 'year' && renderYearDropdown()}

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
