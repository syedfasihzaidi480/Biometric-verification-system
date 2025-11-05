# Admin User Details - Testing Checklist

## ✅ Pre-Testing Setup

- [ ] Web server is running (`npm run dev` in apps/web)
- [ ] MongoDB connection is active
- [ ] Admin account exists and is logged in
- [ ] At least one test user with verification data exists

## 🔍 API Testing

### User Details API (`/api/admin/users/[id]`)
- [ ] Returns user basic information (name, email, phone)
- [ ] Returns additional fields (pension_number, address, city, country, preferred_language)
- [ ] Returns voice_profile data with all new fields
- [ ] Returns facial_verification data with liveness image
- [ ] Returns documents array with all documents
- [ ] Returns verification_requests with enhanced data
- [ ] Handles invalid user ID gracefully
- [ ] Requires admin authentication

### Users List API (`/api/admin/users`)
- [ ] Returns users list with pagination
- [ ] Summary includes face_verified count
- [ ] Summary statistics are correct
- [ ] Search functionality works
- [ ] Filter by status works

## 🎨 Frontend Testing

### Users List Page (`/admin/users`)

#### Summary Cards (Top Section)
- [ ] All 5 cards display correctly
- [ ] Total Users count is accurate
- [ ] Verified count is accurate
- [ ] Voice count is accurate
- [ ] Face count is accurate (NEW)
- [ ] Document count is accurate
- [ ] Icons display correctly

#### Users Table
- [ ] Table loads with user data
- [ ] User names display correctly
- [ ] Contact info (phone, email) displays
- [ ] Verification badges show correctly:
  - [ ] Voice badge (🎤)
  - [ ] Face badge (📸) - NEW
  - [ ] Document badge (📄)
- [ ] Status badges display (Verified/Unverified)
- [ ] Registration dates display
- [ ] Pagination works correctly
- [ ] Search functionality works
- [ ] Filter dropdown works
- [ ] Rows are clickable

### User Details Sidebar

#### Opening/Closing
- [ ] Sidebar opens when clicking a user row
- [ ] Loading spinner shows while fetching data
- [ ] Sidebar slides in from the right
- [ ] Background overlay appears
- [ ] X button closes sidebar
- [ ] Clicking outside closes sidebar
- [ ] Sidebar is scrollable

#### User Information Section
- [ ] User name displays at top
- [ ] User ID displays
- [ ] Verification badge shows correct status
- [ ] Phone number displays (if available)
- [ ] Email displays (if available)
- [ ] Date of birth displays (if available)
- [ ] Pension number displays (if available) - NEW
- [ ] Address displays (if available) - NEW
- [ ] City and country display (if available) - NEW
- [ ] Preferred language displays (if available) - NEW

#### Voice Verification Section
- [ ] Section appears if voice profile exists
- [ ] Purple background styling
- [ ] Status shows correctly (Verified/Not Verified)
- [ ] Status has correct color (green/yellow) - NEW
- [ ] Enrolled status displays - NEW
- [ ] Samples count displays - NEW
- [ ] Last match score displays - NEW
- [ ] Confidence score displays
- [ ] Voice model reference displays - NEW
- [ ] Audio player works (if audio_url exists)
- [ ] Enrollment date/time displays - NEW

#### Facial Verification Section (NEW)
- [ ] Section appears if facial verification exists
- [ ] Blue background styling
- [ ] Status shows correctly
- [ ] Status has correct color (green/yellow)
- [ ] Liveness image displays
- [ ] Image loads correctly
- [ ] Image is properly sized
- [ ] Capture timestamp displays

#### Documents Section
- [ ] Section appears if documents exist
- [ ] Indigo background styling
- [ ] All documents display
- [ ] Document type displays correctly
- [ ] Verification status (✓) shows for verified docs
- [ ] Document images display
- [ ] Verification notes display
- [ ] Upload dates display

#### Verification Requests Section
- [ ] Section appears if requests exist
- [ ] Yellow background styling
- [ ] All requests display in order (newest first)
- [ ] Status badges display with correct colors:
  - [ ] Green for approved
  - [ ] Red for rejected
  - [ ] Yellow for pending
- [ ] Status icons display correctly - NEW
- [ ] Voice match scores display - NEW
- [ ] Facial verification indicator shows - NEW
- [ ] Document indicator shows - NEW
- [ ] Admin notes display in styled box - NEW
- [ ] Created timestamp displays
- [ ] Updated timestamp displays (if different) - NEW

