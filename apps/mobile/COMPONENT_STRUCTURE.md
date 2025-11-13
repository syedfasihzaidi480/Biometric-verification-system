# Mobile App Registration Component Structure

## Component Hierarchy

```
apps/mobile/
├── src/
│   ├── components/
│   │   ├── DateInput.jsx               ✨ UPDATED
│   │   │   ├── Calendar picker with modal
│   │   │   ├── Manual text input with auto-formatting
│   │   │   ├── Future date blocking
│   │   │   └── DD/MM/YYYY ↔ YYYY-MM-DD conversion
│   │   │
│   │   └── PhoneNumberInput.jsx        ✨ NEW
│   │       ├── Country picker modal
│   │       ├── Country flag display
│   │       ├── Auto country code (+XX)
│   │       ├── Real-time validation
│   │       └── E.164 format output
│   │
│   ├── screens/
│   │   └── RegistrationScreen.jsx      ✨ UPDATED
│   │       ├── Uses DateInput
│   │       ├── Uses PhoneNumberInput
│   │       ├── Enhanced validation
│   │       └── Future date blocking
│   │
│   └── app/
│       └── (tabs)/
│           └── register/
│               └── index.jsx           ✨ UPDATED
│                   ├── Uses DateInput
│                   ├── Uses PhoneNumberInput
│                   ├── Profile completion
│                   └── Enhanced validation
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  REGISTRATION SCREEN                        │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │   DateInput.jsx      │  │ PhoneNumberInput.jsx │        │
│  │                      │  │                      │        │
│  │ • Calendar picker    │  │ • Country picker     │        │
│  │ • Manual entry       │  │ • Auto country code  │        │
│  │ • Auto-format        │  │ • Real-time validate │        │
│  │ • Block future dates │  │ • Visual feedback    │        │
│  └──────────────────────┘  └──────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     VALIDATION LAYER                        │
│                                                             │
│  Date of Birth:                Phone Number:               │
│  ✓ Format: DD/MM/YYYY         ✓ Country selected          │
│  ✓ Valid date                 ✓ Valid for country         │
│  ✓ Not future                 ✓ E.164 format              │
│  ✓ Convert to YYYY-MM-DD      ✓ libphonenumber-js         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API REQUEST                            │
│                                                             │
│  POST /api/auth/register                                   │
│  {                                                          │
│    "date_of_birth": "1990-12-25",  ← YYYY-MM-DD           │
│    "phone": "+14155551234",        ← E.164 format          │
│    ...                                                      │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE                               │
│                                                             │
│  date_of_birth: DATE        (YYYY-MM-DD)                   │
│  phone: VARCHAR(20)         (+XXXXXXXXXXXX)                │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Props & State Flow

### DateInput Component

```javascript
// Component Interface
<DateInput
  value={string}              // DD/MM/YYYY or YYYY-MM-DD
  onChangeText={function}     // (value: string) => void
  placeholder={string}        // Default: "DD/MM/YYYY"
  blockFutureDates={boolean}  // Default: true
  minDate={string}           // YYYY-MM-DD format
  maxDate={string}           // YYYY-MM-DD format
  style={object}
  textInputStyle={object}
/>

// Internal State
{
  visible: boolean,           // Calendar modal visibility
  isoForCalendar: string,    // YYYY-MM-DD for calendar component
  effectiveMaxDate: string   // Computed max date (today if blocking future)
}

// Helper Functions
toDisplay(iso)  // YYYY-MM-DD → DD/MM/YYYY
toISO(disp)     // DD/MM/YYYY → YYYY-MM-DD
getTodayISO()   // Returns today in YYYY-MM-DD
```

### PhoneNumberInput Component

```javascript
// Component Interface
<PhoneNumberInput
  value={string}                    // +XXXXXXXXXXXX (E.164)
  onChangeText={function}           // (value: string) => void
  onValidationChange={function}     // (isValid: boolean) => void
  placeholder={string}              // Default: "Phone number"
  error={boolean}                   // Show error styling
  style={object}
  textInputStyle={object}
/>

// Internal State
{
  countryCode: string,         // ISO 3166-1 alpha-2 (e.g., "US")
  callingCode: string,         // Country calling code (e.g., "1")
  nationalNumber: string,      // Digits only
  isValid: boolean,           // Validation status
  showPicker: boolean         // Country picker visibility
}

// Helper Functions
parsePhoneNumber(value)      // Parse E.164 to components
isValidPhoneNumber(value)    // Validate using libphonenumber-js
formatNationalNumber(num)    // Format for display
```

---

## Validation State Management

```
┌─────────────────────────────────────────────────────────────┐
│              REGISTRATION SCREEN STATE                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  formData: {                                               │
│    fullName: string,                                       │
│    dateOfBirth: string,        ← DD/MM/YYYY (display)      │
│    phoneNumber: string,        ← +XXXXXXXXXXXX (E.164)     │
│    email: string,                                          │
│    password: string,                                       │
│    pensionNumber: string                                   │
│  }                                                          │
│                                                             │
│  errors: {                                                 │
│    fullName: string,                                       │
│    dateOfBirth: string,                                    │
│    phoneNumber: string,                                    │
│    email: string,                                          │
│    password: string,                                       │
│    pensionNumber: string                                   │
│  }                                                          │
│                                                             │
│  isPhoneValid: boolean    ← From PhoneNumberInput          │
│  isLoading: boolean                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Validation Flow:
1. User inputs data → Component validates locally
2. Component updates parent state
3. On submit → Form validates all fields
4. If valid → Convert formats and send to API
5. If invalid → Show specific error messages
```

---

## Integration Points

### 1. RegistrationScreen.jsx (New User)
```
Purpose: Create new account
Location: src/screens/RegistrationScreen.jsx
Route: /registration

