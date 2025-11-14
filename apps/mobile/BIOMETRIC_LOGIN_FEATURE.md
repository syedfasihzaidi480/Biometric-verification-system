# Biometric Login Feature

## Overview

The mobile app now supports **biometric login** using Face ID or Fingerprint authentication. When users enable Biometric Lock in Settings and then sign out or close the app, they can quickly unlock and sign back in using biometric authentication instead of entering their credentials.

## Features

### 🔐 Secure Biometric Authentication
- **Face ID** support (iOS)
- **Fingerprint** support (iOS & Android)
- **Touch ID** support (older iOS devices)
- Automatic fallback to device passcode if biometric fails

### 🚀 Quick Access
- One-tap biometric login from the home screen
- No need to type email/phone and password
- Instant authentication when biometric lock is enabled

### 🛡️ Security
- Credentials are stored securely in device's Secure Storage (Keychain on iOS, Keystore on Android)
- Biometric authentication required before accessing stored credentials
- Works only when user has previously signed in and enabled Biometric Lock

## How It Works

### User Flow

```
┌─────────────────────────────────────┐
│  User opens app (not authenticated) │
└────────────────┬────────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │  Sees Welcome Screen with: │
    │  • Login button            │
    │  • Create Account button   │
    │  • Biometric button        │
    └────────────┬───────────────┘
                 │
                 │ User taps Biometric button
                 ▼
    ┌────────────────────────────┐
    │  Check if biometric setup: │
    │  1. Hardware available?    │
    │  2. Biometrics enrolled?   │
    │  3. Biometric Lock enabled?│
    │  4. Credentials stored?    │
    └────────────┬───────────────┘
                 │
         ┌───────┴───────┐
         │               │
    YES  │               │  NO
         ▼               ▼
┌────────────────┐  ┌─────────────────────┐
│ Prompt for     │  │ Show info alert:    │
│ Face ID /      │  │ • Not available     │
│ Fingerprint    │  │ • Not enrolled      │
└────┬───────────┘  │ • Not enabled       │
     │              │ • Not setup yet     │
     │              └──────┬──────────────┘
     │                     │
     │                     │ Redirect to Login
     │                     ▼
     │              ┌──────────────┐
     │              │ Login Screen │
     │              └──────────────┘
     │
     ▼
┌─────────────────┐
│ Authentication  │
│ Result          │
└────┬────────────┘
     │
┌────┴─────┐
│          │
SUCCESS    FAILED
│          │
▼          ▼
┌──────────────┐  ┌─────────────────┐
│ Restore auth │  │ Show error      │
│ from storage │  │ Alert user      │
│              │  │ Stay on welcome │
│ Navigate to  │  └─────────────────┘
│ main app     │
└──────────────┘
```

### Technical Flow

1. **Setup Phase** (First time):
   - User signs in with email/phone and password
   - Credentials are stored in `expo-secure-store`
   - User enables "Biometric Lock" in Settings
   - Biometric authentication is verified during enablement

2. **Biometric Login Phase** (Subsequent uses):
   - User taps the Biometric button on welcome screen
   - App checks: Hardware → Enrollment → Lock enabled → Credentials stored
   - If all checks pass, prompt for biometric authentication
   - On success, restore auth session from Secure Store
   - User is automatically logged in

## Implementation Details

### Files Modified

#### 1. `apps/mobile/src/app/(tabs)/index.jsx`

**Added Imports:**
```javascript
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { authKey } from '@/utils/auth/store';
import { loadPreferences } from '@/utils/preferences';
```

**Updated Function:**
```javascript
const handleBiometric = async () => {
  if (isAuthenticated) {
    router.push('/(tabs)/verify');
  } else {
    // Biometric login logic
    const prefs = await loadPreferences();
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const storedAuth = await SecureStore.getItemAsync(authKey);

    if (prefs.biometricLock && hasHardware && isEnrolled && storedAuth) {
      const result = await LocalAuthentication.authenticateAsync({...});
      if (result.success) {
        await initiate(); // Restore session
      }
    }
  }
};
```

#### 2. `apps/mobile/src/i18n/translations.js`

**Added English Translations:**
```javascript
auth: {
  // ... existing keys
  unlockWithBiometrics: 'Unlock with Face ID / Fingerprint',
  usePasscode: 'Use Passcode',
  biometricSuccess: 'Success',
  biometricLoginSuccess: 'Biometric authentication successful!',
  biometricFailed: 'Authentication Failed',
  biometricFailedMessage: 'Biometric authentication was not successful...',
  biometricUnavailable: 'Biometric Unavailable',
  biometricUnavailableMessage: 'Your device does not have biometric hardware...',
  biometricNotSetup: 'Biometric Login Not Setup',
  biometricNotSetupMessage: 'Please sign in first and enable Biometric Lock...',
  biometricError: 'An error occurred during biometric authentication...',
}
```

**Added French Translations:**
```javascript
auth: {
  // ... existing keys
  unlockWithBiometrics: 'Déverrouiller avec Face ID / Empreinte digitale',
  usePasscode: 'Utiliser le code',
  biometricSuccess: 'Succès',
  biometricLoginSuccess: 'Authentification biométrique réussie !',
  // ... more French translations
}
```

### Dependencies

The feature uses existing dependencies:
- `expo-local-authentication` - Biometric authentication
- `expo-secure-store` - Secure credential storage
- `@react-native-async-storage/async-storage` - Preferences storage

## User Instructions

### Enabling Biometric Login

