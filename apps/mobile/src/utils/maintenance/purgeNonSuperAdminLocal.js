import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authKey } from '../auth/store';
import { clearLocalData } from './clearLocalData';

/**
 * Purge all locally stored user/session data EXCEPT if the stored auth user is a Super Admin.
 * Super Admin is identified by auth.role === 'super_admin' OR matching provided super admin email.
 *
 * Behaviour:
 *  - If no auth stored: clears everything (delegates to clearLocalData).
 *  - If auth exists and NOT super admin: clears everything.
 *  - If auth exists and IS super admin: preserves SecureStore auth item, optionally clears preferences.
 *
 * @param {{ superAdminEmail?: string, preservePreferences?: boolean }} options
 *        superAdminEmail: optional email to match for super admin in addition to role check.
 *        preservePreferences: when true AND super admin detected, preferences (AsyncStorage) are kept.
 * @returns {Promise<{ status: 'cleared' | 'preserved', reason: string }>} Summary of action.
 */
export async function purgeNonSuperAdminLocal(options = {}) {
  const { superAdminEmail, preservePreferences = true } = options;
  let rawAuth = null;
  try {
    rawAuth = await SecureStore.getItemAsync(authKey);
  } catch (e) {
    // Non-fatal; treat as missing auth
  }

  let auth = null;
  if (rawAuth) {
    try { auth = JSON.parse(rawAuth); } catch {}
  }

  const isSuperAdmin = !!auth && (
    auth.role === 'super_admin' || (superAdminEmail && auth.email && auth.email.toLowerCase() === superAdminEmail.toLowerCase())
  );

  if (!auth) {
    await clearLocalData({ includePreferences: true });
    return { status: 'cleared', reason: 'no_auth_present' };
  }

  if (!isSuperAdmin) {
    // Remove everything including auth
    await clearLocalData({ includePreferences: true });
    return { status: 'cleared', reason: 'non_super_admin_auth' };
  }

  // Super admin present; decide what to clear
  if (!preservePreferences) {
    // Clear everything (including preferences) but restore auth afterwards to be explicit
    await clearLocalData({ includePreferences: true });
    await SecureStore.setItemAsync(authKey, rawAuth);
    return { status: 'preserved', reason: 'super_admin_auth_preferences_cleared_but_auth_restored' };
  }

  // Keep preferences, just ensure stray non-whitelisted keys are not user-specific (best-effort)
  try {
    const keys = await AsyncStorage.getAllKeys();
    // If any user-* keys exist (hypothetical), remove them.
    const userKeys = keys.filter(k => /^user\./.test(k));
    if (userKeys.length) await AsyncStorage.multiRemove(userKeys);
  } catch {}

  // Ensure auth is persisted (redundant but safe)
  await SecureStore.setItemAsync(authKey, rawAuth);
  return { status: 'preserved', reason: 'super_admin_auth_preserved_preferences_kept' };
}

export default purgeNonSuperAdminLocal;