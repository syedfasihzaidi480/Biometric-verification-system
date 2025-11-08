# Cloudinary Integration Guide

## Overview

The biometric verification system now uses **Cloudinary** as the primary storage provider for all media files (images, audio, documents). Cloudinary provides:

- ✅ **Reliable cloud storage** with 99.9% uptime SLA
- ✅ **Global CDN** for fast delivery worldwide
- ✅ **Automatic optimization** for images and media
- ✅ **Secure URLs** with HTTPS
- ✅ **Image transformations** on-the-fly
- ✅ **Free tier** with 25GB storage and 25GB bandwidth/month

## Configuration

### Environment Variables

Add these to your `.env` file in `apps/web/`:

```bash
# Cloudinary configuration
CLOUDINARY_CLOUD_NAME=dzzaebsfc
CLOUDINARY_API_KEY=541276445497123
CLOUDINARY_API_SECRET=SnSoEdqRpc1LTzMkYzVlA_6phPE
```

### Current Configuration

**Cloud Name:** `dzzaebsfc`  
**API Key:** `541276445497123`  
**API Secret:** `SnSoEdqRpc1LTzMkYzVlA_6phPE`

## How It Works

### Upload Priority System

The system uses a **three-tier fallback approach**:

1. **Primary: Cloudinary** - Cloud storage with CDN
2. **Secondary: External API** - CreateAnything upload service
3. **Fallback: Local Storage** - Development/emergency backup

```javascript
// Upload flow
Cloudinary Upload
    ↓ (if fails)
External API Upload
    ↓ (if fails)
Local Storage Upload
```

### Supported File Types

**Images:**
- JPEG, PNG, GIF, WebP, HEIC, HEIF
- SVG, BMP, TIFF
- Maximum size: 10 MB (configurable)

**Audio:**
- WAV, MP3, M4A, AAC
- WebM audio
- Maximum size: 10 MB

**Documents:**
- PDF
- Images of documents (JPEG, PNG)
- Maximum size: 15 MB

**Video:**
- MP4, WebM, MOV
- Maximum size: 100 MB (configurable)

## API Usage

### Upload Utility

The main upload function automatically uses Cloudinary:

```javascript
import { upload } from '@/app/api/utils/upload';

// Upload from buffer
const result = await upload({
  buffer: fileBuffer,
  folder: 'voice-samples' // Optional: organize by folder
});

// Upload from base64
const result = await upload({
  base64: base64String,
  folder: 'face-images'
});

// Upload from URL
const result = await upload({
  url: 'https://example.com/image.jpg',
  folder: 'documents'
});

// Result object
{
  url: 'https://res.cloudinary.com/dzzaebsfc/image/upload/v1699456789/biometric-verification/abc123.jpg',
  mimeType: 'image/jpeg',
  publicId: 'biometric-verification/abc123',
  provider: 'cloudinary'
}
```

### Direct Cloudinary API

For advanced features, use the Cloudinary utility directly:

```javascript
import { uploadToCloudinary, deleteFromCloudinary, getOptimizedUrl } from '@/app/api/utils/cloudinary';

// Upload with custom options
const result = await uploadToCloudinary({
  buffer: imageBuffer,
  folder: 'face-liveness',
  resourceType: 'image' // 'image', 'video', 'raw', or 'auto'
});

// Delete a file
await deleteFromCloudinary(publicId, 'image');

// Get optimized URL with transformations
const optimizedUrl = getOptimizedUrl(publicId, {
  width: 300,
  height: 300,
  crop: 'fill',
  quality: 'auto',
  format: 'auto'
});
```

## Folder Structure in Cloudinary

The system organizes files in Cloudinary with the following structure:

```
biometric-verification/
├── voice-samples/
│   ├── enrollment/
│   └── verification/
├── face-images/
│   └── liveness/
├── documents/
│   ├── id-cards/
│   ├── passports/
│   └── other/
└── temp/
```

## Image Transformations

Cloudinary automatically optimizes images and allows on-the-fly transformations:

### Basic Transformations