Fields:
├── Full Name           (TextInput)
├── Date of Birth       (DateInput) ✨
├── Pension Number      (TextInput)
├── Phone Number        (PhoneNumberInput) ✨
├── Email (optional)    (TextInput)
└── Password            (TextInput)

Flow:
Register → Auto sign-in → Voice Enrollment
```

### 2. RegisterScreen (Profile Completion)
```
Purpose: Complete profile for authenticated users
Location: src/app/(tabs)/register/index.jsx
Route: /(tabs)/register

Fields:
├── Full Name           (TextInput)
├── Phone Number        (PhoneNumberInput) ✨
├── Date of Birth       (DateInput) ✨
├── ID Document Type    (Buttons)
└── Document Upload     (FilePicker)

Flow:
Sign In → Complete Profile → Upload Documents
```

---

## State Synchronization

```
Parent Component (RegistrationScreen)
    │
    ├─→ DateInput
    │   │
    │   └─→ onChangeText(value)
    │       └─→ Updates formData.dateOfBirth
    │
    └─→ PhoneNumberInput
        │
        ├─→ onChangeText(value)
        │   └─→ Updates formData.phoneNumber
        │
        └─→ onValidationChange(isValid)
            └─→ Updates isPhoneValid state
                └─→ Used in form validation
```

---

## Error Handling Flow

```
┌─────────────────────────────────────┐
│     User Input                      │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Component-Level Validation         │
│  • Format checking                  │
│  • Real-time feedback               │
│  • Visual indicators                │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Form-Level Validation (onSubmit)  │
│  • All fields present               │
│  • All formats correct              │
│  • Business rules met               │
└─────────────────────────────────────┘
              │
              ├─→ Valid ──→ API Call
              │
              └─→ Invalid ──┐
                           │
                           ▼
              ┌─────────────────────────┐
              │  Show Error Messages    │
              │  • Field-specific       │
              │  • User-friendly        │
              │  • Actionable           │
              └─────────────────────────┘
```

---

## File Dependencies

```
DateInput.jsx
├── react-native (View, TextInput, Modal, TouchableOpacity, Text)
├── lucide-react-native (Calendar icon)
└── react-native-calendars (Calendar component)

PhoneNumberInput.jsx
├── react-native (View, TextInput, TouchableOpacity, Text)
├── react-native-country-picker-modal (CountryPicker)
└── libphonenumber-js (parsePhoneNumber, isValidPhoneNumber)

RegistrationScreen.jsx
├── DateInput.jsx
├── PhoneNumberInput.jsx
├── @/utils/api (apiFetchJson)
├── @/utils/auth/credentials (signInWithCredentials)
└── @/i18n/useTranslation (t, currentLanguage)

RegisterScreen (index.jsx)
├── DateInput.jsx
├── PhoneNumberInput.jsx
├── @/utils/api (apiFetchJson)
├── @/utils/auth/useAuth (isAuthenticated, signIn)
└── @/i18n/useTranslation (t)
```

---

## Format Specifications

### Date Formats
```
Display:    DD/MM/YYYY    (e.g., 25/12/1990)
Storage:    YYYY-MM-DD    (e.g., 1990-12-25)
API:        YYYY-MM-DD    (e.g., 1990-12-25)
Database:   DATE type     (YYYY-MM-DD)
```

### Phone Formats
```
Display:    National      (e.g., (415) 555-1234)
Input:      Digits only   (e.g., 4155551234)
Storage:    E.164         (e.g., +14155551234)
API:        E.164         (e.g., +14155551234)
Database:   VARCHAR(20)   (+XXXXXXXXXXXX)
```

---

## Testing Structure

```
Unit Tests (Components)
├── DateInput.jsx
│   ├── Format conversion (DD/MM/YYYY ↔ YYYY-MM-DD)
│   ├── Future date blocking
│   ├── Manual input formatting
│   └── Calendar selection
│
└── PhoneNumberInput.jsx
    ├── Country code selection
    ├── Phone validation
    ├── E.164 formatting
    └── Visual feedback

Integration Tests (Screens)
├── RegistrationScreen
│   ├── Form validation
│   ├── Submit with valid data
│   ├── Error handling
│   └── Navigation flow
│
└── RegisterScreen
    ├── Profile update
    ├── Document upload
    └── Validation errors

End-to-End Tests
└── Complete registration flow
    ├── Fill all fields
    ├── Submit form
    ├── Verify API call
    └── Check navigation
```

---

## Performance Considerations

```
Optimization Strategies:
├── useMemo for date conversions
├── useCallback for event handlers
├── Debounce phone validation (optional)
├── Lazy load country picker data
└── Memoize country list

Memory Management:
├── Close modals when not in use
├── Clear refs after unmount
└── Avoid storing large country data in state
```

---

## Accessibility Features

```
DateInput:
├── Accessible calendar button
├── Screen reader labels
├── Keyboard navigation support
└── High contrast mode support

PhoneNumberInput:
├── Accessible country picker
├── Screen reader labels
├── Keyboard input support
└── Focus management
```

---

## Browser/Platform Compatibility

```
✓ iOS (React Native)
✓ Android (React Native)
✓ Web (React Native Web)
  ├── Calendar picker works
  ├── Country picker works
  └── Phone validation works

Platform-Specific Adjustments:
├── Keyboard type (iOS vs Android)
├── Date picker UI (native vs modal)
└── Focus behavior
```

---

## Summary

This component structure provides:
- ✅ Reusable, modular components
- ✅ Clear separation of concerns
- ✅ Type-safe data flow
- ✅ Comprehensive validation
- ✅ Excellent user experience
- ✅ Cross-platform compatibility
- ✅ Easy to test and maintain

