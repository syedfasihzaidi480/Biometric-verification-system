# Voice Audio and Facial Image Storage in MongoDB

## Overview

Voice audio files from enrollment and verification, as well as facial images from liveness checks and document uploads, are now stored in MongoDB along with metadata. This provides a complete audit trail and allows for later retrieval and analysis.

## Collections

### 1. `voice_enrollment_samples`

Stores audio samples collected during voice enrollment.

**Schema:**
```javascript
{
  id: String,                    // Unique sample ID (UUID)
  user_id: String,               // User ID (references users.id)
  session_id: String,            // Enrollment session ID
  sample_number: Number,         // Sample number (1, 2, 3, etc.)
  audio_url: String,             // Public URL of uploaded audio file
  audio_buffer: String,          // Base64-encoded audio data
  mime_type: String,             // MIME type (e.g., 'audio/webm', 'audio/wav')
  file_size: Number,             // Size in bytes
  ml_model_id: String,           // ML service model/enrollment ID
  quality_score: Number,         // Audio quality score from ML service
  created_at: String             // ISO timestamp
}
```

**Indexes:**
- `{ user_id: 1, created_at: -1 }` - For querying user's samples
- `{ session_id: 1, sample_number: 1 }` - For querying session samples

### 2. `voice_verification_samples`

Stores audio samples from voice verification attempts.

**Schema:**
```javascript
{
  id: String,                    // Unique sample ID (UUID)
  user_id: String,               // User ID (references users.id)
  voice_profile_id: String,      // Voice profile ID being verified against
  audio_url: String,             // Public URL of uploaded audio file
  audio_buffer: String,          // Base64-encoded audio data
  mime_type: String,             // MIME type (e.g., 'audio/webm', 'audio/wav')
  file_size: Number,             // Size in bytes
  match_score: Number,           // Match score from ML service (0-1)
  is_match: Boolean,             // Whether verification passed
  threshold: Number,             // Threshold used for verification
  quality_score: Number,         // Audio quality score from ML service
  created_at: String             // ISO timestamp
}
```

**Indexes:**
- `{ user_id: 1, created_at: -1 }` - For querying user's verification attempts
- `{ voice_profile_id: 1, created_at: -1 }` - For querying profile verifications

### 3. `face_liveness_images`

Stores facial images from liveness detection checks.

**Schema:**
```javascript
{
  id: String,                    // Unique image ID (UUID)
  user_id: String,               // User ID (references users.id)
  image_url: String,             // Public URL of uploaded image
  image_buffer: String,          // Base64-encoded image data
  mime_type: String,             // MIME type (e.g., 'image/jpeg', 'image/png')
  file_size: Number,             // Size in bytes
  liveness_score: Number,        // Liveness score from ML service (0-1)
  is_live: Boolean,              // Whether liveness check passed
  threshold: Number,             // Threshold used for liveness detection
  image_quality: Number,         // Image quality score
  face_detected: Boolean,        // Whether a face was detected
  reasons: Array<String>,        // Failure reasons if not live
  created_at: String             // ISO timestamp
}
```

**Indexes:**
- `{ user_id: 1, created_at: -1 }` - For querying user's liveness checks
- `{ is_live: 1, created_at: -1 }` - For querying by liveness status

### 4. `document_images`

Stores document images with facial regions from document uploads.

**Schema:**
```javascript
{
  id: String,                    // Unique image ID (UUID)
  user_id: String,               // User ID (references users.id)
  document_type: String,         // Document type (id_card, passport, etc.)
  image_url: String,             // Public URL of uploaded document
  image_buffer: String,          // Base64-encoded image data
  mime_type: String,             // MIME type (e.g., 'image/jpeg', 'application/pdf')
  file_name: String,             // Original file name
  file_size: Number,             // Size in bytes
  extracted_text: String,        // OCR extracted text
  tamper_detected: Boolean,      // Whether tampering was detected
  ocr_confidence: Number,        // OCR confidence score (0-1)
  document_quality: Number,      // Document quality score
  face_region_detected: Boolean, // Whether a face region was detected
  created_at: String             // ISO timestamp
}
```

**Indexes:**
- `{ user_id: 1, created_at: -1 }` - For querying user's documents
- `{ document_type: 1, created_at: -1 }` - For querying by document type

## API Endpoints

### Voice Enrollment
**POST** `/api/voice/enroll`

Now stores audio samples in `voice_enrollment_samples` collection automatically.

### Voice Verification
**POST** `/api/voice/verify`

