# Biometric Login - User-Initiated Only

## Update Summary

The biometric authentication has been updated to work **only when the user explicitly clicks the Biometric button** on the welcome screen. The automatic biometric prompt that appeared before the welcome screen has been removed.

## Changes Made

### Before ❌
```
App Launch
    ↓
Automatic Biometric Check
    ↓
If Biometric Lock enabled → Prompt immediately
    ↓
User must authenticate before seeing anything
    ↓
Welcome Screen
```

**Problem:** Users were forced to authenticate with biometrics even before seeing the welcome screen if Biometric Lock was enabled. This was too aggressive and didn't give users a choice.

### After ✅
```
App Launch
    ↓
Welcome Screen (no prompt)
    ↓
User clicks "Biometric" button
    ↓
Check if Biometric Lock enabled
    ↓
Prompt for Face ID / Fingerprint
    ↓
Login on success
```

**Solution:** Users now see the welcome screen first and can choose to use biometric login by clicking the Biometric button.

## File Modified

### `apps/mobile/src/app/_layout.jsx`

**Removed:**
- Automatic biometric authentication check on app launch
- "App Locked" screen that forced users to authenticate
- Complex logic for checking biometric lock before showing UI
- Unused imports: `LocalAuthentication`, `SecureStore`, `authKey`, `loadPreferences`, `View`, `Text`, `TouchableOpacity`, `useState`

**Kept:**
- Simple auth initialization from stored credentials
- Normal app flow with navigation stack

**Before (Complex):**
```javascript
useEffect(() => {
  (async () => {
    try {
      const prefs = await loadPreferences();
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const storedAuth = await SecureStore.getItemAsync(authKey);

      // If biometric lock is enabled, prompt immediately
      if (prefs.biometricLock && hasHardware && isEnrolled && storedAuth) {
        const res = await LocalAuthentication.authenticateAsync({...});
        if (res.success) {
          await initiate();
          setNeedsUnlock(false);
        } else {
          setNeedsUnlock(true); // Show "App Locked" screen
        }
      } else {
        await initiate();
        setNeedsUnlock(false);
      }
    } catch (e) {
      await initiate();
      setNeedsUnlock(false);
    } finally {
      setCheckingLock(false);
      SplashScreen.hideAsync();
    }
  })();
}, [initiate]);
```

**After (Simple):**
```javascript
useEffect(() => {
  (async () => {
    try {
      // Simply initialize auth from stored credentials (no biometric prompt)
      await initiate();
    } catch (e) {
      console.error('Error initializing auth:', e);
    } finally {
      SplashScreen.hideAsync();
    }
  })();
}, [initiate]);
```

## User Experience

### Current Flow

1. **User opens app** → Shows welcome screen immediately
2. **User sees options:**
   - Login (with credentials)
   - Create Account
   - **Biometric** (fingerprint icon button)
   - Help & Support
   - Support

3. **User clicks "Biometric" button:**
   - App checks if Biometric Lock is enabled
   - If enabled and set up → Shows Face ID/Fingerprint prompt
   - If not enabled → Shows informative message
   - On success → User is logged in
   - On failure → User stays on welcome screen

### Benefits

✅ **User Choice:** Users can choose when to use biometric authentication  
✅ **Clear Intent:** Clicking "Biometric" button makes user's intention clear  
✅ **No Interruption:** Users see the welcome screen immediately  
✅ **Flexible:** Users can still use regular login or create account  
✅ **Transparent:** Users know what will happen when they click the button  

### What Still Works

The biometric login feature on the welcome screen remains fully functional:
- ✅ Checks if biometric hardware is available
- ✅ Verifies biometrics are enrolled
- ✅ Confirms Biometric Lock is enabled in Settings
- ✅ Validates credentials are stored
- ✅ Prompts for Face ID/Fingerprint
- ✅ Restores session on successful authentication
- ✅ Shows appropriate error messages
- ✅ Supports both English and French

## Settings Integration

The "Biometric Lock" toggle in Settings still works as before:
- **Purpose:** Enables/disables biometric login feature
- **Location:** Profile tab → Settings icon → Biometric Lock toggle
- **Effect:** When enabled, the Biometric button on welcome screen will work
- **Security:** Requires biometric authentication to enable the feature

## Testing

### Test the Updated Flow

1. **Fresh App Launch (Not Logged In):**
   ```
   Open app → Should see welcome screen immediately (no biometric prompt)
   ```

2. **Click Biometric Button (Not Set Up):**
   ```
   Click "Biometric" → Should show message about setting up biometric login
   → Click OK → Should redirect to Login screen
   ```

3. **Enable Biometric Lock:**
   ```
   Login with credentials
   → Go to Profile → Settings
   → Enable "Biometric Lock" toggle
   → Authenticate when prompted
   → Sign out
   ```

4. **Click Biometric Button (After Setup):**
   ```
   Open app → Welcome screen appears
   → Click "Biometric" button
   → Face ID/Fingerprint prompt appears
   → Authenticate successfully
   → Should be logged in!
   ```

5. **Verify No Auto-Prompt:**
   ```
   Force close app
   → Reopen app
   → Should see welcome screen (NO automatic biometric prompt)
   → Biometric only triggers when user clicks the button
   ```

## Code Comparison

### Lines of Code Reduced
- **Before:** ~117 lines
- **After:** ~73 lines
- **Reduction:** ~44 lines (37% simpler)

### Complexity Reduced
- **Before:** 3 state variables, complex conditional logic, error handling
- **After:** Simple initialization, single try-catch

## Migration Notes

### No Breaking Changes
- Existing users with Biometric Lock enabled will not experience any issues
- The feature still works; it's just triggered manually instead of automatically
- All stored credentials and preferences remain intact
- Settings toggle behavior unchanged

### User Impact
- **Positive:** Users have more control over when to use biometric authentication
- **Positive:** App launches faster (no biometric prompt delay)
- **Positive:** Less intrusive experience
- **Neutral:** Users need to click one button to use biometric login (not automatic)

## Technical Details

### Removed Features
- ❌ Automatic biometric authentication on app launch
- ❌ "App Locked" intermediate screen
- ❌ `needsUnlock` state management
- ❌ `checkingLock` state management

### Retained Features
- ✅ Biometric button on welcome screen
- ✅ Manual biometric authentication via button click
- ✅ Biometric Lock toggle in Settings
- ✅ Secure credential storage
- ✅ All error handling and user messaging

### Architecture
The change simplifies the app architecture by:
1. Removing a layer of complexity from the root layout
2. Moving all biometric logic to a single location (home screen button)
3. Making the user flow more linear and predictable
4. Reducing state management overhead

## Documentation Updates

Related documentation files:
- ✅ `BIOMETRIC_LOGIN_FEATURE.md` - Main feature documentation (still accurate)
- ✅ This file - Update explaining the change

The main feature documentation remains accurate because it describes the biometric button functionality, which hasn't changed. Only the automatic prompt before the welcome screen has been removed.

---

**Date:** November 14, 2025  
**Change Type:** UX Improvement  
**Impact:** Low (Enhancement, no breaking changes)  
**Status:** ✅ Complete

