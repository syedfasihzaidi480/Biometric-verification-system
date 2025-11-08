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
import { useAuth } from '@/utils/auth/useAuth';
import * as LocalAuthentication from 'expo-local-authentication';
import Constants from 'expo-constants';
import { PREF_KEYS, loadPreferences, setPreference } from '@/utils/preferences';
import { useTheme } from '@/utils/theme/ThemeProvider';
import { syncNotificationPreference } from '@/utils/notifications/syncPreference';
import { resetOnboarding } from '@/utils/onboarding';
import { apiFetchJson } from '@/utils/api';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Lazy load notifications module only when needed
let NotificationsModule = null;
const getNotifications = async () => {
  if (isExpoGo) return null;
  if (NotificationsModule) return NotificationsModule;
  
  try {
    NotificationsModule = await import('expo-notifications');
    return NotificationsModule;
  } catch (e) {
    console.warn('[SettingsScreen] Could not load expo-notifications:', e.message);
    return null;
  }
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const { isAuthenticated, signIn, signOut } = useAuth();
  const { isDark, setDark, colors } = useTheme();

  const [notifications, setNotifications] = useState(true);
  const [biometricLock, setBiometricLock] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  React.useEffect(() => {
    (async () => {
      const prefs = await loadPreferences();
      setNotifications(prefs.notifications);
      setBiometricLock(prefs.biometricLock);
      setDarkMode(prefs.darkMode);
    })();
  }, []);

  // Supported languages for the app (default: English)
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'so', name: 'Somali', nativeName: 'Soomaali' },
  ];

  const handleLanguageChange = () => {
    Alert.alert(
      t('settings.changeLanguage'),
      t('settings.selectLanguage'),
      languages
        .map((lang) => ({
          text: `${lang.nativeName} (${lang.name})`,
          onPress: () => {
            changeLanguage(lang.code);
            // Best-effort: persist language preference to server immediately
            (async () => {
              try {
                await apiFetchJson('/api/profile', { method: 'PUT', body: { preferred_language: lang.code } });
              } catch {}
            })();
            Alert.alert(t('settings.languageChangedTitle'), t('settings.languageChangedMessage', { name: lang.name }));
          },
          style: lang.code === currentLanguage ? 'destructive' : 'default',
        }))
        .concat([
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
        ])
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
            signOut();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleToggleNotifications = async (value) => {
    if (value) {
      // Lazy load notifications module
      const Notifications = await getNotifications();
      
      if (!Notifications) {
        Alert.alert(
          'Notifications Unavailable',
          'Push notifications require a development build. They are not available in Expo Go. Please create a development build to use this feature.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Notifications Disabled', 'Permission not granted. Enable notifications in system settings to receive alerts.');
        return; // keep previous state
      }
    }
    setNotifications(value);
    setPreference(PREF_KEYS.notifications, value);
    // Try to sync with backend (best-effort)
    try { await syncNotificationPreference(value); } catch {}
  };

  const handleToggleBiometric = async (value) => {
    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        Alert.alert('Biometrics Unavailable', 'Your device does not have biometric hardware or no biometrics are enrolled.');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Enable Biometric Lock' });
      if (!result.success) {
        Alert.alert('Authentication Failed', 'Could not enable Biometric Lock.');
        return;
      }
    }
    setBiometricLock(value);
    setPreference(PREF_KEYS.biometricLock, value);
  };

  const handleToggleDarkMode = async (value) => {
    setDarkMode(value);
    setPreference(PREF_KEYS.darkMode, value);
    // Update global theme immediately
    setDark(!!value);
  };

  const settingSections = [
    {
      title: t('settings.sections.account'),
      items: [
        {
          icon: <User size={20} color="#007AFF" />,
          title: t('settings.items.profile.title'),
          subtitle: t('settings.items.profile.subtitle'),
          onPress: () => router.push('/profile'),
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
      title: t('settings.sections.privacySecurity'),
      items: [
        {
          icon: <Bell size={20} color="#007AFF" />,
          title: t('settings.items.notifications.title'),
          subtitle: t('settings.items.notifications.subtitle'),
          hasSwitch: true,
          switchValue: notifications,
          onSwitchChange: handleToggleNotifications,
        },
        {
          icon: <Shield size={20} color="#007AFF" />,
          title: t('settings.items.biometric.title'),
          subtitle: t('settings.items.biometric.subtitle'),
          hasSwitch: true,
          switchValue: biometricLock,
          onSwitchChange: handleToggleBiometric,
        },
        {
          icon: <Lock size={20} color="#007AFF" />,
          title: t('settings.items.privacy.title'),
          subtitle: t('settings.items.privacy.subtitle'),
          onPress: () => router.push('/privacy'),
        },
      ],
    },
    {
      title: t('settings.sections.appSettings'),
      items: [
        {
          icon: <Moon size={20} color="#007AFF" />,
          title: t('settings.items.darkMode.title'),
          subtitle: t('settings.items.darkMode.subtitle'),
          hasSwitch: true,
          switchValue: darkMode,
          onSwitchChange: handleToggleDarkMode,
        },
        {
          icon: <Info size={20} color="#FF9500" />,
          title: t('settings.items.resetOnboarding.title'),
          subtitle: t('settings.items.resetOnboarding.subtitle'),
          onPress: async () => {
            Alert.alert(
              t('settings.resetOnboarding.confirmTitle'),
              t('settings.resetOnboarding.confirmMessage'),
              [
                {
                  text: t('common.cancel'),
                  style: 'cancel',
                },
                {
                  text: t('settings.resetOnboarding.resetAction'),
                  onPress: async () => {
                    await resetOnboarding();
                    Alert.alert(
                      t('settings.resetOnboarding.successTitle'),
                      t('settings.resetOnboarding.successMessage'),
                      [
                        {
                          text: t('common.ok'),
                          onPress: () => router.replace('/'),
                        },
                      ]
                    );
                  },
                },
              ]
            );
          },
        },
      ],
    },
    {
      title: t('settings.sections.support'),
      items: [
        {
          icon: <HelpCircle size={20} color="#007AFF" />,
          title: t('settings.items.help.title'),
          subtitle: t('settings.items.help.subtitle'),
          onPress: () => {
            Alert.alert(t('settings.items.help.title'), t('settings.items.help.comingSoon'));
          },
        },
        {
          icon: <Info size={20} color="#007AFF" />,
          title: t('settings.about'),
          subtitle: t('settings.items.about.subtitle'),
          onPress: () => {
            Alert.alert(
              t('settings.items.about.title'),
              t('settings.items.about.message')
            );
          },
        },
      ],
    },
  ];

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}> 
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 }}>Please Sign In</Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 16 }}>Sign in to access Settings</Text>
        <TouchableOpacity onPress={signIn} style={{ backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}> 
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}> 
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {settingSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>{section.title}</Text>
            <View style={[styles.sectionItems, { backgroundColor: colors.surface }]}> 
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
                      <Text style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
                      {item.subtitle && (
                        <Text style={[styles.settingSubtitle, { color: colors.muted }]}>{item.subtitle}</Text>
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
                      <ChevronRight size={20} color={colors.muted} />
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
            style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: '#FEE2E2' }]} 
            onPress={handleLogout}
          >
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>{t('settings.logout')}</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={[styles.versionText, { color: colors.muted }]}>
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