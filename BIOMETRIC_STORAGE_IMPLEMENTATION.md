# Biometric Data Storage Implementation Summary

## Overview

Complete implementation of biometric data storage using **Cloudinary** (primary) and **MongoDB** for voice audio samples and facial images from the verification system.

### Storage Architecture

- **Primary Storage**: Cloudinary (cloud CDN with 25GB free tier)
- **Metadata Storage**: MongoDB (all file metadata + base64 backup)
- **Fallback**: Local storage (development/emergency)

## What Was Implemented

### 1. Voice Audio Storage

#### Collections Created:
- **`voice_enrollment_samples`** - Stores voice samples during enrollment (3 samples per user)
- **`voice_verification_samples`** - Stores voice samples during verification attempts

#### Data Stored:
- Base64-encoded audio buffers
- Audio URLs (public storage)
- ML quality scores and match scores
- Sample metadata (size, MIME type, timestamps)
- Session and user references

### 2. Facial Image Storage

#### Collections Created:
- **`face_liveness_images`** - Stores facial images from liveness detection checks
- **`document_images`** - Stores document images with potential facial regions

#### Data Stored:
- Base64-encoded image buffers (backup in MongoDB)
- **Cloudinary URLs** (primary storage with CDN)
- Cloudinary public IDs (for deletion/management)
- Liveness scores and verification results
- OCR extracted text (for documents)
- Tamper detection flags
- Image quality metrics

### 3. Cloudinary Integration

#### Setup:
- **Cloud Name**: `dzzaebsfc`
- **Free Tier**: 25 GB storage + 25 GB bandwidth/month
- **CDN**: Global content delivery network
- **HTTPS**: Secure URLs for all uploads

#### Features:
- Automatic image optimization
- On-the-fly transformations
- Face detection
- Secure URLs
- 99.9% uptime SLA

## Files Modified

### API Endpoints Updated:
1. **`apps/web/src/app/api/voice/enroll/route.js`**
   - Added `voice_enrollment_samples` collection storage
   - Stores each audio sample with metadata during enrollment

2. **`apps/web/src/app/api/voice/verify/route.js`**
   - Added `voice_verification_samples` collection storage
   - Stores verification attempts with match scores

3. **`apps/web/src/app/api/liveness/check/route.js`**
   - Added `face_liveness_images` collection storage
   - Stores facial images with liveness detection results

4. **`apps/web/src/app/api/document/upload/route.js`**
   - Added `document_images` collection storage
   - Stores document images with OCR and tampering results

### New API Endpoints Created:

5. **`apps/web/src/app/api/admin/voice-samples/route.js`**
   - GET: List voice samples for a user (enrollment or verification)
   - POST: Get specific voice sample with audio buffer

6. **`apps/web/src/app/api/admin/face-images/route.js`**
   - GET: List face images for a user
   - POST: Get specific face image with image buffer

7. **`apps/web/src/app/api/admin/document-images/route.js`**
   - GET: List document images for a user (optionally filter by type)
   - POST: Get specific document image with image buffer

### Database Configuration:

8. **`apps/web/utils/create-indexes.cjs`**
   - Added indexes for all four new collections
   - Optimized queries by user_id and created_at

### Storage Configuration:

9. **`apps/web/src/app/api/utils/cloudinary.js`** (NEW)
   - Cloudinary upload, delete, and optimization utilities
   - Automatic mime type detection
   - Resource type handling (image, video, raw, auto)

10. **`apps/web/src/app/api/utils/upload.js`** (UPDATED)
    - Now uses Cloudinary as primary storage
    - Three-tier fallback: Cloudinary → External API → Local
    - Backward compatible with existing code

11. **`apps/web/.env`** (UPDATED)
    - Added Cloudinary credentials
    - Configuration ready for production

### Documentation:

12. **`VOICE_AUDIO_STORAGE.md`** (Updated)
    - Comprehensive documentation for all collections
    - API usage examples
    - Storage considerations and best practices
    - Query examples for MongoDB

13. **`CLOUDINARY_SETUP.md`** (NEW)
    - Complete Cloudinary integration guide
    - Configuration and usage examples
    - Security and optimization tips
    - Troubleshooting guide