```javascript
// Resize to 300x300, crop to fill
https://res.cloudinary.com/dzzaebsfc/image/upload/w_300,h_300,c_fill/public-id.jpg

// Auto format and quality
https://res.cloudinary.com/dzzaebsfc/image/upload/f_auto,q_auto/public-id.jpg

// Convert to WebP for better compression
https://res.cloudinary.com/dzzaebsfc/image/upload/f_webp/public-id.jpg

// Thumbnail (200px wide, maintain aspect ratio)
https://res.cloudinary.com/dzzaebsfc/image/upload/w_200/public-id.jpg
```

### Advanced Transformations

```javascript
// Face detection and crop
https://res.cloudinary.com/dzzaebsfc/image/upload/w_400,h_400,c_thumb,g_face/public-id.jpg

// Blur effect
https://res.cloudinary.com/dzzaebsfc/image/upload/e_blur:300/public-id.jpg

// Grayscale
https://res.cloudinary.com/dzzaebsfc/image/upload/e_grayscale/public-id.jpg
```

## Security Features

### Secure URLs

All URLs use HTTPS by default:
```
https://res.cloudinary.com/dzzaebsfc/...
```

### Signed URLs (Optional)

For sensitive content, generate signed URLs that expire:

```javascript
import { cloudinary } from './cloudinary';

const signedUrl = cloudinary.url(publicId, {
  sign_url: true,
  type: 'authenticated',
  secure: true
});
```

### Access Control

1. **Private resources**: Set `type: 'private'` during upload
2. **Authenticated URLs**: Require signature for access
3. **Time-limited URLs**: Set expiration timestamps

## Storage Management

### Check Storage Usage

View your Cloudinary dashboard:
https://cloudinary.com/console/dzzaebsfc/media_library/folders/all

### Delete Old Files

```javascript
import { deleteFromCloudinary } from '@/app/api/utils/cloudinary';

// Delete by public ID
await deleteFromCloudinary('biometric-verification/old-file', 'image');

// Bulk delete (use Cloudinary API directly)
import { v2 as cloudinary } from 'cloudinary';

await cloudinary.api.delete_resources_by_prefix('biometric-verification/temp/');
```

### Automatic Cleanup

Implement retention policies:

```javascript
// Example: Delete files older than 90 days
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

// Query MongoDB for old files
const oldFiles = await db.collection('voice_enrollment_samples')
  .find({ created_at: { $lt: ninetyDaysAgo.toISOString() } })
  .toArray();

// Delete from Cloudinary
for (const file of oldFiles) {
  if (file.publicId) {
    await deleteFromCloudinary(file.publicId, 'auto');
  }
}

// Delete from MongoDB
await db.collection('voice_enrollment_samples')
  .deleteMany({ created_at: { $lt: ninetyDaysAgo.toISOString() } });
```

## Free Tier Limits

Cloudinary Free Tier includes:

| Resource | Limit |
|----------|-------|
| **Storage** | 25 GB |
| **Bandwidth** | 25 GB/month |
| **Transformations** | 25,000/month |
| **Admin API calls** | 500/hour |
| **Upload limit** | 10 MB per file (images) |

### Monitoring Usage

1. **Dashboard**: https://cloudinary.com/console/dzzaebsfc
2. **Usage API**:
```javascript
import { v2 as cloudinary } from 'cloudinary';

const usage = await cloudinary.api.usage();
console.log('Storage used:', usage.storage.usage);
console.log('Bandwidth used:', usage.bandwidth.usage);
```

## Best Practices

### 1. Organize with Folders

Use descriptive folder names:
```javascript
await upload({ buffer, folder: 'voice-samples/enrollment' });
await upload({ buffer, folder: 'face-images/liveness' });
await upload({ buffer, folder: 'documents/passports' });
```

### 2. Use Appropriate Resource Types

```javascript
// For images
resourceType: 'image'

// For audio/video
resourceType: 'video'

// For PDFs and other files
resourceType: 'raw'

// Auto-detect (default)
resourceType: 'auto'
```

### 3. Optimize Before Upload

