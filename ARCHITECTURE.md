# Biometric Verification System - Architecture Guide

## 🏗️ Complete System Architecture

This is a **monorepo** containing multiple services for biometric verification. The system supports voice authentication, facial liveness detection, and document verification.

### Repository Structure

```
create-anything/
├── apps/
│   ├── web/              ⭐ PRIMARY BACKEND + FRONTEND
│   │   ├── src/app/api/  → API routes (voice, liveness, document, admin)
│   │   ├── src/app/      → Frontend pages (React Router)
│   │   └── public/       → Static files
│   │
│   └── mobile/           📱 Mobile App (React Native/Expo)
│       ├── src/app/      → App screens (Expo Router)
│       ├── src/services/ → API integration
│       └── src/components/
│
├── api/                  🔧 Legacy/Alternative Backend (Express + TypeScript)
│   ├── src/controllers/
│   ├── src/services/
│   └── src/routes/
│
├── ml-service/           🤖 Machine Learning Service (Python/FastAPI)
│   ├── app/main.py       → ML endpoints
│   └── tests/            → API tests
│
├── mobile-app/           📱 Legacy Mobile App
├── dashboard/            📊 Legacy Dashboard
├── scripts/              🛠️ Database utilities
└── infra/                🐳 Infrastructure (Docker, etc.)
```

## 🎯 Primary Stack (apps/web)

### Technology

- **Framework**: React Router v7
- **Frontend**: React + Chakra UI
- **Backend**: React Router API routes (Node.js)
- **Database**: MongoDB (primary), PostgreSQL (optional)
- **Storage**: Cloudinary (images, audio, documents)
- **Auth**: Auth.js (formerly NextAuth)

### API Routes (`apps/web/src/app/api/`)

```
/api/
├── voice/
│   ├── enroll/         → Voice enrollment (3 samples)
│   └── verify/         → Voice verification
│
├── liveness/
│   └── check/          → Facial liveness detection
│
├── document/
│   └── upload/         → Document upload & OCR
│
├── admin/
│   ├── users/          → User management
│   ├── voice-samples/  → Voice sample admin
│   ├── face-images/    → Face image admin
│   └── document-images/→ Document admin
│
└── auth/
    └── *               → Authentication endpoints
```

