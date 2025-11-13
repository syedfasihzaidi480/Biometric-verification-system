# Phone Number as Password Authentication System

## Overview
The authentication system has been completely redesigned to use phone numbers as passwords instead of traditional text passwords. The password field is labeled simply as "Password" and uses a numeric dialpad for input, without displaying country code pickers to maintain a clean, simple interface.

## Changes Made

### 1. LoginScreen (`apps/mobile/src/screens/LoginScreen.jsx`)
**Complete Rewrite - Root Level Changes**

#### Previous Implementation
- Used traditional text password field
- Single TextInput with `secureTextEntry` for password
- Keyboard type: default text keyboard

#### New Implementation
- Uses phone number as password
- Implements custom `PasswordPhoneInput` component with:
  - Simple Lock icon (no country picker)
  - Clean, minimal interface labeled as "Password"
  - **Numeric dialpad** (via `keyboardType="phone-pad"`)
  - No visual validation icons
  - No helper text or country code display

#### State Management
```javascript
const [formData, setFormData] = useState({
  email: "",
  loginPhone: "",          // For phone-based login
  passwordPhone: "",        // Phone number used as password
});

const [isLoginPhoneValid, setIsLoginPhoneValid] = useState(false);
```

#### Validation
```javascript
// Phone login validation
if (!formData.loginPhone.trim()) {
  newErrors.loginPhone = t("login.phoneRequired");
} else if (!isLoginPhoneValid) {
  newErrors.loginPhone = t("login.validPhone");
}

// Password validation
if (!formData.passwordPhone.trim()) {
  newErrors.passwordPhone = t("login.passwordRequired");
}
```

#### UI Components
- **Mode Toggle**: Switch between Email and Phone login
- **Login Field**: 
  - Email: Traditional TextInput
  - Phone: PhoneNumberInput component (with country picker)
- **Password Field**: PasswordPhoneInput component (simple, no country picker, opens numeric dialpad)
- **Label**: Simply shows "Password" - no mention of phone numbers

### 2. RegistrationScreen (`apps/mobile/src/screens/RegistrationScreen.jsx`)
**Root Level Changes - Modified Field Structure**

#### Changes
1. **State Update**:
   ```javascript
   const [formData, setFormData] = useState({
     fullName: "",
     dateOfBirth: "",
     pensionNumber: "",
     phoneNumber: "",           // Primary phone number
     email: "",
     passwordPhone: "",         // Phone number as password (NEW)
   });
   
   const [isPasswordPhoneValid, setIsPasswordPhoneValid] = useState(false);
   ```

2. **Validation Update**:
   ```javascript
   // Simplified password validation
   if (!formData.passwordPhone.trim()) {
     newErrors.passwordPhone = t('registration.passwordRequired');
   }
   ```

3. **UI Replacement**:
   - Removed: Traditional password TextInput with secureTextEntry
   - Added: PasswordPhoneInput component (simple, clean design)
   - Label: Just shows "Password" without mentioning phone numbers
   - No country picker or helper text

4. **API Integration**:
   ```javascript
   // Updated to send phone password to API
   body: {
     name: formData.fullName.trim(),
     phone: formData.phoneNumber.trim(),
     email: formData.email.trim() || undefined,
     password: formData.passwordPhone.trim(),  // Changed from formData.password
     date_of_birth: isoDate,
     pension_number: formData.pensionNumber.trim(),
     preferred_language: currentLanguage,
   }
   ```

### 3. New PasswordPhoneInput Component (`apps/mobile/src/components/PasswordPhoneInput.jsx`)
**Created New Simplified Component** for password input:
- Clean, minimal design with Lock icon
- No country code picker (keeps UI simple)
- **Numeric dialpad** via `keyboardType="phone-pad"`
- No validation indicators
- Allows phone number characters: digits, spaces, hyphens, parentheses, plus sign
- Labeled simply as "Password" in the UI

### 4. Translation Updates (`apps/mobile/src/i18n/translations.js`)

**No special translations needed** - Uses existing password translation keys:

#### English (en)
```javascript
login: {
  password: 'Password',
  passwordPlaceholder: '••••••••',
  passwordRequired: 'Password is required',
  // ... other login translations
},

registration: {
  password: 'Password',
  passwordPlaceholder: 'Create a password',
  passwordRequired: 'Password is required',
  // ... other registration translations
}
```

#### French (fr)
```javascript
login: {
  password: 'Mot de passe',
  passwordPlaceholder: '••••••••',
  passwordRequired: 'Le mot de passe est requis',
  // ... other login translations
},

registration: {
  password: 'Mot de passe',
  passwordPlaceholder: 'Créer un mot de passe',
  passwordRequired: 'Le mot de passe est requis',
  // ... other registration translations
}
```

**Note**: The translations don't mention "phone number" - the password field appears as a regular password field to the user, with the only difference being the numeric keyboard.

## User Experience

### Login Flow
1. User selects login mode (Email or Phone)
2. User enters their email or phone number (with country picker for phone mode)
3. User taps "Password" field → **Numeric dialpad automatically opens**
4. User enters their password (which is actually a phone number, but UI doesn't indicate this)
5. User submits credentials

### Registration Flow
1. User enters full name
2. User enters date of birth (YYYY-MM-DD format)
3. User enters pension number
4. User enters phone number (with country code picker)
5. User optionally enters email
6. User taps "Password" field → **Numeric dialpad automatically opens**
7. User enters password (appears as a regular password field)
8. User creates account

## Security Considerations

1. **Simplified Validation**: Password field only checks if input is provided (non-empty)
2. **Phone Number Format**: Accepts any format with digits and standard phone characters (+, -, (), spaces)
3. **No Visual Indicators**: Password field maintains privacy by not showing validation status
4. **Backend Integration**: Password field still sends to the same API endpoint, but now contains a phone number instead of text
5. **User Privacy**: By labeling it simply as "Password", users don't reveal the authentication mechanism to onlookers

## Technical Benefits

1. **Clean UI**: Password field appears as a standard password input - simple and familiar
2. **Numeric Input**: Keyboard automatically switches to numeric dialpad for easier input
3. **No Complexity**: Removed validation indicators and country pickers from password field
4. **Privacy**: Users can't tell it's a phone number-based system by looking at the screen
5. **Reusable Components**: Created dedicated PasswordPhoneInput component for this purpose
6. **International Support**: Login phone field still has full country code picker support

## Backend Compatibility

The frontend changes are designed to be backward compatible with the existing backend:
- The password field in the API request now receives a phone number string
- The backend should treat this as a regular password string
- No backend changes are required unless additional validation is desired

## Testing Checklist

- [ ] Login with phone number + password (numeric dialpad)
- [ ] Login with email + password (numeric dialpad)
- [ ] Registration with all fields including password
- [ ] Password field shows Lock icon only (no country picker)
- [ ] Password field labeled as "Password" (not "Phone Number Password")
- [ ] Numeric dialpad opens automatically when tapping password field
- [ ] Country code picker works for login phone field
- [ ] French translation displays correctly ("Mot de passe")
- [ ] English translation displays correctly ("Password")
- [ ] Error messages display correctly
- [ ] Form submission with valid data
- [ ] Form submission with empty password (proper error handling)
- [ ] Password accepts phone number characters (+, digits, spaces, etc.)

## Future Enhancements

1. **OTP Verification**: Consider adding OTP verification for the password phone number
2. **Biometric Authentication**: Add face/fingerprint authentication as an alternative
3. **Password Recovery**: Implement recovery flow using phone number verification
4. **Two-Factor Authentication**: Use both phone numbers for enhanced security