1. **First-time Setup:**
   ```
   Open App
     → Sign in with your credentials
     → Go to Settings (Profile tab → Settings icon)
     → Enable "Biometric Lock" toggle
     → Authenticate with Face ID/Fingerprint to confirm
   ```

2. **Using Biometric Login:**
   ```
   Open App (when signed out)
     → Tap the "Biometric" button on welcome screen
     → Authenticate with Face ID/Fingerprint
     → Instantly signed in!
   ```

### Requirements

- Device must have biometric hardware (Face ID sensor or fingerprint reader)
- At least one biometric must be enrolled in device settings
- User must have signed in at least once with credentials
- Biometric Lock must be enabled in app Settings

## Security Considerations

### What's Stored

When Biometric Lock is enabled:
- **Stored:** Authentication token/JWT in Secure Store
- **Stored:** Biometric Lock preference (true/false) in AsyncStorage
- **NOT Stored:** Plain text passwords are never stored
- **NOT Stored:** Email or phone numbers in plain text

### Storage Security

- **iOS:** Uses Keychain Services with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`
- **Android:** Uses Android Keystore system with hardware-backed keys
- **Encryption:** All data in Secure Store is encrypted by the OS
- **Isolation:** Data is sandboxed per app, not accessible by other apps

### Privacy

- Biometric data (fingerprints, face maps) **never leaves the device**
- Apple/Android store biometric data in secure hardware enclaves
- App only receives "success" or "failure" - never actual biometric data
- Biometric authentication is handled entirely by the device OS

## Error Handling

### Scenarios Covered

| Scenario | Behavior |
|----------|----------|
| No biometric hardware | Show alert → Redirect to login |
| No biometrics enrolled | Show alert → Redirect to login |
| Biometric Lock disabled | Show info alert → Redirect to login |
| No credentials stored | Show setup instructions → Redirect to login |
| Biometric auth failed | Show error → Stay on welcome screen |
| Biometric auth cancelled | Silent (no alert) → Stay on welcome screen |
| Hardware error | Show error → Redirect to login |

### Error Messages

All error messages are:
- ✅ Translated (English & French)
- ✅ User-friendly (no technical jargon)
- ✅ Actionable (tell user what to do next)
- ✅ Consistent with app design

## Testing

### Test Scenarios

#### ✅ Happy Path
1. Sign in with credentials
2. Enable Biometric Lock in Settings
3. Sign out or close app
4. Tap Biometric button
5. Authenticate with biometric
6. Should be signed in successfully

#### ⚠️ Error Paths

**No Biometric Hardware:**
```
Simulator → Always shows "unavailable" (expected)
Real device without hardware → Shows unavailable alert
```

**No Biometrics Enrolled:**
```
Device Settings → Face ID & Passcode → Remove all biometrics
Try biometric login → Shows "not enrolled" alert
```

**Biometric Lock Disabled:**
```
Sign in → Go to Settings → Disable Biometric Lock
Sign out → Try biometric login → Shows "not setup" alert
```

**Authentication Failed:**
```
Tap biometric button → Use wrong finger/face
Should show "failed" alert
```

### Testing on Simulators

**iOS Simulator:**
```bash
# Enable Face ID simulation
Hardware menu → Face ID → Enrolled
# Trigger successful authentication
Hardware menu → Face ID → Matching Face
# Trigger failed authentication  
Hardware menu → Face ID → Non-matching Face
```

**Android Emulator:**
```bash
# Enable fingerprint
Extended controls (...) → Fingerprint → Touch the sensor
# Emulator must have secure lock screen enabled
```

## Troubleshooting

### Issue: "Biometric Unavailable" on real device

**Check:**
- Device has Face ID or Touch ID hardware
- Device Settings → Face ID & Passcode → Face ID is enabled
- At least one biometric is enrolled

### Issue: Button always redirects to login

**Check:**
- User has signed in at least once
- Biometric Lock is enabled in Settings
- Credentials are stored (check with React Native Debugger)

### Issue: Authentication succeeds but not logging in

**Check:**
- `initiate()` function is being called
- Auth store is updating correctly
- SecureStore has valid auth token

### Issue: App crashes on biometric prompt

**Check:**
- `expo-local-authentication` is properly installed
- iOS: NSFaceIDUsageDescription in Info.plist
- Android: USE_BIOMETRIC permission in AndroidManifest

## Platform Differences

### iOS
- Uses Face ID on newer devices (iPhone X+)
- Uses Touch ID on older devices with home button
- Prompt shows "Face ID" or "Touch ID" automatically
- Fallback option: "Enter Passcode"

### Android
- Uses fingerprint scanner or face unlock
- Prompt shows "Use fingerprint" or "Use biometric"
- Fallback option: "Use PIN/Pattern"
- May vary by device manufacturer

## Future Enhancements

Potential improvements:

1. **Biometric Login from Login Screen:**
   - Add biometric option directly on login screen
   - Quick toggle between biometric and credential login

2. **Remember Last Login Method:**
   - Track if user prefers biometric login
   - Auto-prompt on app open

3. **Biometric for Transactions:**
   - Require biometric for sensitive operations
   - Confirm verification submissions

4. **Multi-factor Authentication:**
   - Combine biometric with additional security layer
   - Time-based OTP + biometric

5. **Biometric Settings:**
   - Choose which actions require biometrics
   - Set timeout for biometric requirement

---

**Last Updated:** November 14, 2025  
**Feature Status:** ✅ Production Ready  
**Supported Platforms:** iOS, Android  
**Minimum Requirements:** 
- iOS 11+ (Face ID/Touch ID)
- Android 6.0+ (Fingerprint API)