### Storage Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Upload                        │
│              (Voice/Face/Document Data)                  │
└──────────────────────┬──────────────────────────────────┘
                       ▼
        ┌──────────────────────────────┐
        │   apps/web/src/app/api/*     │
        │      (API Route Handler)     │
        └──────────────┬───────────────┘
                       ▼
        ┌──────────────────────────────┐
        │  src/app/api/utils/upload.js │
        │    (Upload Orchestrator)     │
        └──────────────┬───────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │Cloudinary│  │External │  │  Local  │
    │ PRIMARY  │  │   API   │  │Fallback │
    └────┬────┘  └─────────┘  └─────────┘
         │
         ▼
    ┌─────────────────────────────────────┐
    │ CDN URL: https://res.cloudinary.com │
    │   /dzzaebsfc/image/upload/...       │
    └─────────────────────────────────────┘
         │
         ▼
    ┌─────────────────────────────────────┐
    │         MongoDB Collections          │
    │  • voice_enrollment_samples          │
    │  • voice_verification_samples        │
    │  • face_liveness_images              │
    │  • document_images                   │
    │                                      │
    │  Stores:                             │
    │  - Cloudinary URL (primary)          │
    │  - Public ID (for deletion)          │
    │  - Base64 backup (redundancy)        │
    │  - Metadata (scores, timestamps)     │
    └─────────────────────────────────────┘
```

## 🔧 Secondary Stack (api/)

### Technology

- **Framework**: Express.js
- **Language**: TypeScript
- **Purpose**: Alternative/legacy backend API

### When to Use

- If you need a separate API service
- For microservices architecture
- For backward compatibility

### Configuration

```bash
# api/.env
PORT=3000
ML_SERVICE_URL=http://localhost:8000
CLOUDINARY_CLOUD_NAME=dzzaebsfc
CLOUDINARY_API_KEY=541276445497123
CLOUDINARY_API_SECRET=SnSoEdqRpc1LTzMkYzVlA_6phPE
```

## 🤖 ML Service (ml-service/)

### Technology

- **Framework**: FastAPI (Python)
- **Purpose**: Machine learning endpoints
- **Port**: 8000 (default)

### Endpoints

```python
POST /voice/enroll        # Voice enrollment
POST /voice/verify        # Voice verification
POST /liveness/check      # Facial liveness
POST /document/verify     # Document OCR & tamper detection
GET  /health              # Health check
```

### Start ML Service

```bash
cd ml-service
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## ☁️ Cloudinary Integration

### Configuration

All services use the same Cloudinary account:

```bash
CLOUDINARY_CLOUD_NAME=dzzaebsfc
CLOUDINARY_API_KEY=541276445497123
CLOUDINARY_API_SECRET=SnSoEdqRpc1LTzMkYzVlA_6phPE
```

### Free Tier Limits

- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month

### Dashboard

https://cloudinary.com/console/dzzaebsfc

### Folder Structure

```
biometric-verification/
├── voice-samples/
│   ├── enrollment/
│   └── verification/
├── face-images/
│   └── liveness/
└── documents/
    ├── id-cards/
    ├── passports/
    └── other/
```

## 📱 Mobile Apps

### Primary: apps/mobile (Expo)

```bash
cd apps/mobile
npm install
npx expo start
```

**Features:**
- Voice enrollment & verification
- Facial liveness detection
- Document scanning
- Real-time feedback

### Legacy: mobile-app

Alternative mobile implementation (older codebase)

## 🗄️ Database Architecture

### MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `users` | User accounts |
| `auth_users` | Auth.js users |
| `auth_accounts` | OAuth accounts |
| `voice_profiles` | Voice enrollment status |
| `voice_enrollment_sessions` | Active enrollment sessions |
| `voice_enrollment_samples` | Voice samples (enrollment) |
| `voice_verification_samples` | Voice samples (verification) |
| `face_liveness_images` | Facial images with liveness |
| `document_images` | Document scans with OCR |
| `documents` | Document metadata |
| `verification_requests` | Verification workflows |
| `audit_logs` | Security audit trail |
| `notifications` | User notifications |
| `notification_devices` | Push notification tokens |

### Indexes

Automatically created by `apps/web/utils/create-indexes.cjs`

```bash
cd apps/web
node utils/create-indexes.cjs
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
# Root level (installs all workspaces)
npm install

# Individual services
cd apps/web && npm install
cd apps/mobile && npm install
cd api && npm install
```

### 2. Configure Environment

```bash
# apps/web/.env
cp apps/web/.env.example apps/web/.env
# Edit with your MongoDB URI and Cloudinary credentials

# api/.env (if using api service)
cp api/.env.example api/.env

# ml-service/.env (optional)
```

### 3. Start Services

**Option A: Primary Stack (apps/web)**

```bash
cd apps/web
npm run dev
# Starts on http://localhost:4000
```

**Option B: Full Stack**

```bash
# Terminal 1: Web Backend
cd apps/web
npm run dev

# Terminal 2: ML Service
cd ml-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000

# Terminal 3: Mobile App
cd apps/mobile
npx expo start
```

### 4. Create Database Indexes

```bash
cd apps/web
node utils/create-indexes.cjs
```

### 5. Access Services

- **Web App**: http://localhost:4000
- **ML Service**: http://localhost:8000
- **ML Docs**: http://localhost:8000/docs
- **Mobile**: Expo QR code or emulator

## 📚 Documentation

- **[CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md)** - Complete Cloudinary guide
- **[CLOUDINARY_QUICKSTART.md](./CLOUDINARY_QUICKSTART.md)** - Quick start guide
- **[VOICE_AUDIO_STORAGE.md](./VOICE_AUDIO_STORAGE.md)** - Voice & image storage
- **[BIOMETRIC_STORAGE_IMPLEMENTATION.md](./BIOMETRIC_STORAGE_IMPLEMENTATION.md)** - Implementation details
- **[SETUP.md](./SETUP.md)** - Initial setup guide
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing procedures

## 🔒 Security Features

- ✅ JWT authentication
- ✅ Rate limiting
- ✅ CORS protection
- ✅ HTTPS for all external URLs
- ✅ Secure session management
- ✅ Audit logging
- ✅ Encrypted credentials

## 🧪 Testing

```bash
# Web app tests
cd apps/web
npm test

# ML service tests
cd ml-service
pytest

# API tests
cd api
npm test
```

## 📦 Production Deployment

### apps/web (Primary)

```bash
cd apps/web
npm run build
npm start  # Production server
```

### Environment Variables

Ensure all services have:
- MongoDB connection strings
- Cloudinary credentials
- JWT secrets
- Proper CORS origins

## 🤝 Contributing

1. Follow existing code structure
2. Update documentation
3. Write tests for new features
4. Follow TypeScript/Python best practices

## 📄 License

[Your License]

## 🆘 Support

For issues:
1. Check documentation files
2. Review error logs
3. Test with ML service health endpoint
4. Verify Cloudinary configuration

---

**Primary Service**: `apps/web` (React Router + MongoDB + Cloudinary)
**ML Service**: `ml-service` (FastAPI + Python)
**Mobile**: `apps/mobile` (Expo + React Native)
