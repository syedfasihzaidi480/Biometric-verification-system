import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { authKey } from '../auth/store';

/**
 * Clear locally stored user/session data on the device.
 * - Deletes auth session from SecureStore
 * - Clears AsyncStorage (preferences, caches). Optionally limit to known keys.
 *
 * @param {{ includePreferences?: boolean }} options
 */
export async function clearLocalData(options = {}) {
  const { includePreferences = true } = options;
  // Securely remove persisted auth/session
  try {
    await SecureStore.deleteItemAsync(authKey);
  } catch (e) {
    console.warn('[clearLocalData] SecureStore delete failed', e);
  }

  // Remove preferences and other AsyncStorage keys
  try {
    if (includePreferences) {
      await AsyncStorage.clear();
    } else {
      const keys = [
        'pref.notifications',
        'pref.biometricLock',
        'pref.darkMode',
        'pref.analytics',
        'pref.personalized',
      ];
      await AsyncStorage.multiRemove(keys);
    }
  } catch (e) {
    console.warn('[clearLocalData] AsyncStorage clear failed', e);
  }
}

export default clearLocalData;
