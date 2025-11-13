import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Globe, Check } from 'lucide-react-native';
import { useTranslation } from '@/i18n/useTranslation';

export default function LanguageSelector({ compact = false, style }) {
  const { currentLanguage, changeLanguage, getSupportedLanguages } = useTranslation();
  const [visible, setVisible] = useState(false);
  const supportedLanguages = getSupportedLanguages();

  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage) || supportedLanguages[0];

  const handleSelectLanguage = async (languageCode) => {
    await changeLanguage(languageCode);
    setVisible(false);
  };

  if (compact) {
    return (
      <>
        <TouchableOpacity
          style={[styles.compactButton, style]}
          onPress={() => setVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Change language"
        >
          <Globe size={20} color="#007AFF" />
          <Text style={styles.compactText}>{currentLang.code.toUpperCase()}</Text>
        </TouchableOpacity>

        <Modal
          visible={visible}
          transparent
          animationType="fade"
          onRequestClose={() => setVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Language</Text>
                <TouchableOpacity onPress={() => setVisible(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={supportedLanguages}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.languageOption}
                    onPress={() => handleSelectLanguage(item.code)}
                  >
                    <View style={styles.languageInfo}>
                      <Text style={styles.languageName}>{item.nativeName}</Text>
                      <Text style={styles.languageSubtext}>{item.name}</Text>
                    </View>
                    {currentLanguage === item.code && (
                      <Check size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.button, style]}
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Change language"
      >
        <Globe size={20} color="#6B7280" />
        <View style={styles.textContainer}>
          <Text style={styles.languageLabel}>Language</Text>
          <Text style={styles.languageValue}>{currentLang.nativeName}</Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={supportedLanguages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.languageOption}
                  onPress={() => handleSelectLanguage(item.code)}
                >
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageName}>{item.nativeName}</Text>
                    <Text style={styles.languageSubtext}>{item.name}</Text>
                  </View>
                  {currentLanguage === item.code && (
                    <Check size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  compactText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 6,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  languageValue: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '400',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  languageSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
});