#### Registration Details Section
- [ ] Registration date/time displays
- [ ] Last updated date/time displays (if available)

## 📊 Data Validation

### With Complete User Data
Test with a user who has:
- [ ] Voice enrolled and verified
- [ ] Facial verification completed
- [ ] Documents uploaded
- [ ] Multiple verification requests
- [ ] Admin notes on requests

Expected: All sections display with all information

### With Partial User Data
Test with a user who has:
- [ ] Only basic profile
- [ ] No voice profile
- [ ] No facial verification
- [ ] No documents
- [ ] No verification requests

Expected: Only available sections display, no errors

### With No User Data
Test with a newly created user:
- [ ] Basic info displays
- [ ] Missing sections don't show
- [ ] No JavaScript errors
- [ ] Sidebar still functions correctly

## 🎯 Edge Cases

- [ ] Very long user names
- [ ] Missing email or phone
- [ ] User with no verification data
- [ ] User with many documents (10+)
- [ ] User with many verification requests (20+)
- [ ] Large images (test load time)
- [ ] Invalid/broken image URLs
- [ ] Missing audio URLs
- [ ] Special characters in text fields
- [ ] Multiple admins reviewing same user

## 🐛 Error Handling

- [ ] Network error shows appropriate message
- [ ] Invalid user ID shows error
- [ ] Unauthorized access redirects to signin
- [ ] Missing data doesn't crash the UI
- [ ] Failed image loads show placeholder or nothing
- [ ] Failed audio loads show error or nothing

## 📱 Responsive Testing

### Desktop (1920x1080)
- [ ] Summary cards in 5 columns
- [ ] Table fits all columns
- [ ] Sidebar is max-w-2xl
- [ ] All content readable

### Laptop (1366x768)
- [ ] Summary cards adjust to fit
- [ ] Table scrolls horizontally if needed
- [ ] Sidebar still accessible

### Tablet (768x1024)
- [ ] Summary cards stack (2-3 columns)
- [ ] Table scrolls
- [ ] Sidebar takes most of screen

### Mobile (375x667)
- [ ] Summary cards stack vertically
- [ ] Table scrolls horizontally
- [ ] Sidebar takes full width
- [ ] Touch targets are large enough

## 🔒 Security Testing

- [ ] Cannot access without admin login
- [ ] Cannot access other admin's data inappropriately
- [ ] User IDs are not fully exposed in lists
- [ ] Sensitive data only visible to authenticated admins
- [ ] No XSS vulnerabilities in user input display
- [ ] Audio/image URLs are secure

## ⚡ Performance Testing

- [ ] User list loads in < 2 seconds
- [ ] User details load in < 1 second
- [ ] Images load progressively
- [ ] Audio files stream properly
- [ ] No memory leaks when opening/closing sidebar
- [ ] Pagination doesn't reload entire page
- [ ] Live update indicator works

## 🎨 Visual/UX Testing

- [ ] Colors match design system
- [ ] Icons are consistent
- [ ] Spacing is consistent
- [ ] Text is readable
- [ ] Status indicators are clear
- [ ] Interactive elements have hover states
- [ ] Buttons have appropriate cursor
- [ ] Loading states are visible
- [ ] Animations are smooth
- [ ] No layout shifts during load

## 📝 Regression Testing

- [ ] Existing admin features still work
- [ ] User list filtering still works
- [ ] User search still works
- [ ] Other admin pages unaffected
- [ ] Logout still works
- [ ] Navigation still works

## ✨ Success Criteria

All items checked means:
- ✅ Admin can view complete user information
- ✅ All verification data is accessible
- ✅ Voice samples can be played
- ✅ Facial images are visible
- ✅ Documents are displayed
- ✅ Verification history is complete
- ✅ UI is intuitive and responsive
- ✅ No critical bugs or errors

---

## 🚀 Quick Test Scenario

1. Login as admin → Go to Users page
2. Verify summary stats show all 5 cards
3. Click on first user in list
4. Verify sidebar opens with all sections
5. Play voice sample (if available)
6. View facial image (if available)
7. Check all documents display
8. Review verification history
9. Close sidebar
10. Click on another user
11. Verify data changes correctly

**If all above steps work → Feature is complete! 🎉**

---

**Testing Date:** _____________
**Tested By:** _____________
**Status:** _____________
**Notes:** _____________