## Database Schema

### Collections & Indexes

```javascript
// Voice enrollment samples
voice_enrollment_samples: {
  indexes: [
    { user_id: 1, created_at: -1 },
    { session_id: 1, sample_number: 1 }
  ]
}

// Voice verification samples
voice_verification_samples: {
  indexes: [
    { user_id: 1, created_at: -1 },
    { voice_profile_id: 1, created_at: -1 }
  ]
}

// Face liveness images
face_liveness_images: {
  indexes: [
    { user_id: 1, created_at: -1 },
    { is_live: 1, created_at: -1 }
  ]
}

// Document images
document_images: {
  indexes: [
    { user_id: 1, created_at: -1 },
    { document_type: 1, created_at: -1 }
  ]
}
```

## API Endpoints Summary

### Admin Data Retrieval

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/voice-samples` | GET | List voice samples by user |
| `/api/admin/voice-samples` | POST | Get specific voice sample with audio |
| `/api/admin/face-images` | GET | List face images by user |
| `/api/admin/face-images` | POST | Get specific face image with data |
| `/api/admin/document-images` | GET | List document images by user |
| `/api/admin/document-images` | POST | Get specific document image with data |

### Usage Examples

**List user's voice enrollment samples:**
```bash
curl -X GET "http://localhost:4000/api/admin/voice-samples?userId=user123&type=enrollment"
```

**Get specific voice sample with audio:**
```bash
curl -X POST http://localhost:4000/api/admin/voice-samples \
  -H "Content-Type: application/json" \
  -d '{"sampleId": "sample-uuid", "type": "enrollment", "includeAudio": true}'
```

**List user's face images:**
```bash
curl -X GET "http://localhost:4000/api/admin/face-images?userId=user123"
```

**Get specific face image:**
```bash
curl -X POST http://localhost:4000/api/admin/face-images \
  -H "Content-Type: application/json" \
  -d '{"imageId": "image-uuid", "includeImage": true}'
```

## Storage Considerations

### Typical File Sizes

| Data Type | Format | Size Range |
|-----------|--------|------------|
| Voice Sample (WebM) | audio/webm | 30-100 KB |
| Voice Sample (WAV) | audio/wav | 100-500 KB |
| Face Image (JPEG) | image/jpeg | 100-500 KB |
| Face Image (PNG) | image/png | 200-1000 KB |
| Document Scan | image/jpeg | 500 KB - 5 MB |

### Per User Estimates

- **Voice Enrollment**: 3 samples × ~50 KB = ~150 KB
- **Voice Verification**: Variable (1+ samples per login)
- **Liveness Images**: 1+ per verification × ~300 KB
- **Documents**: 1-3 documents × ~2 MB = ~2-6 MB

**Total per user**: ~2.5-7 MB for complete verification

### MongoDB Limits

- **Document size**: 16 MB maximum per document
- **Collection size**: Unlimited (with proper indexing)
- **Recommended**: Keep samples under 5 MB each

## Benefits

✅ **Complete Audit Trail**: All biometric data preserved  
✅ **Forensics & Investigation**: Full history of verification attempts  
✅ **Quality Improvement**: Data for ML model retraining  
✅ **Compliance**: Meet regulatory data retention requirements  
✅ **Debugging**: Analyze failed verifications  
✅ **Analytics**: Track success rates and patterns  
✅ **User Support**: Help troubleshoot verification issues  

## Testing & Validation

### To Test the Implementation:

1. **Start the web server:**
   ```powershell
   cd apps/web
   npm run dev
   ```

2. **Perform a voice enrollment** (mobile or web app)
   - Check `voice_enrollment_samples` collection in MongoDB
   - Verify 3 samples are stored with audio buffers

3. **Perform a liveness check**
   - Check `face_liveness_images` collection
   - Verify image is stored with liveness score

4. **Upload a document**
   - Check `document_images` collection
   - Verify document image is stored with OCR results

5. **Query via admin APIs:**
   ```bash
   # Get voice samples
   curl -X GET "http://localhost:4000/api/admin/voice-samples?userId=USER_ID&type=enrollment"
   
   # Get face images
   curl -X GET "http://localhost:4000/api/admin/face-images?userId=USER_ID"
   
   # Get documents
   curl -X GET "http://localhost:4000/api/admin/document-images?userId=USER_ID"
   ```

### MongoDB Queries for Verification:

```javascript
// Count total voice samples
db.voice_enrollment_samples.countDocuments()
db.voice_verification_samples.countDocuments()

