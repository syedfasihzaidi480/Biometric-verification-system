import AsyncStorage from '@react-native-async-storage/async-storage';

export const PREF_KEYS = {
  notifications: 'pref.notifications',
  biometricLock: 'pref.biometricLock',
  darkMode: 'pref.darkMode',
  analytics: 'pref.analytics',
  personalized: 'pref.personalized',
};

export async function loadPreferences() {
  try {
    const [notifications, biometricLock, darkMode, analytics, personalized] = await Promise.all([
      AsyncStorage.getItem(PREF_KEYS.notifications),
      AsyncStorage.getItem(PREF_KEYS.biometricLock),
      AsyncStorage.getItem(PREF_KEYS.darkMode),
      AsyncStorage.getItem(PREF_KEYS.analytics),
      AsyncStorage.getItem(PREF_KEYS.personalized),
    ]);
    return {
      notifications: notifications === null ? true : notifications === 'true',
      biometricLock: biometricLock === 'true',
      darkMode: darkMode === 'true',
      analytics: analytics === null ? true : analytics === 'true',
      personalized: personalized === null ? true : personalized === 'true',
    };
  } catch (e) {
    console.warn('Failed to load preferences', e);
    return { notifications: true, biometricLock: false, darkMode: false, analytics: true, personalized: true };
  }
}

export async function setPreference(key, value) {
  try {
    await AsyncStorage.setItem(key, String(!!value));
  } catch (e) {
    console.warn('Failed to save preference', key, e);
  }
}
