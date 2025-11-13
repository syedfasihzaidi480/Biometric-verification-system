# Biometric Label Update

## Overview
Replaced "Identity Verification" with "Biometric" throughout the mobile app for a more concise and modern label.

## Changes Made

### 1. Translation Files (`apps/mobile/src/i18n/translations.js`)

#### English (en)
```javascript
verify: {
  title: 'Biometric',  // Changed from 'Identity Verification'
  subtitle: 'Complete all steps to verify your identity',
  // ... rest of translations unchanged
}
```

#### French (fr)
```javascript
verify: {
  title: 'Biométrique',  // Changed from 'Vérification d'identité'
  subtitle: 'Complétez toutes les étapes pour vérifier votre identité',
  // ... rest of translations unchanged
}
```

### 2. Onboarding Screen (`apps/mobile/src/screens/OnboardingScreen.jsx`)

#### Slide 2 - Title Update
```javascript
{
  id: "2",
  title: "Fast & Easy\nBiometric",  // Changed from "Identity Verification"
  description: "Complete your verification in minutes with our streamlined process...",
  icon: Fingerprint,
  colors: ["#f093fb", "#f5576c"],
}
```

#### Slide 4 - Description Update
```javascript
{
  id: "4",
  title: "Ready to Get\nStarted?",
  description: "Join thousands of verified users. Your secure biometric journey begins now.",
  // Changed from "identity verification journey"
  icon: CheckCircle,
  colors: ["#43e97b", "#38f9d7"],
}
```

## Visual Impact

### Before
```
┌─────────────────────────────┐
│  👤  Identity Verification  │
└─────────────────────────────┘
```

### After
```
┌─────────────────────────────┐
│  👤  Biometric              │
└─────────────────────────────┘
```

## Files Modified

1. **`apps/mobile/src/i18n/translations.js`**
   - Updated English `verify.title`: "Identity Verification" → "Biometric"
   - Updated French `verify.title`: "Vérification d'identité" → "Biométrique"

2. **`apps/mobile/src/screens/OnboardingScreen.jsx`**
   - Updated onboarding slide 2 title: "Identity Verification" → "Biometric"
   - Updated onboarding slide 4 description: "identity verification journey" → "biometric journey"

## Locations Updated

✅ **Verify Tab Title** - Shows "Biometric" (English) or "Biométrique" (French)  
✅ **Onboarding Screen** - Slide 2 title updated  
✅ **Onboarding Screen** - Slide 4 description updated  
✅ **Bottom Navigation** - Tab label updated (uses translation key)

## User-Facing Changes

### Home Screen Bottom Tabs
- **English**: "Identity Verification" → "Biometric"
- **French**: "Vérification d'identité" → "Biométrique"

### Onboarding Experience
- **Slide 2**: Now says "Fast & Easy Biometric"
- **Slide 4**: Now says "Your secure biometric journey begins now"

## Benefits

1. **Shorter Label**: "Biometric" is much shorter than "Identity Verification"
2. **Modern Terminology**: "Biometric" is a widely recognized tech term
3. **Better UI Fit**: Shorter text fits better in tab navigation
4. **Clearer Purpose**: Immediately communicates the use of biometric data
5. **Consistent Branding**: Aligns with modern security app terminology

## Testing

✅ No linter errors  
✅ All translations updated consistently  
✅ Both English and French versions updated  
✅ Onboarding screens reflect new terminology  

## Summary

The change from "Identity Verification" to "Biometric" provides a more concise, modern label that better fits mobile UI constraints while clearly communicating the app's biometric authentication features.

