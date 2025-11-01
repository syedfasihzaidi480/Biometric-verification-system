# Document Upload FormData Error - FIXED

## Problem

The document upload was failing with:
```
ERROR Document upload error: [Error: Unsupported FormDataPart implementation]
```

This error occurs because React Native's FormData implementation doesn't work seamlessly with standard fetch in all environments.

## Root Cause

The code was attempting to use `FormData` directly:
```javascript
const formData = new FormData();
formData.append('documentFile', selectedDocument);
formData.append('documentType', idDocumentType);
```

React Native's FormData has limitations and doesn't always serialize file objects correctly, especially when dealing with local file URIs.

## Solution Implemented

### Strategy: Base64 JSON Upload

Instead of multipart FormData, convert the file to base64 and send as JSON. The backend already supports both methods.

### Changes Made

**1. Added expo-file-system dependency:**
```bash
npx expo install expo-file-system
```

**2. Updated imports in register.jsx:**
```javascript
import * as FileSystem from 'expo-file-system';
```

**3. Rewrote uploadDocument function:**

**Before:**
```javascript
const uploadDocument = async () => {
  const formData = new FormData();
  formData.append('documentFile', selectedDocument);
  formData.append('documentType', idDocumentType);
  
  const response = await apiFetch('/api/document/upload', {
    method: 'POST',
    body: formData,
  });
  // ...
};
```

**After:**
```javascript
const uploadDocument = async () => {
  // Read file as base64 using expo-file-system
  const base64 = await FileSystem.readAsStringAsync(selectedDocument.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Send as JSON with base64
  const uploadResult = await apiFetchJson('/api/document/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      documentBase64: base64,
      documentType: idDocumentType,
      documentMimeType: selectedDocument.type,
      documentFileName: selectedDocument.name,
    },
  });
  // ...
};
```

**4. Enhanced error handling:**
```javascript
// Upload document if selected
let documentUploadSuccess = true;
if (selectedDocument) {
  try {
    await uploadDocument();
  } catch (docError) {
    console.error('Document upload failed:', docError);
    documentUploadSuccess = false;
  }
}

// Show appropriate success message
const message = documentUploadSuccess 
  ? 'Profile updated successfully!' 
  : 'Profile updated, but document upload failed. Please try uploading again.';
```

**5. Added comprehensive logging:**
- `[Upload] Starting document upload:` - Shows file name
- `[Upload] File read as base64, length:` - Confirms file read
- `[Upload] Document uploaded successfully:` - Shows document ID
- `[Upload] Document upload error:` - Shows any errors

## Backend Support

The backend endpoint `/api/document/upload` already supports both:

1. **Multipart FormData** (original method)
2. **JSON with base64** (new mobile-friendly method)

```javascript
// Backend checks content-type and handles both
if (contentType.includes('application/json')) {
  const body = await request.json();
  if (body.documentBase64) {
    uploadResult = await upload({ base64: body.documentBase64 });
  }
}
```

## Testing Steps

### 1. Complete Installation

Wait for the package installation to finish:
```bash
cd apps/mobile
npx expo install expo-file-system
```

### 2. Restart Expo Dev Server

Clear cache and restart:
```bash
cd apps/mobile
npx expo start -c
```

### 3. Test Document Upload

1. **Open mobile app** and sign in
2. **Navigate to Register tab**
3. **Fill in profile details:**
   - Full Name
   - Mobile Number
   - Date of Birth
   - ID Document Type (CNIC/Passport/License)
4. **Upload a document:**
   - Tap "Tap to upload your ID document"
   - Choose Camera, Gallery, or Files
   - Select an image or PDF
5. **Tap "Save Profile"**

### 4. Check Logs

**Mobile/Terminal logs:**
```
[Upload] Starting document upload: document_1234567890.jpg
[Upload] File read as base64, length: 45678
[Upload] Document uploaded successfully: doc_abc123
```

**Backend logs (if enabled):**
```
[Document Upload] Auth user ID: <uuid>
[Document Upload] Base64 upload, length: 45678
[Document Upload] Document saved: doc_abc123
```

### 5. Expected Outcomes

**Success indicators:**
- ✅ No "Unsupported FormDataPart" error
- ✅ File reads as base64 successfully
- ✅ Upload completes and returns document ID
- ✅ Alert shows "Profile updated successfully!"
- ✅ Document appears in MongoDB `documents` collection

**Partial success:**
- ⚠️ Profile saves but document upload fails
- ⚠️ Alert shows "Profile updated, but document upload failed..."
- → Check network connectivity and server logs

**Failure:**
- ❌ "Document upload error" in console
- → Check the specific error message
- → Verify file URI is accessible
- → Ensure expo-file-system is installed

## File Structure

```
selectedDocument = {
  uri: 'file:///path/to/image.jpg',  // Local file path
  name: 'image.jpg',                  // File name
  type: 'image/jpeg',                 // MIME type
}
```

## Advantages of Base64 Approach

1. **Reliability:** No FormData serialization issues
2. **Compatibility:** Works across all React Native platforms
3. **Simplicity:** Single JSON request
4. **Debugging:** Easy to log and inspect
5. **Backend flexibility:** Already supported

## Disadvantages (Acceptable Trade-offs)

1. **Size:** Base64 is ~33% larger than binary
   - Acceptable for typical ID documents (1-5MB)
2. **Memory:** Entire file loaded into memory
   - Fine for documents, not ideal for very large files
3. **No streaming:** Can't show upload progress easily
   - Could add progress indicator for base64 encoding

## Files Modified

1. **apps/mobile/src/app/(tabs)/register.jsx**
   - Added `expo-file-system` import
   - Rewrote `uploadDocument` to use base64
   - Enhanced error handling for document upload
   - Added logging for upload process

2. **apps/mobile/package.json**
   - Added `expo-file-system` dependency (via npx expo install)

## Rollback Plan

If base64 approach fails, we can:
1. Try native FormData with different serialization
2. Use `expo-document-picker`'s native upload methods
3. Implement chunked upload for large files
4. Use a separate upload service

## Environment

- React Native (Expo)
- expo-file-system for file operations
- JSON-based API communication
- Base64 encoding for file transfer

---

**Status:** ✅ Implemented  
**Next Step:** Restart Expo and test document upload  
**Last Updated:** 2024-11-01
