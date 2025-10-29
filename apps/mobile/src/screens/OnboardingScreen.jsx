import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Globe, Check } from 'lucide-react-native';
import { useTranslation } from '@/i18n/useTranslation';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { t, changeLanguage, currentLanguage, getSupportedLanguages } = useTranslation();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const supportedLanguages = getSupportedLanguages();

  const handleLanguageSelect = async (languageCode) => {
    await changeLanguage(languageCode);
    setShowLanguageSelector(false);
  };

  const handleGetStarted = () => {
    router.push('/registration');
  };

  const currentLangInfo = supportedLanguages.find(lang => lang.code === currentLanguage);

  const renderLanguageItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        item.code === currentLanguage && styles.languageItemSelected
      ]}
      onPress={() => handleLanguageSelect(item.code)}
    >
      <View style={styles.languageContent}>
        <Text style={[
          styles.languageName,
          item.code === currentLanguage && styles.languageNameSelected
        ]}>
          {item.nativeName}
        </Text>
        <Text style={[
          styles.languageSubtext,
          item.code === currentLanguage && styles.languageSubtextSelected
        ]}>
          {item.name}
        </Text>
      </View>
      {item.code === currentLanguage && (
        <Check size={20} color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header with language selector */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setShowLanguageSelector(true)}
        >
          <Globe size={20} color="#666" />
          <Text style={styles.languageButtonText}>
            {currentLangInfo?.nativeName || 'English'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Content */}
        <View style={styles.content}>
          {/* Logo/Icon placeholder */}
          <View style={styles.iconContainer}>
            <View style={styles.iconPlaceholder}>
              <Text style={styles.iconText}>🔊</Text>
            </View>
          </View>

          {/* Welcome text */}
          <Text style={styles.title}>
            {t('onboarding.welcome')}
          </Text>
          <Text style={styles.subtitle}>
            {t('onboarding.subtitle')}
          </Text>

          {/* Feature highlights */}
          <View style={styles.features}>
            <FeatureItem
              icon="🎙️"
              title={t('voiceEnrollment.title')}
              subtitle={t('voiceEnrollment.subtitle')}
            />
            <FeatureItem
              icon="🤳"
              title={t('liveness.title')}
              subtitle={t('liveness.subtitle')}
            />
            <FeatureItem
              icon="📄"
              title={t('document.title')}
              subtitle={t('document.subtitle')}
            />
          </View>
        </View>

        {/* Get Started Button */}
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={handleGetStarted}
        >
          <Text style={styles.getStartedButtonText}>
            {t('onboarding.getStarted')}
          </Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.terms}>
          {t('registration.terms')}
        </Text>
      </ScrollView>

      {/* Language Selector Modal */}
      <Modal
        visible={showLanguageSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t('onboarding.selectLanguage')}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLanguageSelector(false)}
            >
              <Text style={styles.closeButtonText}>
                {t('common.close')}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.languagePrompt}>
            {t('onboarding.languagePrompt')}
          </Text>

          <FlatList
            data={supportedLanguages}
            renderItem={renderLanguageItem}
            keyExtractor={(item) => item.code}
            style={styles.languageList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </View>
  );
}

function FeatureItem({ icon, title, subtitle }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  languageButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 60,
    marginBottom: 40,
  },
  iconPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconText: {
    fontSize: 52,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 26,
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  features: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  getStartedButton: {
    marginHorizontal: 24,
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  terms: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    paddingHorizontal: 24,
    marginTop: 16,
    lineHeight: 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  languagePrompt: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  languageList: {
    flex: 1,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  languageItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  languageContent: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  languageNameSelected: {
    color: '#007AFF',
  },
  languageSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  languageSubtextSelected: {
    color: '#007AFF',
  },
});