// Count face images
db.face_liveness_images.countDocuments()

// Count documents
db.document_images.countDocuments()

// Check latest entries
db.voice_enrollment_samples.find().sort({created_at: -1}).limit(5)
db.face_liveness_images.find().sort({created_at: -1}).limit(5)
db.document_images.find().sort({created_at: -1}).limit(5)

// Get user's complete biometric data
const userId = "user123";
db.voice_enrollment_samples.find({user_id: userId})
db.voice_verification_samples.find({user_id: userId})
db.face_liveness_images.find({user_id: userId})
db.document_images.find({user_id: userId})
```

## Security Considerations

⚠️ **Important Security Notes:**

1. **Sensitive Data**: Biometric data is highly sensitive
2. **Access Control**: Implement proper authentication for admin APIs
3. **Encryption**: Consider encrypting image/audio buffers at rest
4. **Retention Policy**: Implement data cleanup after retention period
5. **GDPR Compliance**: Ensure proper consent and deletion mechanisms
6. **Audit Logging**: All access to biometric data should be logged

## Next Steps & Recommendations

### Immediate:
- [ ] Add authentication/authorization to admin endpoints
- [ ] Test with real voice/face/document uploads
- [ ] Verify MongoDB storage and retrieval

### Short-term:
- [ ] Implement data encryption at rest
- [ ] Add TTL indexes for automatic cleanup
- [ ] Create admin dashboard UI for viewing samples
- [ ] Add compression before storage

### Long-term:
- [ ] Implement GDPR-compliant data deletion
- [ ] Add face comparison between liveness and document photos
- [ ] Implement advanced analytics and reporting
- [ ] Add automated quality scoring and filtering
- [ ] Consider GridFS for very large files (> 5MB)

## Maintenance

### Database Maintenance Tasks:

```javascript
// Check collection sizes
db.stats()
db.voice_enrollment_samples.stats()
db.face_liveness_images.stats()
db.document_images.stats()

// Clean up old data (example: older than 90 days)
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

db.voice_verification_samples.deleteMany({
  created_at: { $lt: ninetyDaysAgo.toISOString() }
})

db.face_liveness_images.deleteMany({
  created_at: { $lt: ninetyDaysAgo.toISOString() }
})
```

### Index Maintenance:

```bash
# Recreate indexes (from apps/web directory)
node utils/create-indexes.cjs
```

## Troubleshooting

### Common Issues:

1. **Indexes not created**: Collections are created on first insert
2. **Large document size**: Compress images/audio before storage
3. **Slow queries**: Ensure indexes are created properly
4. **Storage growing too fast**: Implement retention policies

### Debug Commands:

```javascript
// Check if data is being stored
db.voice_enrollment_samples.findOne()
db.face_liveness_images.findOne()

// Check index creation
db.voice_enrollment_samples.getIndexes()
db.face_liveness_images.getIndexes()

// Find large documents
db.document_images.find().sort({file_size: -1}).limit(10)
```

## Documentation References

- **Full Documentation**: `VOICE_AUDIO_STORAGE.md`
- **API Documentation**: See individual route files
- **MongoDB Docs**: https://docs.mongodb.com/

## Summary

✅ **4 new collections** created for biometric data storage  
✅ **4 API endpoints** modified to store data automatically  
✅ **6 new admin endpoints** (3 GET + 3 POST) for data retrieval  
✅ **8 indexes** added for optimized queries  
✅ **Complete documentation** with examples and best practices  

The system now captures and stores all biometric data (voice, face, documents) with full metadata, enabling comprehensive auditing, debugging, and analytics capabilities.