```javascript
// Compress images before uploading
import sharp from 'sharp';

const compressed = await sharp(buffer)
  .jpeg({ quality: 80 })
  .toBuffer();

await upload({ buffer: compressed });
```

### 4. Store Public IDs

Save the `publicId` in MongoDB to easily delete files later:

```javascript
const result = await upload({ buffer });

await db.collection('face_liveness_images').insertOne({
  id: uuid(),
  user_id: userId,
  image_url: result.url,
  cloudinary_public_id: result.publicId, // ← Save this!
  created_at: new Date().toISOString()
});
```

### 5. Handle Upload Failures

```javascript
const result = await upload({ buffer });

if (result.error) {
  console.error('Upload failed:', result.error);
  // Handle error (retry, use local storage, etc.)
  return Response.json({ 
    success: false, 
    error: 'Upload failed' 
  }, { status: 500 });
}

// Success - use result.url
console.log('Uploaded to:', result.url);
```

## Troubleshooting

### Issue: Upload Fails with Authentication Error

**Solution:** Check that environment variables are set correctly:
```bash
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
echo $CLOUDINARY_API_SECRET
```

### Issue: File Too Large

**Solution:** Cloudinary free tier has 10 MB limit for images. Compress before upload:
```javascript
// Use sharp or similar library to compress
const compressed = await sharp(buffer)
  .resize(1920, 1080, { fit: 'inside' })
  .jpeg({ quality: 80 })
  .toBuffer();
```

### Issue: Slow Uploads

**Solution:** 
1. Upload smaller files
2. Use async/background jobs for large files
3. Consider upgrading Cloudinary plan

### Issue: Storage Limit Reached

**Solution:**
1. Delete old/unused files
2. Implement automatic cleanup
3. Upgrade to paid plan

## Migration from Local Storage

If you have existing files in local storage, migrate them:

```javascript
import { readFile } from 'fs/promises';
import { join } from 'path';
import { upload } from '@/app/api/utils/upload';

// Read local file
const filePath = join(process.cwd(), 'public/uploads/old-file.jpg');
const buffer = await readFile(filePath);

// Upload to Cloudinary
const result = await upload({ buffer, folder: 'migrated' });

// Update database with new URL
await db.collection('face_liveness_images').updateOne(
  { image_url: '/uploads/old-file.jpg' },
  { $set: { 
    image_url: result.url,
    cloudinary_public_id: result.publicId 
  }}
);
```

## Advanced Features

### Webhooks

Set up webhooks for notifications:
1. Go to Settings → Upload → Upload Notifications
2. Add webhook URL: `https://your-domain.com/api/webhooks/cloudinary`
3. Receive notifications for uploads, deletes, etc.

### Video Transcoding

Automatically transcode videos:
```javascript
const result = await uploadToCloudinary({
  buffer: videoBuffer,
  folder: 'videos',
  resourceType: 'video',
  eager: [
    { width: 1280, height: 720, crop: 'fill', format: 'mp4' },
    { width: 640, height: 480, crop: 'fill', format: 'webm' }
  ]
});
```

### AI Features

Use Cloudinary's AI for:
- Face detection
- Content moderation
- Auto-tagging
- Background removal

## Resources

- **Cloudinary Dashboard**: https://cloudinary.com/console/dzzaebsfc
- **Documentation**: https://cloudinary.com/documentation
- **API Reference**: https://cloudinary.com/documentation/node_integration
- **Transformation Reference**: https://cloudinary.com/documentation/transformation_reference

## Support

For issues or questions:
1. Check Cloudinary status: https://status.cloudinary.com
2. View documentation: https://cloudinary.com/documentation
3. Contact support: https://support.cloudinary.com

## Summary

✅ **Cloudinary is now configured** and active  
✅ **All uploads automatically use Cloudinary** with fallbacks  
✅ **25 GB free storage** with CDN delivery  
✅ **Automatic optimization** for all media files  
✅ **Secure HTTPS URLs** for all uploaded content  

The system will now store all biometric data (voice samples, facial images, documents) securely in Cloudinary with automatic backups to local storage if needed.
