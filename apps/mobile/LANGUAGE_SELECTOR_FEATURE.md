# Language Selector on Home Page

## Overview
Added a language selector button to the top-right corner of the home page (before login) for easy language switching without needing to navigate to settings.

## Changes Made

### 1. New Component: `LanguageSelector.jsx`

**Location**: `apps/mobile/src/components/LanguageSelector.jsx`

#### Features
- **Compact Mode**: Small button with globe icon + language code (EN, FR, SO, etc.)
- **Full Mode**: Full-width button with language name (for settings page)
- **Modal Picker**: Clean modal with all available languages
- **Visual Feedback**: Check mark shows current selected language
- **Native Names**: Languages shown in their native script

#### Props
```javascript
<LanguageSelector
  compact={boolean}      // Use compact style (default: false)
  style={object}        // Additional styling
/>
```

#### Usage Examples

**Compact Mode (Home Page)**:
```javascript
import LanguageSelector from '@/components/LanguageSelector';

<LanguageSelector compact style={{ marginTop: 10 }} />
```

**Full Mode (Settings Page)**:
```javascript
import LanguageSelector from '@/components/LanguageSelector';

<LanguageSelector />
```

---

### 2. Updated Home Screen

**Location**: `apps/mobile/src/app/(tabs)/index.jsx`

**Changes**:
- Added `LanguageSelector` import
- Added top bar with language selector (positioned absolutely)
- Language selector only appears on **unauthenticated** (before login) view

**Visual Position**:
```
┌─────────────────────────────────┐
│                        🌐 EN ←  │  Top-right corner
│                                 │
│          [INPS LOGO]            │
│                                 │
│      Welcome to INPS            │
│  Your trusted insurance system  │
│                                 │
│        [Login Button]           │
│    [Create Account Button]      │
│                                 │
│  [Identity] [Help] [Support]    │
└─────────────────────────────────┘
```

---

## Supported Languages

The selector shows all languages configured in the app:

| Code | English Name | Native Name    |
|------|-------------|----------------|
| `en` | English     | English        |
| `fr` | French      | Français       |
| `so` | Somali      | Soomaali       |
| `am` | Amharic     | አማርኛ          |
| `om` | Oromo       | Afaan Oromoo   |

---

## User Experience Flow