Now stores verification audio samples in `voice_verification_samples` collection automatically.

### Liveness Check
**POST** `/api/liveness/check`

Now stores facial images in `face_liveness_images` collection automatically.

### Document Upload
**POST** `/api/document/upload`

Now stores document images in `document_images` collection automatically.

### Admin - Get Voice Samples
**GET** `/api/admin/voice-samples?userId={userId}&type={enrollment|verification}`

Retrieves all voice samples for a user (without audio buffers for performance).

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "enrollment",
    "userId": "user123",
    "count": 3,
    "samples": [
      {
        "id": "sample-uuid",
        "user_id": "user123",
        "session_id": "session-id",
        "sample_number": 1,
        "audio_url": "https://...",
        "mime_type": "audio/webm",
        "file_size": 45678,
        "quality_score": 0.92,
        "has_audio_buffer": true,
        "audio_buffer_size": 61024,
        "created_at": "2025-11-08T10:30:00Z"
      }
    ]
  }
}
```

### Admin - Get Specific Sample with Audio
**POST** `/api/admin/voice-samples`

Retrieves a specific voice sample, optionally including the audio buffer.

**Request Body:**
```json
{
  "sampleId": "sample-uuid",
  "type": "enrollment",
  "includeAudio": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sample-uuid",
    "user_id": "user123",
    "audio_buffer": "base64-encoded-audio-data...",
    "audio_url": "https://...",
    ...
  }
}
```

### Admin - Get Face Images
**GET** `/api/admin/face-images?userId={userId}`

Retrieves all face liveness images for a user (without image buffers for performance).

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "count": 5,
    "images": [
      {
        "id": "image-uuid",
        "user_id": "user123",
        "image_url": "https://...",
        "mime_type": "image/jpeg",
        "file_size": 156789,
        "liveness_score": 0.89,
        "is_live": true,
        "has_image_buffer": true,
        "image_buffer_size": 209052,
        "created_at": "2025-11-08T10:30:00Z"
      }
    ]
  }
}
```

### Admin - Get Specific Face Image with Data
**POST** `/api/admin/face-images`

Retrieves a specific face image, optionally including the image buffer.

**Request Body:**
```json
{
  "imageId": "image-uuid",
  "includeImage": true
}
```

### Admin - Get Document Images
**GET** `/api/admin/document-images?userId={userId}&documentType={id_card|passport|...}`

Retrieves all document images for a user, optionally filtered by document type.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "documentType": "all",
    "count": 2,
    "images": [
      {
        "id": "doc-image-uuid",
        "user_id": "user123",
        "document_type": "id_card",
        "image_url": "https://...",
        "mime_type": "image/jpeg",
        "file_size": 2456789,
        "extracted_text": "ID: 1234567...",
        "tamper_detected": false,
        "ocr_confidence": 0.92,
        "has_image_buffer": true,
        "created_at": "2025-11-08T10:30:00Z"
      }
    ]
  }
}
```

### Admin - Get Specific Document Image with Data
**POST** `/api/admin/document-images`

Retrieves a specific document image, optionally including the image buffer.

**Request Body:**
```json
{
  "imageId": "doc-image-uuid",
  "includeImage": true
}
```

## Storage Considerations

### Size Management

Audio files and images are stored as Base64-encoded strings in MongoDB. Typical sizes:

**Audio Files:**
- **WebM audio** (mobile): ~30-100 KB per 3-5 second sample
- **WAV audio**: ~100-500 KB per 3-5 second sample

**Images:**
- **JPEG images** (compressed): ~100-500 KB per image
- **PNG images**: ~200-1000 KB per image
- **Document scans**: ~500 KB - 5 MB per document

For 3 enrollment samples per user:
- **Voice**: ~90-300 KB (WebM) or ~300-1500 KB (WAV) per user enrollment
- **Liveness**: ~100-500 KB per liveness check
- **Documents**: ~500 KB - 5 MB per document upload

### Best Practices

1. **Use appropriate formats**: 
   - WebM for audio (good compression for mobile)
   - JPEG for photos (good compression with quality)
   - PNG for documents requiring clarity
2. **Limit sample duration**: Keep voice samples under 5 seconds
3. **Compress images**: Use appropriate compression for images before upload
4. **Clean up old samples**: Implement retention policies if needed
5. **Monitor storage**: Use MongoDB storage metrics to track growth

### MongoDB Storage Limits

- **Document size limit**: 16 MB per document
- **Collection size**: Unlimited (with proper indexing)
- **Recommended**: Keep audio samples under 1 MB each, images under 5 MB each

## Usage Examples

### Retrieving User's Enrollment Samples

```bash
curl -X GET "http://localhost:4000/api/admin/voice-samples?userId=user123&type=enrollment"
```

### Retrieving User's Verification History

```bash
curl -X GET "http://localhost:4000/api/admin/voice-samples?userId=user123&type=verification"
```

### Getting User's Face Images

```bash
curl -X GET "http://localhost:4000/api/admin/face-images?userId=user123"
```

### Getting User's Document Images

```bash
curl -X GET "http://localhost:4000/api/admin/document-images?userId=user123&documentType=id_card"
```

### Getting Specific Sample with Audio

```bash
curl -X POST http://localhost:4000/api/admin/voice-samples \
  -H "Content-Type: application/json" \
  -d '{
    "sampleId": "sample-uuid",
    "type": "enrollment",
    "includeAudio": true
  }'
