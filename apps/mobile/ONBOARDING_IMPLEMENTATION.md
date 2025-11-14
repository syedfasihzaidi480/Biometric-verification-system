# Onboarding Implementation - First Time Only

## Overview

The mobile app now shows the onboarding screens **only once** when the app is first installed. After the user completes or skips the onboarding, they will be taken directly to the main app on subsequent launches.

## How It Works

### 1. **Storage Mechanism**

The app uses **AsyncStorage** to persist the onboarding completion status:

- **Key:** `@onboarding_completed`
- **Value:** `'true'` when completed, or `null`/`undefined` when not seen yet
- **Location:** Device local storage (persists across app sessions)

### 2. **Flow Architecture**

```
App Launch
    ↓
index.jsx (/)
    ↓
Check AsyncStorage for @onboarding_completed
    ↓
    ├─ Not Found → Show Onboarding Screen
    │       ↓
    │   User completes/skips onboarding
    │       ↓
    │   Set @onboarding_completed = 'true'
    │       ↓
    │   Navigate to Main App (tabs)
    │
    └─ Found (= 'true') → Navigate directly to Main App (tabs)
```

### 3. **Key Files**

#### `apps/mobile/src/app/index.jsx`
- **Purpose:** Entry point that checks onboarding status
- **Logic:**
  1. Shows loading spinner while checking AsyncStorage
  2. Checks if user has seen onboarding
  3. Redirects to either `/onboarding` or `/(tabs)/` based on status

#### `apps/mobile/src/screens/OnboardingScreen.jsx`
- **Purpose:** Beautiful multi-slide onboarding experience
- **Features:**
  - 4 informative slides with animations
  - Skip button (available on first 3 slides)
  - Next/Get Started button
  - Smooth horizontal scroll navigation
  - Progress dots indicator

#### `apps/mobile/src/utils/onboarding.js`
- **Purpose:** AsyncStorage utility functions
- **Functions:**
  - `hasSeenOnboarding()` - Returns `true` if user completed onboarding
  - `setOnboardingCompleted()` - Marks onboarding as completed
  - `resetOnboarding()` - Clears the flag (for testing only)

## Bug Fixed

### The Problem
The app was calling `resetOnboarding()` on every launch, which cleared the onboarding flag and caused users to see the onboarding screens repeatedly.

**Before (Buggy Code):**
```javascript
const checkOnboardingStatus = async () => {
  try {
    // TEMPORARY: Uncomment the line below to reset onboarding and see it again
    await resetOnboarding();  // ❌ This was active!
    
    const hasSeen = await hasSeenOnboarding();
    setShowOnboarding(!hasSeen);
  }
};
```

**After (Fixed Code):**
```javascript
const checkOnboardingStatus = async () => {
  try {
    // FOR TESTING ONLY: Uncomment the line below to reset onboarding and see it again
    // await resetOnboarding();  // ✅ Now properly commented out
    
    const hasSeen = await hasSeenOnboarding();
    setShowOnboarding(!hasSeen);
  }
};
```

## User Experience

### First Launch
1. App shows loading spinner (very brief)
2. Onboarding screen appears with 4 slides:
   - **Slide 1:** Secure Biometric Verification
   - **Slide 2:** Fast & Easy Biometric
   - **Slide 3:** AI-Powered Liveness Detection
   - **Slide 4:** Ready to Get Started?
3. User can either:
   - Swipe through slides and tap "Next"
   - Tap "Skip" button (on first 3 slides)
   - Tap "Get Started" on final slide
4. User is taken to the main app tabs

### Subsequent Launches
1. App shows loading spinner (very brief)
2. User is taken **directly** to main app tabs
3. No onboarding screens shown

## Testing the Onboarding

### To Test First-Time Experience

#### Option 1: Uninstall and Reinstall
```bash
# For iOS Simulator
npx expo run:ios --device

# For Android Emulator
npx expo run:android --device
```
Then uninstall the app from the device/simulator and reinstall.

#### Option 2: Clear AsyncStorage Programmatically

**Temporarily enable the reset function:**