### Before Login (Home Page)
1. **User sees globe icon with "EN" in top-right**
2. **Taps the language button**
3. **Modal opens with language list**
4. **Selects a language (e.g., "Français")**
5. **App immediately switches to French**
6. **All UI text updates** (Welcome to INPS → Bienvenue à l'INPS)
7. **Language preference saved** to device storage

### After Login
- Language selector not shown on home (already authenticated)
- Users can still change language in Settings → Language

---

## Technical Details

### State Management
- Uses **Zustand** store (`useLanguageStore`)
- Persists to **AsyncStorage** with key `'user-language-preference'`
- Loads saved preference on app start

### Translation System
- Translation hook: `useTranslation()`
- Translation keys: `t('key.path')`
- Fallback chain: Selected language → English → Default value

### Storage
```javascript
// Language preference stored as:
AsyncStorage.setItem('user-language-preference', 'fr');

// Retrieved on app start:
const savedLanguage = await AsyncStorage.getItem('user-language-preference');
```

---

## Styling

### Compact Button Style
```javascript
{
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FFFFFF',
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
}
```

### Modal Style
- Semi-transparent dark overlay
- White rounded modal card
- List of languages with native names
- Check mark for current selection
- Close button (✕) in header

---

## Integration Points

### Home Page (Before Login)
```javascript
// apps/mobile/src/app/(tabs)/index.jsx

if (!isAuthenticated) {
  return (
    <View>
      {/* Language Selector - Top Right */}
      <View style={styles.topBar}>
        <LanguageSelector compact />
      </View>
      
      {/* Rest of home content */}
    </View>
  );
}
```

### Settings Page (After Login)
```javascript
// Can be integrated in settings like:
<TouchableOpacity onPress={() => setShowLanguageModal(true)}>
  <View>
    <Globe />
    <Text>Language</Text>
    <Text>{currentLanguage}</Text>
  </View>
</TouchableOpacity>

// Or use the full LanguageSelector component:
<LanguageSelector />
```

---

## File Structure

```
apps/mobile/src/
├── components/
│   └── LanguageSelector.jsx         ✨ NEW
├── app/
│   └── (tabs)/
│       └── index.jsx                ✨ UPDATED
└── i18n/
    ├── useTranslation.js            (existing)
    └── translations.js              (existing)
```

---

## Testing Checklist

- [ ] Language button appears on home page (before login)
- [ ] Tapping button opens language modal
- [ ] All 5 languages shown in modal
- [ ] Current language has check mark
- [ ] Selecting language closes modal
- [ ] UI text updates immediately
- [ ] Language preference persists after app restart
- [ ] Works on iOS
- [ ] Works on Android
- [ ] Works on Web (if applicable)
- [ ] Modal closes when tapping outside
- [ ] Close button (✕) works
- [ ] Language button NOT shown after login on home
- [ ] Settings page language selector still works

---

## Accessibility

- ✅ `accessibilityRole="button"` on touchable elements
- ✅ `accessibilityLabel` for screen readers
- ✅ High contrast for visibility
- ✅ Large touch targets (44x44 minimum)
- ✅ Modal dismissible with back button (Android)

---

## Screenshots

### Compact Button (Top-Right)
```
┌──────────┐
│ 🌐 EN    │
└──────────┘
```

### Language Modal
```
┌─────────────────────────────────┐
│ Select Language           ✕     │
├─────────────────────────────────┤
│ English                         │
│ English                      ✓  │
├─────────────────────────────────┤
│ Français                        │
│ French                          │
├─────────────────────────────────┤
│ Soomaali                        │
│ Somali                          │
├─────────────────────────────────┤
│ አማርኛ                            │
│ Amharic                         │
├─────────────────────────────────┤
│ Afaan Oromoo                    │
│ Oromo                           │
└─────────────────────────────────┘
```

---

## API

### LanguageSelector Component

#### Props

| Prop      | Type    | Default | Description                              |
|-----------|---------|---------|------------------------------------------|
| `compact` | boolean | false   | Use compact style (icon + code)          |
| `style`   | object  | {}      | Additional style for the button          |

#### Methods

The component internally uses:
- `changeLanguage(code)` - Change current language
- `getSupportedLanguages()` - Get list of available languages
- `currentLanguage` - Current selected language code

---

## Future Enhancements

- [ ] Add language auto-detection based on device locale
- [ ] Add more languages (Arabic, Spanish, Portuguese)
- [ ] Show flag icons instead of globe
- [ ] Add language search in modal (for many languages)
- [ ] Show language percentage completion
- [ ] Add RTL support for Arabic/Hebrew
- [ ] Animate language switch
- [ ] Show "Beta" badge for partially translated languages

---

## Troubleshooting

### Language not switching
- Check AsyncStorage permissions
- Verify language code matches `supportedLanguages`
- Check console for errors

### UI not updating after language change
- Ensure all text uses `t('key')` translation function
- Check that component re-renders on language change
- Verify Zustand store is updating

### Modal not opening
- Check if button has `onPress` handler
- Verify Modal `visible` state
- Check for conflicting z-index issues

---

## Related Files

- `apps/mobile/src/i18n/useTranslation.js` - Translation hook and store
- `apps/mobile/src/i18n/translations.js` - All language strings
- `apps/mobile/src/app/settings.jsx` - Settings page (if exists)
- `apps/mobile/src/components/LanguageSelector.jsx` - This component

---

## Support

For issues or questions:
- Check translation keys in `translations.js`
- Verify language is in `supportedLanguages` array
- Test with React Native Debugger
- Check AsyncStorage for saved preference

---

**Last Updated**: November 2024  
**Version**: 1.0.0  
**Component Author**: Development Team

