import { Platform } from 'react-native';
import { apiFetchJson } from '@/utils/api';
import { useAuthStore } from '@/utils/auth/store';
import Constants from 'expo-constants';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Lazy load expo-notifications to avoid Expo Go issues
let NotificationsModule = null;
const getNotifications = async () => {
  if (isExpoGo) return null;
  if (NotificationsModule) return NotificationsModule;
  
  try {
    NotificationsModule = await import('expo-notifications');
    return NotificationsModule;
  } catch (e) {
    console.warn('[syncNotificationPreference] Could not load expo-notifications:', e.message);
    return null;
  }
};

// Best-effort sync; safe to call without awaiting in UI
export async function syncNotificationPreference(enabled) {
  try {
    let token = null;
    if (enabled) {
      try {
        // Only load and use notifications in development builds, not Expo Go
        const Notifications = await getNotifications();
        if (Notifications) {
          // On SDK 53+, projectId is auto-resolved when using EAS Updates. Fallback without.
          const res = await Notifications.getExpoPushTokenAsync();
          token = res?.data || null;
        }
      } catch (e) {
        // No token available (e.g., missing config or Expo Go); still sync enabled flag
        console.warn('[syncNotificationPreference] Token fetch failed:', e.message);
        token = null;
      }
    }

    const auth = useAuthStore.getState().auth;
    const userId = auth?.user?.id || auth?.user?.auth_user_id || null;

    await apiFetchJson('/api/notifications/preferences', {
      method: 'POST',
      body: {
        enabled: !!enabled,
        token,
        platform: Platform.OS,
        userId,
      },
    });
  } catch (e) {
    // Non-fatal; log and continue
    console.warn('[syncNotificationPreference] Failed', e?.message);
  }
}
