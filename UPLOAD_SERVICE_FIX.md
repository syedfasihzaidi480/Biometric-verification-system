# Upload Service Fix - Local Storage Fallback

## Problem
After fixing the "User not found" error, voice verification now fails with:
```
Error: File upload did not return a valid URL. Please check upload service configuration.
```

## Root Cause
The upload service (`https://api.createanything.com/v0/upload`) is:
1. Not configured/accessible
2. Returning null or invalid URLs
3. Blocking the voice enrollment process

## Solution Implemented

### 1. Enhanced Upload Service with Fallback
Updated `apps/web/src/app/api/utils/upload.js` to:
- ✅ Try external service first (with 5-second timeout)
- ✅ Automatically fall back to local storage if external service fails
- ✅ Support buffer, base64, and URL inputs
- ✅ Auto-detect file types (JPEG, PNG, PDF, M4A audio)
- ✅ Generate unique filenames
- ✅ Store files in `public/uploads/` directory

### 2. Created Public Directory Structure
```
apps/web/public/
  uploads/           # Stores uploaded files
    .gitignore       # Ignores uploaded files in git
  .gitkeep           # Keeps directory in git
```

### 3. Updated Vite Configuration
Added `publicDir: 'public'` to `vite.config.ts` to serve static files from the public directory.

## How It Works

### Upload Flow
```
1. Mobile app records voice → sends base64 audio
2. API receives audio data
3. Upload service tries external API
   ├─ Success? → Return external URL
   └─ Fail/Timeout? → Fall back to local storage
4. Local storage:
   ├─ Detect file type from buffer
   ├─ Generate unique filename (timestamp-random.ext)
   ├─ Save to public/uploads/
   └─ Return public URL (/uploads/filename.m4a)
5. API stores URL in database
6. File accessible at http://localhost:4000/uploads/filename.m4a
```

### File Type Detection
The service automatically detects:
- **JPEG**: `0xFF 0xD8 0xFF` magic bytes
- **PNG**: `0x89 0x50 0x4E 0x47` magic bytes
- **PDF**: `0x25 0x50 0x44 0x46` magic bytes
- **M4A/MP4**: `ftyp` marker in header
- **Base64**: Extracts mime type from data URL prefix

## Testing

### Voice Enrollment Test
1. Register new account
2. Navigate to voice enrollment
3. Record voice sample
4. Click "Submit"
5. **Expected**: 
   - File uploads successfully
   - Returns URL like `/uploads/1730000000-abc123.m4a`
   - Voice sample processes without error
   - Progress to sample 2 of 3

### Document Upload Test
1. Upload ID document
2. **Expected**: File saved to `/uploads/timestamp-random.jpg`

### Liveness Check Test
1. Take selfie for liveness check
2. **Expected**: Image saved to `/uploads/timestamp-random.jpg`

## Files Modified
1. ✅ `apps/web/src/app/api/utils/upload.js` - Enhanced with local fallback
2. ✅ `apps/web/vite.config.ts` - Added publicDir configuration
3. ✅ `apps/web/public/uploads/.gitignore` - Ignore uploaded files in git

## Files Created
1. ✅ `apps/web/public/` - Public directory for static files
2. ✅ `apps/web/public/uploads/` - Upload storage directory

## Production Considerations

### For Production Deployment
Replace local storage with cloud storage:

**Option 1: Cloudinary**
```javascript
// Set environment variables:
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Option 2: AWS S3**
```javascript
// Set environment variables:
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

**Option 3: Azure Blob Storage**
```javascript
// Set environment variables:
AZURE_STORAGE_CONNECTION_STRING=your-connection-string
AZURE_STORAGE_CONTAINER=your-container
```

### Current Limitations
- ⚠️ Local storage only works in single-server setup
- ⚠️ Files stored on server disk (not CDN)
- ⚠️ No automatic cleanup of old files
- ⚠️ Not suitable for production scale

### Advantages of Current Solution
- ✅ Works immediately without external dependencies
- ✅ No API keys or configuration needed
- ✅ Perfect for development and testing
- ✅ Fast uploads (local disk)
- ✅ Easy to debug (files visible in public/uploads)

## Next Steps
1. **Test voice enrollment** - Verify audio uploads work
2. **Test document upload** - Verify image uploads work
3. **Test liveness check** - Verify selfie uploads work
4. **For production**: Configure Cloudinary or AWS S3

## Error Handling
The service now handles:
- ✅ External service timeout (5 seconds)
- ✅ External service returning null/invalid URLs
- ✅ Network failures
- ✅ Invalid file types
- ✅ Missing input data

All errors automatically fall back to local storage.

## Monitoring
Check console logs for:
```
[UPLOAD] External service returned invalid URL, falling back to local storage
[UPLOAD] External service failed, falling back to local storage: <error>
[UPLOAD] File saved locally: /uploads/<filename>
```

## Security Notes
- Files are public (accessible via direct URL)
- No authentication required to access uploaded files
- Recommend implementing access control for production
- Consider adding virus scanning for production uploads