```

### Getting Specific Face Image with Data

```bash
curl -X POST http://localhost:4000/api/admin/face-images \
  -H "Content-Type: application/json" \
  -d '{
    "imageId": "image-uuid",
    "includeImage": true
  }'
```

### Playing Audio from Base64

```javascript
// In browser or mobile app
const base64Audio = response.data.audio_buffer;
const mimeType = response.data.mime_type;

// Create audio blob
const audioBlob = new Blob(
  [Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))],
  { type: mimeType }
);

// Create playable URL
const audioUrl = URL.createObjectURL(audioBlob);

// Play audio
const audio = new Audio(audioUrl);
audio.play();
```

### Displaying Image from Base64

```javascript
// In browser or mobile app
const base64Image = response.data.image_buffer;
const mimeType = response.data.mime_type;

// Create data URL
const imageDataUrl = `data:${mimeType};base64,${base64Image}`;

// Display in img tag
const imgElement = document.getElementById('myImage');
imgElement.src = imageDataUrl;

// Or download as file
const downloadLink = document.createElement('a');
downloadLink.href = imageDataUrl;
downloadLink.download = 'image.jpg';
downloadLink.click();
```

## Database Maintenance

### Create Indexes

Run the index creation script after setting up:

```bash
cd apps/web
node utils/create-indexes.cjs
```

### Query Examples

**Find all enrollment samples for a user:**
```javascript
db.voice_enrollment_samples.find({ user_id: "user123" }).sort({ created_at: -1 })
```

**Find recent verification attempts:**
```javascript
db.voice_verification_samples.find({ 
  created_at: { $gte: "2025-11-01T00:00:00Z" } 
}).sort({ created_at: -1 })
```

**Find all live face images:**
```javascript
db.face_liveness_images.find({ is_live: true }).sort({ created_at: -1 })
```

**Find documents with tampering detected:**
```javascript
db.document_images.find({ tamper_detected: true }).sort({ created_at: -1 })
```

**Get verification success rate for a user:**
```javascript
db.voice_verification_samples.aggregate([
  { $match: { user_id: "user123" } },
  { $group: {
    _id: null,
    total: { $sum: 1 },
    successful: { $sum: { $cond: ["$is_match", 1, 0] } }
  }}
])
```

**Get liveness check statistics:**
```javascript
db.face_liveness_images.aggregate([
  { $group: {
    _id: "$user_id",
    total_checks: { $sum: 1 },
    successful: { $sum: { $cond: ["$is_live", 1, 0] } },
    avg_liveness_score: { $avg: "$liveness_score" }
  }}
])
```

## Benefits

1. **Complete Audit Trail**: All voice samples and images are preserved for security and compliance
2. **Debugging**: Can replay and analyze failed verifications
3. **Quality Improvement**: Can retrain ML models with stored samples
4. **Compliance**: Meet data retention requirements
5. **Analytics**: Track verification patterns and success rates
6. **Forensics**: Investigate suspicious activities with full image/audio history
7. **User Support**: Help users troubleshoot verification issues by reviewing their attempts

## Future Enhancements

- [ ] Implement TTL indexes for automatic cleanup of old samples
- [ ] Add audio/image compression before storage
- [ ] Implement sample export functionality
- [ ] Add admin UI for playing back audio samples and viewing images
- [ ] Implement batch analysis tools
- [ ] Add face comparison across liveness and document images
- [ ] Implement automatic quality scoring and filtering
- [ ] Add encryption at rest for sensitive biometric data
