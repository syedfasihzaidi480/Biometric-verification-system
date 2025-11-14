import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { loadPreferences } from '../preferences';

export const authKey = `${process.env.EXPO_PUBLIC_PROJECT_GROUP_ID}-jwt`;

/**
 * This store manages the authentication state of the application.
 */
export const useAuthStore = create((set) => ({
  isReady: false,
  auth: null,
  setAuth: async (auth) => {
    if (auth) {
      await SecureStore.setItemAsync(authKey, JSON.stringify(auth));
      set({ auth });
    } else {
      // When signing out, check if biometric lock is enabled
      // If enabled, keep the token in SecureStore for biometric re-authentication
      // If disabled, delete the token
      const prefs = await loadPreferences();
      if (!prefs.biometricLock) {
        await SecureStore.deleteItemAsync(authKey);
      }
      // Clear in-memory auth state regardless
      set({ auth: null });
    }
  },
}));

/**
 * This store manages the state of the authentication modal.
 */
export const useAuthModal = create((set) => ({
  isOpen: false,
  mode: 'signup',
  open: (options) => set({ isOpen: true, mode: options?.mode || 'signup' }),
  close: () => set({ isOpen: false }),
}));