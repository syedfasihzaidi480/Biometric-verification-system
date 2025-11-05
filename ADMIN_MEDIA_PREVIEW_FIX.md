# Admin Media Preview Issues - Analysis and Solutions

## Problem Summary
On both http://localhost:4000/admin and http://localhost:4000/admin/users, there are **NO live previews** of:
- Document images
- Face pictures (liveness check)
- Voice recordings

## Root Cause Analysis

### Investigation Results

After checking the database, I found that:

1. **Documents Collection**: `document_image_url` field exists but contains `null` values
2. **Voice Profiles Collection**: `audio_url` field is `undefined` (some records have `voice_sample_url` which is also `null`)
3. **Verification Requests Collection**: Both `liveness_image_url` and `document_url` are `null`

### Why Media URLs are Null

The issue is in the **upload service**:

```javascript
// src/app/api/utils/upload.js
async function upload({ url, buffer, base64 }) {
  const response = await fetch(`https://api.createanything.com/v0/upload`, {
    method: "POST",
    headers: {
      "Content-Type": buffer ? "application/octet-stream" : "application/json"
    },
    body: buffer ? buffer : JSON.stringify({ base64, url })
  });
  const data = await response.json();
  return {
    url: data.url,  // <-- This is returning null/undefined
    mimeType: data.mimeType || null
  };
}
```

The external API `https://api.createanything.com/v0/upload` is either:
- Not accessible
- Returning errors
- Not returning proper URLs in the response

### Field Name Inconsistencies

Additionally, there are field name mismatches:
- Database stores: `document_image_url`
- API returns: `document_url`
- Voice profiles: Some use `audio_url`, others use `voice_sample_url`

## Solutions Implemented

### 1. Fixed Field Name Mapping ✅

Updated `/api/admin/users/[id]/route.js`:

```javascript
// Documents - check both field names
documents: userDocuments.map((doc) => ({
  id: doc.id,
  document_type: doc.document_type,
  document_url: doc.document_image_url || doc.document_url,  // Check both
  is_verified: doc.is_verified,
  verification_notes: doc.verification_notes,
  created_at: doc.created_at,
})),

// Voice profile - check both field names
voice_profile: voiceProfile ? {
  ...
  audio_url: voiceProfile.audio_url || voiceProfile.voice_sample_url,  // Check both
  ...
} : null,
```

## Solutions Still Needed

### 2. Fix the Upload Service ⚠️

You need to either:

**Option A: Use a different storage service**
```javascript
// Replace the upload function with Cloudinary, AWS S3, or similar
import { v2 as cloudinary } from 'cloudinary';

async function upload({ buffer, base64 }) {
  try {
    const result = await cloudinary.uploader.upload(
      base64 ? `data:image/jpeg;base64,${base64}` : buffer,
      { folder: 'verifications' }
    );
    return {
      url: result.secure_url,
      mimeType: result.format
    };
  } catch (error) {
    console.error('Upload error:', error);
    return { url: null, error: error.message };
  }
}
```

**Option B: Fix the external API**
- Ensure `https://api.createanything.com/v0/upload` is working
- Add authentication if required
- Add error handling and retry logic

**Option C: Store files locally (development only)**
```javascript
import { writeFile } from 'fs/promises';
import path from 'path';

async function upload({ buffer, base64 }) {
  try {
    const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
    const filepath = path.join(process.cwd(), 'public', 'uploads', filename);
    
    const data = base64 
      ? Buffer.from(base64, 'base64')
      : buffer;
    
    await writeFile(filepath, data);
    
    return {
      url: `/uploads/${filename}`,
      mimeType: 'image/jpeg'
    };
  } catch (error) {
    return { url: null, error: error.message };
  }
}
```

### 3. Add Upload Validation ⚠️

Update all upload routes to validate URLs before saving:

```javascript
if (!uploadResult.url || uploadResult.url === 'null' || uploadResult.url === 'undefined') {
  return Response.json({
    success: false,
    error: {
      code: 'UPLOAD_FAILED',
      message: 'File upload did not return a valid URL',
      details: uploadResult.error || 'Upload service returned null'
    }
  }, { status: 500 });
}
```

### 4. Migration Script for Existing Data

Since existing records have null URLs, you may need to:
- Ask users to re-upload their documents
- Or keep them as-is and only fix new uploads

## Testing Steps

After implementing the upload fix:

1. **Test Document Upload**:
   ```bash
   # Use the mobile app or API to upload a document
   # Check database: document_image_url should have a valid URL
   ```

2. **Test Voice Recording**:
   ```bash
   # Record voice through mobile app
   # Check database: voice_sample_url or audio_url should have a valid URL
   ```

3. **Test Face Capture**:
   ```bash
   # Capture liveness image through mobile app
   # Check verification_requests: liveness_image_url should have a valid URL
   ```

4. **Verify Admin Pages**:
   - Visit http://localhost:4000/admin
   - Click on a verification request
   - You should see:
     - ✅ Voice recording player
     - ✅ Face/liveness image
     - ✅ Document images

## Files Modified

1. ✅ `apps/web/src/app/api/admin/users/[id]/route.js` - Fixed field name mapping

## Files That Need Modification

1. ⚠️ `apps/web/src/app/api/utils/upload.js` - Fix upload service
2. ⚠️ `apps/web/src/app/api/document/upload/route.js` - Add URL validation
3. ⚠️ `apps/web/src/app/api/voice/enroll/route.js` - Add URL validation (if exists)
4. ⚠️ `apps/web/src/app/api/liveness/verify/route.js` - Add URL validation (if exists)

## Next Steps

1. **Immediate**: Choose which upload solution to use (Option A, B, or C above)
2. **Implement**: Update the upload.js file with the chosen solution
3. **Test**: Upload new files and verify URLs are saved correctly
4. **Migrate**: Decide what to do with existing null records

---

**Status**: Field mapping fixes applied ✅  
**Remaining**: Upload service needs to be fixed ⚠️  
**Impact**: High - No media can be viewed until upload service is working
