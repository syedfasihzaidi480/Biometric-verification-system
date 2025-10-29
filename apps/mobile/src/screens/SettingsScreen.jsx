import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Globe, 
  User, 
  Bell, 
  Shield, 
  HelpCircle, 
  Info,
  LogOut,
  ChevronRight,
  Moon,
  Lock
} from 'lucide-react-native';
import { useTranslation } from '@/i18n/useTranslation';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t, currentLanguage, changeLanguage } = useTranslation();

  const [notifications, setNotifications] = useState(true);
  const [biometricLock, setBiometricLock] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'so', name: 'Somali', nativeName: 'Soomaali' },
    { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
    { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo' }
  ];

  const handleLanguageChange = () => {
    Alert.alert(
      t('settings.changeLanguage'),
      'Select your preferred language',
      languages.map(lang => ({
        text: `${lang.nativeName} (${lang.name})`,
        onPress: () => {
          changeLanguage(lang.code);
          Alert.alert('Language Changed', `Language changed to ${lang.name}`);
        },
        style: lang.code === currentLanguage ? 'destructive' : 'default'
      })).concat([{
        text: 'Cancel',
        style: 'cancel'
      }])
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            // TODO: Clear user session
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const settingSections = [
    {
      title: 'Account',
      items: [
        {
          icon: <User size={20} color="#007AFF" />,
          title: 'Profile',
          subtitle: 'Manage your account information',
          onPress: () => {
            Alert.alert('Profile', 'Profile management coming soon');
          },
        },
        {
          icon: <Globe size={20} color="#007AFF" />,
          title: t('settings.language'),
          subtitle: languages.find(l => l.code === currentLanguage)?.nativeName,
          onPress: handleLanguageChange,
        },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        {
          icon: <Bell size={20} color="#007AFF" />,
          title: 'Notifications',
          subtitle: 'Manage notification preferences',
          hasSwitch: true,
          switchValue: notifications,
          onSwitchChange: setNotifications,
        },
        {
          icon: <Shield size={20} color="#007AFF" />,
          title: 'Biometric Lock',
          subtitle: 'Use face/fingerprint to unlock',
          hasSwitch: true,
          switchValue: biometricLock,
          onSwitchChange: setBiometricLock,
        },
        {
          icon: <Lock size={20} color="#007AFF" />,
          title: 'Privacy Settings',
          subtitle: 'Manage your data and privacy',
          onPress: () => {
            Alert.alert('Privacy', 'Privacy settings coming soon');
          },
        },
      ],
    },
    {
      title: 'App Settings',
      items: [
        {
          icon: <Moon size={20} color="#007AFF" />,
          title: 'Dark Mode',
          subtitle: 'Toggle dark theme',
          hasSwitch: true,
          switchValue: darkMode,
          onSwitchChange: setDarkMode,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: <HelpCircle size={20} color="#007AFF" />,
          title: 'Help & Support',
          subtitle: 'Get help and contact support',
          onPress: () => {
            Alert.alert('Help', 'Help & Support coming soon');
          },
        },
        {
          icon: <Info size={20} color="#007AFF" />,
          title: t('settings.about'),
          subtitle: 'App version and information',
          onPress: () => {
            Alert.alert(
              'About Voice Biometrics',
              'Version 1.0.0\n\nSecure identity verification made simple.\n\n© 2025 Voice Biometrics Inc.'
            );
          },
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {settingSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionItems}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.lastSettingItem,
                  ]}
                  onPress={item.onPress}
                  disabled={item.hasSwitch}
                >
                  <View style={styles.settingItemLeft}>
                    <View style={styles.settingIcon}>
                      {item.icon}
                    </View>
                    <View style={styles.settingText}>
                      <Text style={styles.settingTitle}>{item.title}</Text>
                      {item.subtitle && (
                        <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.settingItemRight}>
                    {item.hasSwitch ? (
                      <Switch
                        value={item.switchValue}
                        onValueChange={item.onSwitchChange}
                        trackColor={{ false: '#D1D5DB', true: '#007AFF' }}
                        thumbColor="#FFFFFF"
                      />
                    ) : (
                      <ChevronRight size={20} color="#9CA3AF" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>{t('settings.logout')}</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>
            {t('settings.version')} 1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionItems: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingItemRight: {
    marginLeft: 12,
  },
  logoutSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  versionSection: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});