Edit `apps/mobile/src/app/index.jsx`:
```javascript
const checkOnboardingStatus = async () => {
  try {
    // Uncomment this line temporarily:
    await resetOnboarding();
    
    const hasSeen = await hasSeenOnboarding();
    // ...
  }
};
```

**Important:** Remember to comment it out again after testing!

#### Option 3: Clear AsyncStorage via Dev Tools

In development mode:
1. Shake device/press `Cmd+D` (iOS) or `Cmd+M` (Android)
2. Select "Debug Remote JS"
3. Open Chrome DevTools Console
4. Run:
```javascript
require('@react-native-async-storage/async-storage').default.removeItem('@onboarding_completed')
```

#### Option 4: Clear Storage via React Native Debugger

1. Open React Native Debugger
2. Go to "AsyncStorage" tab
3. Find and delete `@onboarding_completed` key

### Verify It's Working

1. **First Launch:** Should show onboarding
2. **Complete Onboarding:** Tap through or skip
3. **Kill App:** Force close the app completely
4. **Reopen App:** Should go directly to tabs (no onboarding)

## Onboarding Content

### Current Slides

| Slide | Title | Description | Icon | Colors |
|-------|-------|-------------|------|--------|
| 1 | Secure Biometric Verification | Advanced biometric authentication using facial recognition and voice analysis to keep your identity secure. | Shield | Purple gradient |
| 2 | Fast & Easy Biometric | Complete your verification in minutes with our streamlined process. Just scan your documents and verify your identity. | Fingerprint | Pink gradient |
| 3 | AI-Powered Liveness Detection | State-of-the-art AI technology ensures you're a real person, preventing fraud and protecting your data. | Scan | Blue gradient |
| 4 | Ready to Get Started? | Join thousands of verified users. Your secure biometric journey begins now. | CheckCircle | Green gradient |

### Customizing Onboarding Content

To modify the onboarding slides, edit the `onboardingData` array in `apps/mobile/src/screens/OnboardingScreen.jsx`:

```javascript
const onboardingData = [
  {
    id: "1",
    title: "Your Title Here\nWith Line Break",
    description: "Your description text...",
    icon: IconComponent,  // from lucide-react-native
    colors: ["#startColor", "#endColor"],  // gradient colors
    iconColor: "#fff",
  },
  // ... more slides
];
```

## API Reference

### `hasSeenOnboarding()`
```javascript
import { hasSeenOnboarding } from '@/utils/onboarding';

const hasSeen = await hasSeenOnboarding();
// Returns: true if user completed onboarding, false otherwise
```

### `setOnboardingCompleted()`
```javascript
import { setOnboardingCompleted } from '@/utils/onboarding';

await setOnboardingCompleted();
// Sets the onboarding flag to 'true' in AsyncStorage
```

### `resetOnboarding()`
```javascript
import { resetOnboarding } from '@/utils/onboarding';

await resetOnboarding();
// Clears the onboarding flag (FOR TESTING ONLY)
```

## Troubleshooting

### Problem: Onboarding shows every time
**Solution:** Check that `resetOnboarding()` is commented out in `apps/mobile/src/app/index.jsx`

### Problem: Onboarding never shows
**Solution:** The flag might be set. Use Option 2 or 3 above to clear it.

### Problem: App stuck on loading screen
**Solution:** Check console for errors. AsyncStorage might have permissions issues.

### Problem: Navigation doesn't work after onboarding
**Solution:** Verify `router.replace("/(tabs)/")` path matches your tab structure

## Future Enhancements

Potential improvements for the onboarding experience:

1. **Version-based Onboarding:** Show onboarding again when major features are added
2. **Localization:** Translate onboarding content based on user language
3. **Skip Detection:** Track which slides users skip to improve content
4. **Video/Animations:** Add more engaging media content
5. **Interactive Tutorial:** Add interactive elements to demonstrate features

## Security Considerations

- Onboarding state is stored locally (not sent to server)
- No sensitive data is stored in AsyncStorage for onboarding
- Clearing AsyncStorage only resets UI state, not authentication tokens

---

**Last Updated:** November 14, 2025
**Maintained by:** Development Team

