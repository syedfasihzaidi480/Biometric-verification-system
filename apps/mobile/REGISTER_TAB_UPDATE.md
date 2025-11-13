# Register Tab Added to Bottom Navigation

## Overview
Added the "Register" tab to the bottom navigation bar, positioning it as the 4th tab in the bottom-right corner.

## Changes Made

### File: `apps/mobile/src/app/(tabs)/_layout.jsx`

#### 1. Added UserPlus Icon Import
```javascript
import { Home, ShieldCheck, User, UserPlus } from 'lucide-react-native';
```

#### 2. Enabled Register Tab in Navigation
**Before:**
```javascript
<Tabs.Screen
  name="register"
  options={{
    href: null, // This hides it from the tab bar
  }}
/>
```

**After:**
```javascript
<Tabs.Screen
  name="register"
  options={{
    title: 'Register',
    tabBarIcon: ({ color, size = 24 }) => (
      <UserPlus color={color} size={size} />
    ),
  }}
/>
```

## Bottom Navigation Layout

The bottom navigation now has 4 tabs in this order:

```
┌──────────┬──────────┬──────────┬──────────┐
│   Home   │  Verify  │ Profile  │ Register │
│    🏠    │    🛡️    │    👤    │    👤+   │
└──────────┴──────────┴──────────┴──────────┘
   Tab 1      Tab 2      Tab 3      Tab 4
```

### Tab Details

| Position | Name | Icon | Label |
|----------|------|------|-------|
| Bottom-Left | index | Home 🏠 | Home |
| Center-Left | verify | ShieldCheck 🛡️ | Verify |
| Center-Right | profile | User 👤 | Profile |
| **Bottom-Right** | **register** | **UserPlus 👤+** | **Register** |

## Icon Used

**UserPlus** icon from `lucide-react-native`:
- Shows a person silhouette with a plus sign
- Perfect for registration/sign-up functionality
- Consistent with the other Lucide icons in the tab bar

## Visual Result

The Register tab now appears at the bottom-right corner with:
- ✅ UserPlus icon (person with + symbol)
- ✅ "Register" label
- ✅ Blue color when active (#3B82F6)
- ✅ Gray color when inactive (#6B7280)
- ✅ Consistent styling with other tabs

## Benefits

1. **Easy Access**: Users can quickly navigate to registration from anywhere
2. **Clear Icon**: UserPlus icon clearly indicates registration/sign-up
3. **Consistent Design**: Matches the style of other navigation tabs
4. **Bottom-Right Position**: Placed as requested in the fourth position

## Navigation Behavior

When users tap the Register tab:
- The app navigates to `/register` route
- The UserPlus icon turns blue (active state)
- Users can access the registration/profile completion screens

## Testing

✅ No linter errors
✅ Icon imported correctly
✅ Tab configured with proper icon and title
✅ Positioned as the 4th tab (bottom-right)

## Summary

The Register tab is now visible in the bottom navigation bar at the bottom-right corner, using the UserPlus icon to clearly indicate its registration/sign-up purpose.

